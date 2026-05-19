const STORAGE_KEY = "nightBrightSettings";
const HOST_ID = "night-bright-host";
const SURFACE_CLASS = "night-bright-reading-surface";
const TEXT_CLASS = "night-bright-reading-text";
const model = globalThis.NightBrightModel;

let host;
let primaryOverlay;
let secondaryOverlay;
let mutationObserver;
let readingRefreshTimer = 0;
let activeSettings = model.createDefaultSettings();
let activeCombined = model.defaultContentAdjust();
let readingSurfaces = new Set();
let readingTexts = new Set();

function grayColor(level) {
  const channel = Math.round(model.clamp01(level) * 255);
  return `rgb(${channel}, ${channel}, ${channel})`;
}

function extractBrightnessFactors(filter) {
  const factors = [];
  const matches = filter.matchAll(/brightness\(([^)]+)\)/gi);

  for (const match of matches) {
    const rawValue = match[1].trim();
    const value = rawValue.endsWith("%")
      ? Number(rawValue.slice(0, -1)) / 100
      : Number(rawValue);

    if (!Number.isNaN(value)) {
      factors.push(model.clamp(value, 0, 5));
    }
  }

  return factors;
}

function calculateCanvasGray(results, combined) {
  let canvasGray = 1;

  for (const result of results) {
    for (const brightness of extractBrightnessFactors(result.filter)) {
      canvasGray *= brightness;
    }

    if (result.overlay.mixBlendMode === "multiply") {
      canvasGray *= 1 - result.overlay.opacity * 0.72;
    }
  }

  if (combined.readingAmount > 0.01) {
    canvasGray = Math.min(
      canvasGray,
      model.lerp(1, combined.darkSurface, combined.readingAmount)
    );
  }

  if (combined.localSuppression > 0.01) {
    canvasGray *= 1 - combined.localSuppression * 0.18;
  }

  if (combined.rodAmount > 0.01) {
    canvasGray *= 1 - combined.rodAmount * (1 - combined.rodCeiling) * 0.24;
  }

  return model.clamp(canvasGray, 0.04, 1);
}

function ensureHost() {
  if (host && document.body.contains(host)) {
    return;
  }

  host = document.createElement("div");
  host.id = HOST_ID;
  host.style.setProperty("all", "initial", "important");
  host.style.setProperty("position", "fixed", "important");
  host.style.setProperty("inset", "0", "important");
  host.style.setProperty("width", "100vw", "important");
  host.style.setProperty("height", "100vh", "important");
  host.style.setProperty("pointer-events", "none", "important");
  host.style.setProperty("z-index", "2147483647", "important");
  host.style.setProperty("contain", "strict", "important");

  const shadowRoot = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = `
    :host {
      all: initial;
    }

    .layer {
      position: fixed;
      inset: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      opacity: 0;
      z-index: 2147483647;
      transition:
        opacity var(--night-bright-transition, 450ms) cubic-bezier(0.2, 0.8, 0.2, 1),
        background var(--night-bright-transition, 450ms) cubic-bezier(0.2, 0.8, 0.2, 1),
        backdrop-filter var(--night-bright-transition, 450ms) cubic-bezier(0.2, 0.8, 0.2, 1);
    }
  `;

  primaryOverlay = document.createElement("div");
  primaryOverlay.className = "layer";

  secondaryOverlay = document.createElement("div");
  secondaryOverlay.className = "layer";

  shadowRoot.append(style, primaryOverlay, secondaryOverlay);
  document.body.append(host);
}

function applyOverlay(target, overlay, transitionMs) {
  target.style.setProperty("--night-bright-transition", `${transitionMs}ms`);
  target.style.opacity = overlay.opacity.toFixed(3);
  target.style.background = overlay.background;
  target.style.mixBlendMode = overlay.mixBlendMode;
  target.style.backdropFilter = overlay.backdropFilter;
  target.style.webkitBackdropFilter = overlay.backdropFilter;
}

function clearReadingClasses() {
  for (const element of readingSurfaces) {
    element.classList.remove(SURFACE_CLASS);
  }
  for (const element of readingTexts) {
    element.classList.remove(TEXT_CLASS);
  }
  readingSurfaces = new Set();
  readingTexts = new Set();
}

function parseColor(value) {
  const match = value.match(/rgba?\(([^)]+)\)/i);
  if (!match) {
    return null;
  }

  const parts = match[1]
    .replace(/\s*\/\s*/, " ")
    .split(/[\s,]+/)
    .filter(Boolean);
  const r = Number(parts[0]);
  const g = Number(parts[1]);
  const b = Number(parts[2]);
  const a = parts[3] === undefined
    ? 1
    : parts[3].endsWith("%")
      ? Number(parts[3].slice(0, -1)) / 100
      : Number(parts[3]);

  if ([r, g, b, a].some((part) => Number.isNaN(part))) {
    return null;
  }

  return { r, g, b, a };
}

function luminanceFromColor(color) {
  return 0.2126 * (color.r / 255) + 0.7152 * (color.g / 255) + 0.0722 * (color.b / 255);
}

function saturationFromColor(color) {
  const max = Math.max(color.r, color.g, color.b);
  const min = Math.min(color.r, color.g, color.b);
  return (max - min) / 255;
}

function isVisibleElement(element, style) {
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width >= 140 && rect.height >= 50 && rect.width * rect.height >= 14000;
}

function isWhiteSurfaceCandidate(element, whiteThreshold) {
  if (element.id === HOST_ID || element.closest(`#${HOST_ID}`) || element.closest(`.${SURFACE_CLASS}`)) {
    return false;
  }

  const tag = element.tagName;
  if (tag === "HTML" || tag === "BODY" || tag === "IMG" || tag === "VIDEO" || tag === "CANVAS" || tag === "SVG") {
    return false;
  }

  const style = getComputedStyle(element);
  if (!isVisibleElement(element, style)) {
    return false;
  }

  const background = parseColor(style.backgroundColor);
  if (!background || background.a < 0.85) {
    return false;
  }

  return (
    luminanceFromColor(background) >= whiteThreshold &&
    saturationFromColor(background) <= 0.12
  );
}

function isDarkTextCandidate(element) {
  const style = getComputedStyle(element);
  const color = parseColor(style.color);
  if (!color) {
    return false;
  }

  return luminanceFromColor(color) <= 0.22 && saturationFromColor(color) <= 0.28;
}

function applyReadingMode(combined) {
  clearReadingClasses();

  if (!document.body || combined.readingAmount <= 0.01) {
    return;
  }

  const readingGray = model.lerp(1, combined.darkSurface, combined.readingAmount);
  const cappedText = model.clamp01(combined.darkSurface + combined.contrastCap);
  const readingText = model.lerp(0, cappedText, combined.readingAmount);
  const borderAlpha = model.lerp(0.08, 0.18, combined.readingAmount);

  document.documentElement.style.setProperty("--night-bright-reading-bg", grayColor(readingGray));
  document.documentElement.style.setProperty("--night-bright-reading-text", grayColor(readingText));
  document.documentElement.style.setProperty(
    "--night-bright-reading-border",
    `rgba(${Math.round(model.lerp(0, 255, combined.readingAmount))}, ${Math.round(model.lerp(0, 255, combined.readingAmount))}, ${Math.round(model.lerp(0, 255, combined.readingAmount))}, ${borderAlpha.toFixed(3)})`
  );

  const nodes = Array.from(document.body.querySelectorAll("*"));
  let surfacesFound = 0;

  for (const element of nodes) {
    if (surfacesFound >= 180) {
      break;
    }

    if (!isWhiteSurfaceCandidate(element, combined.whiteThreshold)) {
      continue;
    }

    element.classList.add(SURFACE_CLASS);
    readingSurfaces.add(element);
    surfacesFound += 1;

    const textNodes = element.querySelectorAll("p, span, li, td, th, small, strong, em, a, h1, h2, h3, h4, h5, h6, button, label");
    let textHits = 0;

    for (const textElement of textNodes) {
      if (textHits >= 120) {
        break;
      }

      if (!isDarkTextCandidate(textElement)) {
        continue;
      }

      textElement.classList.add(TEXT_CLASS);
      readingTexts.add(textElement);
      textHits += 1;
    }
  }
}

function applyMediaAdjustments(combined) {
  const localFactor = model.clamp01(
    combined.localSuppression *
    model.lerp(0.65, 1.15, model.clamp01((0.3 - combined.localSensitivity) / 0.28))
  );

  const imageBrightness = model.clamp(
    1 - localFactor * 0.26 - combined.rodAmount * (1 - combined.rodCeiling) * 0.34,
    0.42,
    1
  );
  const imageContrast = model.clamp(1 - localFactor * 0.12 - combined.rodAmount * 0.08, 0.74, 1);
  const imageSaturation = model.clamp(
    1 - localFactor * 0.16 - combined.rodAmount * combined.rodDesaturation * 0.72,
    0.16,
    1
  );
  const warmHue = model.clamp01(combined.rodAmount * (1 - combined.rodBlueScale));

  document.documentElement.style.setProperty(
    "--night-bright-media-filter",
    model.composeFilter([
      `brightness(${model.cssNumber(imageBrightness)})`,
      `contrast(${model.cssNumber(imageContrast)})`,
      `saturate(${model.cssNumber(imageSaturation)})`,
      warmHue > 0.01 ? `sepia(${model.cssNumber(warmHue * 0.22)})` : ""
    ])
  );
}

function isEffectEnabled(results, combined) {
  return results.some((result) => result.filter !== "none" || result.overlay.opacity > 0.001) ||
    combined.readingAmount > 0.01 ||
    combined.localSuppression > 0.01 ||
    combined.rodAmount > 0.01;
}

function applySettings(settings) {
  if (!document.body) {
    return;
  }

  ensureHost();
  activeSettings = settings;

  const results = model.SLOT_KEYS.map((slotKey) => {
    const slot = settings.slots[slotKey];
    return model.buildSlotResult(slot.method, slot.method === "none" ? {} : slot.values[slot.method]);
  });

  const combined = model.combineContentAdjustments(results);
  activeCombined = combined;

  applyOverlay(primaryOverlay, results[0].overlay, settings.transitionMs);
  applyOverlay(secondaryOverlay, results[1].overlay, settings.transitionMs);

  document.documentElement.style.setProperty("--night-bright-transition", `${settings.transitionMs}ms`);
  document.documentElement.style.setProperty(
    "--night-bright-page-filter",
    model.composeFilter(
      results.map((result) => (result.filter === "none" ? "" : result.filter))
    )
  );
  document.documentElement.style.setProperty("--night-bright-page-bg", grayColor(calculateCanvasGray(results, combined)));

  applyMediaAdjustments(combined);
  applyReadingMode(combined);

  if (isEffectEnabled(results, combined)) {
    document.documentElement.setAttribute("data-night-bright-enabled", "true");
  } else {
    document.documentElement.removeAttribute("data-night-bright-enabled");
    clearReadingClasses();
  }
}

function scheduleReadingRefresh() {
  if (activeCombined.readingAmount <= 0.01) {
    return;
  }

  clearTimeout(readingRefreshTimer);
  readingRefreshTimer = window.setTimeout(() => {
    applyReadingMode(activeCombined);
  }, 220);
}

async function loadSettings() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  return model.mergeSettings(stored[STORAGE_KEY]);
}

function watchStorage() {
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local" || !changes[STORAGE_KEY]) {
      return;
    }

    applySettings(model.mergeSettings(changes[STORAGE_KEY].newValue));
  });
}

function watchDom() {
  mutationObserver = new MutationObserver((mutations) => {
    const relevantMutation = mutations.some((mutation) =>
      Array.from(mutation.addedNodes).some((node) =>
        node.nodeType === Node.ELEMENT_NODE && node.id !== HOST_ID
      )
    );

    if (relevantMutation) {
      scheduleReadingRefresh();
    }
  });

  mutationObserver.observe(document.body, {
    childList: true,
    subtree: true
  });
}

async function initialize() {
  if (!document.body) {
    return;
  }

  ensureHost();
  watchStorage();
  watchDom();
  applySettings(await loadSettings());
}

if (document.body) {
  initialize().catch(console.error);
} else {
  window.addEventListener("DOMContentLoaded", () => {
    initialize().catch(console.error);
  }, { once: true });
}
