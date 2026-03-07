const SLOT_KEYS = ["primary", "secondary"];

const PLACEHOLDER_IMAGES = [
  {
    title: "Skyline Glow",
    subtitle: "Bright windows and cool light",
    colors: ["#1c2945", "#4d6da5", "#f1c56a"],
    accent: "#f4efe2"
  },
  {
    title: "Desk Lamp",
    subtitle: "Warm pool on a pale desk",
    colors: ["#3b2719", "#b9804f", "#f4dfb3"],
    accent: "#fff8e6"
  },
  {
    title: "Forest Trail",
    subtitle: "Cool midtones after dusk",
    colors: ["#11271f", "#356456", "#adc6be"],
    accent: "#f4fff4"
  },
  {
    title: "Night Coast",
    subtitle: "Moonlight on dark water",
    colors: ["#162336", "#54789b", "#dde8ef"],
    accent: "#fbf6eb"
  }
];

const METHOD_DEFS = {
  none: {
    label: "No filter",
    description: "Leaves the live page unchanged.",
    params: []
  },
  warmth: {
    label: "Warmth",
    description: "Warms the page with reduced blue and a soft amber tint.",
    params: [
      {
        id: "greenScale",
        label: "Green scale",
        description: "Lower values suppress green more strongly.",
        min: 0.4,
        max: 1,
        step: 0.01,
        default: 0.85,
        format: "factor"
      },
      {
        id: "blueScale",
        label: "Blue scale",
        description: "Lower values suppress blue and increase warmth.",
        min: 0.2,
        max: 1,
        step: 0.01,
        default: 0.6,
        format: "factor"
      }
    ]
  },
  scalarDimming: {
    label: "Scalar dimming",
    description: "Uniform brightness scaling with a small shadow floor.",
    params: [
      {
        id: "dimScale",
        label: "Brightness scale",
        description: "Overall page brightness multiplier.",
        min: 0.1,
        max: 1,
        step: 0.01,
        default: 0.56,
        format: "factor"
      },
      {
        id: "shadowFloor",
        label: "Shadow floor",
        description: "Keeps dark details from collapsing too quickly.",
        min: 0,
        max: 0.16,
        step: 0.005,
        default: 0.03,
        format: "factor"
      }
    ]
  },
  gammaRemap: {
    label: "Gamma remapping",
    description: "Darkens mids and highlights while preserving some low-end lift.",
    params: [
      {
        id: "exponent",
        label: "Gamma exponent",
        description: "Higher values darken the midrange more aggressively.",
        min: 1,
        max: 3.5,
        step: 0.05,
        default: 1.8,
        format: "number"
      },
      {
        id: "shadowLift",
        label: "Shadow lift",
        description: "Retains some low-luminance visibility.",
        min: 0,
        max: 0.14,
        step: 0.005,
        default: 0.02,
        format: "factor"
      }
    ]
  },
  luminanceRemap: {
    label: "Luminance remap",
    description: "Compresses brightness more than color relationships.",
    params: [
      {
        id: "lumaGamma",
        label: "Luminance gamma",
        description: "Controls how hard the luminance curve bends.",
        min: 1,
        max: 3,
        step: 0.05,
        default: 1.72,
        format: "number"
      },
      {
        id: "lumaFloor",
        label: "Luminance floor",
        description: "Minimum brightness retained in deep shadows.",
        min: 0,
        max: 0.18,
        step: 0.005,
        default: 0.02,
        format: "factor"
      }
    ]
  },
  sigmoidContrast: {
    label: "Sigmoid contrast shaping",
    description: "Darkens the page while reshaping contrast around a chosen midpoint.",
    params: [
      {
        id: "midpoint",
        label: "Midpoint",
        description: "Center of the contrast transition.",
        min: 0.2,
        max: 0.8,
        step: 0.01,
        default: 0.44,
        format: "factor"
      },
      {
        id: "steepness",
        label: "Steepness",
        description: "Higher values produce a stronger shoulder and toe.",
        min: 1,
        max: 12,
        step: 0.1,
        default: 5.4,
        format: "number"
      }
    ]
  },
  softKnee: {
    label: "Soft-knee compression",
    description: "Compresses highlights with a gentler rollover.",
    params: [
      {
        id: "threshold",
        label: "Threshold",
        description: "Point where highlight compression starts.",
        min: 0.2,
        max: 0.9,
        step: 0.01,
        default: 0.58,
        format: "factor"
      },
      {
        id: "knee",
        label: "Knee softness",
        description: "Higher values soften the shoulder.",
        min: 0.05,
        max: 0.8,
        step: 0.01,
        default: 0.24,
        format: "factor"
      }
    ]
  },
  readingMode: {
    label: "Contrast-aware reading mode",
    description: "Dark-themes mostly white reading surfaces and caps the text contrast.",
    params: [
      {
        id: "whiteThreshold",
        label: "White threshold",
        description: "How aggressively bright surfaces are treated as white reading areas.",
        min: 0.65,
        max: 0.98,
        step: 0.01,
        default: 0.86,
        format: "factor"
      },
      {
        id: "contrastCap",
        label: "Max contrast span",
        description: "Limits the text to background contrast after remapping.",
        min: 0.2,
        max: 0.82,
        step: 0.01,
        default: 0.54,
        format: "factor"
      },
      {
        id: "darkSurface",
        label: "Dark surface level",
        description: "Target gray for the transformed white reading block.",
        min: 0.05,
        max: 0.3,
        step: 0.005,
        default: 0.14,
        format: "factor"
      }
    ]
  },
  highlightSuppression: {
    label: "Local highlight suppression",
    description: "Suppresses bright spots in images and reduces white-block glare.",
    params: [
      {
        id: "radius",
        label: "Neighborhood radius",
        description: "Approximate size of the bright region being suppressed.",
        min: 4,
        max: 60,
        step: 1,
        default: 18,
        format: "pixels"
      },
      {
        id: "sensitivity",
        label: "Sensitivity",
        description: "How easily bright regions trigger suppression.",
        min: 0.02,
        max: 0.3,
        step: 0.005,
        default: 0.12,
        format: "factor"
      },
      {
        id: "cap",
        label: "Suppression cap",
        description: "Upper limit for the local dimming strength.",
        min: 0.15,
        max: 0.95,
        step: 0.01,
        default: 0.72,
        format: "factor"
      }
    ]
  },
  rodFriendly: {
    label: "Rod friendly",
    description: "Reduces saturation and blue while narrowing the luminance range.",
    params: [
      {
        id: "desaturation",
        label: "Desaturation",
        description: "How far the page moves toward neutral gray.",
        min: 0,
        max: 1,
        step: 0.01,
        default: 0.68,
        format: "factor"
      },
      {
        id: "blueScale",
        label: "Blue scale",
        description: "How strongly blue-rich regions are reduced.",
        min: 0.2,
        max: 1,
        step: 0.01,
        default: 0.56,
        format: "factor"
      },
      {
        id: "ceiling",
        label: "Luminance ceiling",
        description: "Upper bound on the retained brightness range.",
        min: 0.25,
        max: 0.82,
        step: 0.01,
        default: 0.52,
        format: "factor"
      }
    ]
  }
};

const METHOD_ORDER = [
  "none",
  "warmth",
  "scalarDimming",
  "gammaRemap",
  "luminanceRemap",
  "sigmoidContrast",
  "softKnee",
  "readingMode",
  "highlightSuppression",
  "rodFriendly"
];

const dom = {
  primaryMethod: document.getElementById("primary-method"),
  secondaryMethod: document.getElementById("secondary-method"),
  primaryPanel: document.getElementById("primary-panel"),
  secondaryPanel: document.getElementById("secondary-panel"),
  primarySummary: document.getElementById("primary-summary"),
  secondarySummary: document.getElementById("secondary-summary"),
  transitionSlider: document.getElementById("transition-ms"),
  transitionValue: document.getElementById("transition-ms-value"),
  renderStatus: document.getElementById("render-status"),
  primaryWrapper: document.getElementById("primary-wrapper"),
  secondaryWrapper: document.getElementById("secondary-wrapper"),
  primaryOverlay: document.getElementById("primary-overlay"),
  secondaryOverlay: document.getElementById("secondary-overlay"),
  contentRoot: document.getElementById("content-root"),
  placeholderImages: Array.from(document.querySelectorAll("[data-placeholder]"))
};

const appState = {
  transitionMs: 450,
  slots: {
    primary: createSlotState("primary"),
    secondary: createSlotState("secondary")
  }
};

function createSlotState(slotKey) {
  const slotValues = {};
  const strengthDefault = slotKey === "primary" ? 0.72 : 0.38;

  for (const [methodKey, def] of Object.entries(METHOD_DEFS)) {
    if (methodKey === "none") {
      continue;
    }

    slotValues[methodKey] = { strength: strengthDefault };
    for (const param of def.params) {
      slotValues[methodKey][param.id] = param.default;
    }
  }

  return {
    method: "none",
    values: slotValues
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value) {
  return clamp(value, 0, 1);
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function formatValue(value, format) {
  if (format === "pixels") {
    return `${Math.round(value)} px`;
  }
  if (format === "number") {
    return value.toFixed(2).replace(/\.00$/, "");
  }
  if (format === "factor") {
    return `${Math.round(value * 100)}%`;
  }

  return String(value);
}

function populateSelect(select, slotKey) {
  const noneLabel = slotKey === "secondary" ? "No secondary effect" : "No filter";

  for (const methodKey of METHOD_ORDER) {
    const option = document.createElement("option");
    option.value = methodKey;
    option.textContent = methodKey === "none" ? noneLabel : METHOD_DEFS[methodKey].label;
    select.append(option);
  }
}

function createEmptyPanel(message) {
  const note = document.createElement("p");
  note.className = "empty-panel";
  note.textContent = message;
  return note;
}

function createSliderControl(slotKey, methodKey, param, values) {
  const wrapper = document.createElement("div");
  wrapper.className = "param-slider";

  const sliderHead = document.createElement("div");
  sliderHead.className = "slider-head";

  const label = document.createElement("label");
  label.className = "field-label";
  label.htmlFor = `${slotKey}-${methodKey}-${param.id}`;
  label.textContent = param.label;

  const output = document.createElement("output");
  output.className = "value-pill";
  output.htmlFor = label.htmlFor;
  output.textContent = formatValue(values[param.id], param.format);

  const copy = document.createElement("div");
  copy.className = "range-copy";

  const description = document.createElement("p");
  description.textContent = param.description;
  copy.append(description);

  const input = document.createElement("input");
  input.id = label.htmlFor;
  input.type = "range";
  input.min = String(param.min);
  input.max = String(param.max);
  input.step = String(param.step);
  input.value = String(values[param.id]);

  input.addEventListener("input", () => {
    appState.slots[slotKey].values[methodKey][param.id] = Number(input.value);
    output.textContent = formatValue(Number(input.value), param.format);
    applyAllEffects();
  });

  sliderHead.append(label, output);
  wrapper.append(sliderHead, copy, input);
  return wrapper;
}

function renderSlotPanel(slotKey) {
  const slot = appState.slots[slotKey];
  const panel = dom[`${slotKey}Panel`];
  const summary = dom[`${slotKey}Summary`];

  if (slot.method === "none") {
    panel.replaceChildren(
      createEmptyPanel(
        slotKey === "secondary"
          ? "Secondary layer disabled."
          : "No primary filter selected."
      )
    );
    summary.textContent = slotKey === "secondary"
      ? "Optional second layer for stacking."
      : METHOD_DEFS.none.description;
    return;
  }

  const def = METHOD_DEFS[slot.method];
  const values = slot.values[slot.method];
  const fragment = document.createDocumentFragment();

  fragment.append(createSliderControl(slotKey, slot.method, {
    id: "strength",
    label: "Effect strength",
    description: "Blends between the original page and this effect.",
    min: 0,
    max: 1,
    step: 0.01,
    format: "factor"
  }, values));

  for (const param of def.params) {
    fragment.append(createSliderControl(slotKey, slot.method, param, values));
  }

  panel.replaceChildren(fragment);
  summary.textContent = def.description;
}

function updateTransitionLabel() {
  dom.transitionValue.textContent = `${appState.transitionMs} ms`;
  document.documentElement.style.setProperty("--transition-ms", `${appState.transitionMs}ms`);
}

function cssNumber(value) {
  return clamp(value, 0, 5).toFixed(3);
}

function composeFilter(parts) {
  const cleanParts = parts.filter(Boolean);
  return cleanParts.length ? cleanParts.join(" ") : "none";
}

function grayColor(level) {
  const channel = Math.round(clamp01(level) * 255);
  return `rgb(${channel}, ${channel}, ${channel})`;
}

function buildPlaceholderSvg(entry) {
  const [top, mid, base] = entry.colors;
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1600 1000">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${top}"/>
          <stop offset="54%" stop-color="${mid}"/>
          <stop offset="100%" stop-color="${base}"/>
        </linearGradient>
        <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity="0.24"/>
          <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
        </linearGradient>
      </defs>
      <rect width="1600" height="1000" fill="url(#bg)"/>
      <circle cx="1220" cy="210" r="160" fill="${entry.accent}" opacity="0.85"/>
      <circle cx="1280" cy="250" r="56" fill="#ffffff" opacity="0.55"/>
      <path d="M0 760 C240 630 380 850 640 740 C870 640 1040 870 1600 690 L1600 1000 L0 1000 Z" fill="#0c1216" opacity="0.34"/>
      <rect x="74" y="78" width="500" height="170" rx="28" fill="url(#panel)" stroke="#ffffff" stroke-opacity="0.22"/>
      <text x="118" y="154" fill="white" font-family="Arial, sans-serif" font-size="60" font-weight="700">${entry.title}</text>
      <text x="118" y="204" fill="#ffffff" fill-opacity="0.88" font-family="Arial, sans-serif" font-size="34">${entry.subtitle}</text>
      <rect x="76" y="838" width="340" height="92" rx="24" fill="#ffffff" fill-opacity="0.14" stroke="#ffffff" stroke-opacity="0.24"/>
      <text x="118" y="896" fill="white" font-family="Arial, sans-serif" font-size="34">Placeholder image</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function renderPlaceholders() {
  dom.placeholderImages.forEach((image, index) => {
    image.src = buildPlaceholderSvg(PLACEHOLDER_IMAGES[index % PLACEHOLDER_IMAGES.length]);
  });
}

function defaultOverlay() {
  return {
    opacity: 0,
    background: "transparent",
    mixBlendMode: "normal",
    backdropFilter: "none"
  };
}

function defaultContentAdjust() {
  return {
    readingAmount: 0,
    whiteThreshold: 0.86,
    contrastCap: 0.54,
    darkSurface: 0.14,
    localSuppression: 0,
    localRadius: 18,
    localSensitivity: 0.12,
    rodAmount: 0,
    rodDesaturation: 0.68,
    rodBlueScale: 0.56,
    rodCeiling: 0.52
  };
}

function buildSlotResult(methodKey, values) {
  if (methodKey === "none") {
    return {
      filter: "none",
      overlay: defaultOverlay(),
      content: defaultContentAdjust()
    };
  }

  const amount = values.strength;

  switch (methodKey) {
    case "warmth": {
      const greenLoss = 1 - values.greenScale;
      const blueLoss = 1 - values.blueScale;

      return {
        filter: composeFilter([
          `saturate(${cssNumber(1 - amount * (blueLoss * 0.18 + greenLoss * 0.06))})`,
          `brightness(${cssNumber(1 - amount * (blueLoss * 0.07 + greenLoss * 0.03))})`
        ]),
        overlay: {
          opacity: clamp01(amount * (0.14 + blueLoss * 0.42 + greenLoss * 0.18)),
          background: "linear-gradient(180deg, rgba(255, 184, 112, 0.72), rgba(255, 116, 78, 0.48))",
          mixBlendMode: "multiply",
          backdropFilter: "none"
        },
        content: defaultContentAdjust()
      };
    }

    case "scalarDimming": {
      const brightness = lerp(1, values.dimScale, amount);
      const contrast = lerp(1, 1 - values.shadowFloor * 0.4, amount);

      return {
        filter: composeFilter([
          `brightness(${cssNumber(brightness)})`,
          `contrast(${cssNumber(contrast)})`
        ]),
        overlay: {
          opacity: clamp01(amount * (1 - values.dimScale) * 0.22),
          background: "rgba(6, 8, 10, 0.92)",
          mixBlendMode: "multiply",
          backdropFilter: "none"
        },
        content: defaultContentAdjust()
      };
    }

    case "gammaRemap": {
      const gammaDepth = amount * ((values.exponent - 1) / 2.5);
      const brightness = 1 - gammaDepth * 0.32 + values.shadowLift * amount * 0.55;
      const contrast = 1 + gammaDepth * 0.1;

      return {
        filter: composeFilter([
          `brightness(${cssNumber(brightness)})`,
          `contrast(${cssNumber(contrast)})`,
          `saturate(${cssNumber(1 - gammaDepth * 0.06)})`
        ]),
        overlay: {
          opacity: clamp01(gammaDepth * 0.14),
          background: "linear-gradient(180deg, rgba(5, 6, 8, 0.78), rgba(28, 22, 18, 0.2))",
          mixBlendMode: "multiply",
          backdropFilter: "none"
        },
        content: defaultContentAdjust()
      };
    }

    case "luminanceRemap": {
      const curve = amount * ((values.lumaGamma - 1) / 2);
      const brightness = 1 - curve * 0.27 + values.lumaFloor * amount * 0.5;

      return {
        filter: composeFilter([
          `brightness(${cssNumber(brightness)})`,
          `saturate(${cssNumber(1 - amount * 0.08)})`,
          `contrast(${cssNumber(1 - amount * 0.03)})`
        ]),
        overlay: {
          opacity: clamp01(curve * 0.12),
          background: "rgba(8, 9, 11, 0.88)",
          mixBlendMode: "multiply",
          backdropFilter: "none"
        },
        content: defaultContentAdjust()
      };
    }

    case "sigmoidContrast": {
      const contrastPush = amount * ((values.steepness - 1) / 11);
      const midpointBias = 0.5 - values.midpoint;
      const brightness = 1 - amount * 0.16 - midpointBias * amount * 0.12;
      const contrast = 1 + contrastPush * 0.42;

      return {
        filter: composeFilter([
          `brightness(${cssNumber(brightness)})`,
          `contrast(${cssNumber(contrast)})`
        ]),
        overlay: {
          opacity: clamp01(amount * 0.08),
          background: "linear-gradient(180deg, rgba(12, 12, 16, 0.3), rgba(8, 8, 10, 0.78))",
          mixBlendMode: "multiply",
          backdropFilter: "none"
        },
        content: defaultContentAdjust()
      };
    }

    case "softKnee": {
      const headroom = 1 - values.threshold;
      const brightness = 1 - amount * (0.08 + headroom * 0.22);
      const contrast = 1 - amount * values.knee * 0.15;

      return {
        filter: composeFilter([
          `brightness(${cssNumber(brightness)})`,
          `contrast(${cssNumber(contrast)})`
        ]),
        overlay: {
          opacity: clamp01(amount * (0.12 + headroom * 0.3)),
          background: "linear-gradient(180deg, rgba(255, 236, 210, 0.12), rgba(16, 12, 10, 0.72))",
          mixBlendMode: "multiply",
          backdropFilter: "brightness(0.96)"
        },
        content: defaultContentAdjust()
      };
    }

    case "readingMode": {
      const content = defaultContentAdjust();
      content.readingAmount = amount * lerp(0.65, 1, clamp01((1 - values.whiteThreshold) / 0.35));
      content.whiteThreshold = values.whiteThreshold;
      content.contrastCap = values.contrastCap;
      content.darkSurface = values.darkSurface;

      return {
        filter: composeFilter([
          `brightness(${cssNumber(1 - amount * 0.05)})`,
          `saturate(${cssNumber(1 - amount * 0.1)})`
        ]),
        overlay: {
          opacity: clamp01(amount * 0.08),
          background: "rgba(8, 10, 12, 0.92)",
          mixBlendMode: "multiply",
          backdropFilter: "none"
        },
        content
      };
    }

    case "highlightSuppression": {
      const content = defaultContentAdjust();
      content.localSuppression = amount * values.cap;
      content.localRadius = values.radius;
      content.localSensitivity = values.sensitivity;

      return {
        filter: composeFilter([
          `brightness(${cssNumber(1 - amount * 0.08)})`,
          `contrast(${cssNumber(1 - amount * 0.06)})`
        ]),
        overlay: {
          opacity: clamp01(amount * values.cap * 0.26),
          background:
            "radial-gradient(circle at 50% 10%, rgba(12, 9, 8, 0.92) 0, rgba(12, 9, 8, 0.35) 22%, transparent 58%)," +
            "radial-gradient(circle at 80% 20%, rgba(18, 14, 10, 0.72) 0, rgba(18, 14, 10, 0.2) 18%, transparent 52%)",
          mixBlendMode: "multiply",
          backdropFilter: "none"
        },
        content
      };
    }

    case "rodFriendly": {
      const content = defaultContentAdjust();
      content.rodAmount = amount;
      content.rodDesaturation = values.desaturation;
      content.rodBlueScale = values.blueScale;
      content.rodCeiling = values.ceiling;

      return {
        filter: composeFilter([
          `brightness(${cssNumber(1 - amount * (1 - values.ceiling) * 0.38)})`,
          `saturate(${cssNumber(1 - amount * values.desaturation * 0.75)})`,
          `contrast(${cssNumber(1 - amount * 0.08)})`
        ]),
        overlay: {
          opacity: clamp01(amount * (1 - values.blueScale) * 0.34),
          background: "linear-gradient(180deg, rgba(255, 184, 108, 0.58), rgba(24, 18, 16, 0.7))",
          mixBlendMode: "multiply",
          backdropFilter: "none"
        },
        content
      };
    }

    default:
      return {
        filter: "none",
        overlay: defaultOverlay(),
        content: defaultContentAdjust()
      };
  }
}

function applySlotVisuals(slotKey, result) {
  const wrapper = dom[`${slotKey}Wrapper`];
  const overlay = dom[`${slotKey}Overlay`];

  wrapper.style.filter = result.filter;
  overlay.style.opacity = result.overlay.opacity.toFixed(3);
  overlay.style.background = result.overlay.background;
  overlay.style.mixBlendMode = result.overlay.mixBlendMode;
  overlay.style.backdropFilter = result.overlay.backdropFilter;
  overlay.style.webkitBackdropFilter = result.overlay.backdropFilter;
}

function combineContentAdjustments(results) {
  const combined = defaultContentAdjust();

  for (const result of results) {
    combined.readingAmount = clamp01(combined.readingAmount + result.content.readingAmount);
    combined.darkSurface = Math.min(combined.darkSurface, result.content.darkSurface);
    combined.contrastCap = Math.min(combined.contrastCap, result.content.contrastCap);
    combined.whiteThreshold = Math.min(combined.whiteThreshold, result.content.whiteThreshold);
    combined.localSuppression = clamp01(combined.localSuppression + result.content.localSuppression);
    combined.localRadius = Math.max(combined.localRadius, result.content.localRadius);
    combined.localSensitivity = Math.min(combined.localSensitivity, result.content.localSensitivity);
    combined.rodAmount = clamp01(combined.rodAmount + result.content.rodAmount);
    combined.rodDesaturation = Math.max(combined.rodDesaturation, result.content.rodDesaturation);
    combined.rodBlueScale = Math.min(combined.rodBlueScale, result.content.rodBlueScale);
    combined.rodCeiling = Math.min(combined.rodCeiling, result.content.rodCeiling);
  }

  return combined;
}

function applyContentAdjustments(combined) {
  const readingGray = lerp(1, combined.darkSurface, combined.readingAmount);
  const cappedText = clamp01(combined.darkSurface + combined.contrastCap);
  const readingTextGray = lerp(0, cappedText, combined.readingAmount);
  const mutedTarget = clamp01(cappedText - 0.14);

  dom.contentRoot.style.setProperty("--reading-bg", grayColor(readingGray));
  dom.contentRoot.style.setProperty("--reading-text", grayColor(readingTextGray));
  dom.contentRoot.style.setProperty(
    "--reading-muted",
    grayColor(lerp(0.27, mutedTarget, combined.readingAmount))
  );
  dom.contentRoot.style.setProperty(
    "--reading-border",
    `rgba(${Math.round(lerp(0, 255, combined.readingAmount))}, ${Math.round(lerp(0, 255, combined.readingAmount))}, ${Math.round(lerp(0, 255, combined.readingAmount))}, ${lerp(0.08, 0.18, combined.readingAmount).toFixed(3)})`
  );

  const localFactor = clamp01(
    combined.localSuppression * lerp(0.65, 1.15, clamp01((0.3 - combined.localSensitivity) / 0.28))
  );
  const imageBrightness = clamp(
    1 - localFactor * 0.26 - combined.rodAmount * (1 - combined.rodCeiling) * 0.34,
    0.42,
    1
  );
  const imageContrast = clamp(1 - localFactor * 0.12 - combined.rodAmount * 0.08, 0.74, 1);
  const imageSaturation = clamp(
    1 - localFactor * 0.16 - combined.rodAmount * combined.rodDesaturation * 0.72,
    0.16,
    1
  );
  const warmHue = clamp01(combined.rodAmount * (1 - combined.rodBlueScale));
  const readingHighlight = clamp01(
    localFactor * 0.28 + combined.rodAmount * 0.08 + combined.readingAmount * 0.05
  );
  const galleryOverlayOpacity = clamp01(localFactor * 0.5 + combined.rodAmount * 0.18);
  const highlightSpread = Math.round(24 + combined.localRadius * 0.85);

  dom.contentRoot.style.setProperty(
    "--gallery-image-filter",
    composeFilter([
      `brightness(${cssNumber(imageBrightness)})`,
      `contrast(${cssNumber(imageContrast)})`,
      `saturate(${cssNumber(imageSaturation)})`,
      warmHue > 0.01 ? `sepia(${cssNumber(warmHue * 0.22)})` : ""
    ])
  );
  dom.contentRoot.style.setProperty("--gallery-overlay-opacity", galleryOverlayOpacity.toFixed(3));
  dom.contentRoot.style.setProperty("--reading-highlight-opacity", readingHighlight.toFixed(3));
  dom.contentRoot.style.setProperty(
    "--gallery-card-overlay",
    `radial-gradient(circle at 50% 12%, rgba(38, 26, 18, 0.92) 0, rgba(38, 26, 18, 0.34) ${highlightSpread}%, transparent ${highlightSpread + 28}%)`
  );
}

function updateStatus() {
  const primary = appState.slots.primary.method === "none"
    ? "none"
    : METHOD_DEFS[appState.slots.primary.method].label;
  const secondary = appState.slots.secondary.method === "none"
    ? "none"
    : METHOD_DEFS[appState.slots.secondary.method].label;

  dom.renderStatus.textContent =
    `Live DOM preview. Primary: ${primary}. Secondary: ${secondary}.`;
}

function applyAllEffects() {
  const results = SLOT_KEYS.map((slotKey) => {
    const slot = appState.slots[slotKey];
    const result = buildSlotResult(slot.method, slot.method === "none" ? {} : slot.values[slot.method]);
    applySlotVisuals(slotKey, result);
    return result;
  });

  applyContentAdjustments(combineContentAdjustments(results));
  updateStatus();
}

function initializeSelectHandlers() {
  dom.primaryMethod.addEventListener("change", () => {
    appState.slots.primary.method = dom.primaryMethod.value;
    renderSlotPanel("primary");
    applyAllEffects();
  });

  dom.secondaryMethod.addEventListener("change", () => {
    appState.slots.secondary.method = dom.secondaryMethod.value;
    renderSlotPanel("secondary");
    applyAllEffects();
  });
}

function initialize() {
  renderPlaceholders();
  populateSelect(dom.primaryMethod, "primary");
  populateSelect(dom.secondaryMethod, "secondary");
  dom.primaryMethod.value = appState.slots.primary.method;
  dom.secondaryMethod.value = appState.slots.secondary.method;
  updateTransitionLabel();
  renderSlotPanel("primary");
  renderSlotPanel("secondary");
  initializeSelectHandlers();

  dom.transitionSlider.addEventListener("input", () => {
    appState.transitionMs = Number(dom.transitionSlider.value);
    updateTransitionLabel();
  });

  applyAllEffects();
}

window.addEventListener("load", initialize);
