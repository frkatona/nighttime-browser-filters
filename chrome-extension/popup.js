const STORAGE_KEY = "nightBrightSettings";
const model = globalThis.NightBrightModel;

const dom = {
  enabledToggle: document.getElementById("enabled-toggle"),
  enabledToggleText: document.getElementById("enabled-toggle-text"),
  enabledSummary: document.getElementById("enabled-summary"),
  verboseToggle: document.getElementById("verbose-toggle"),
  verboseToggleText: document.getElementById("verbose-toggle-text"),
  verboseSummary: document.getElementById("verbose-summary"),
  primaryMethod: document.getElementById("primary-method"),
  secondaryMethod: document.getElementById("secondary-method"),
  primaryPanel: document.getElementById("primary-panel"),
  secondaryPanel: document.getElementById("secondary-panel"),
  primarySummary: document.getElementById("primary-summary"),
  secondarySummary: document.getElementById("secondary-summary"),
  transitionSlider: document.getElementById("transition-ms"),
  transitionValue: document.getElementById("transition-ms-value"),
  status: document.getElementById("status")
};

const SVG_NS = "http://www.w3.org/2000/svg";
const GRAPH_VIEWBOX = { width: 220, height: 140 };
const GRAPH_FRAME = { left: 18, right: 12, top: 12, bottom: 22 };

let state = model.createDefaultSettings();

async function loadSettings() {
  const stored = await chrome.storage.local.get(STORAGE_KEY);
  state = model.mergeSettings(stored[STORAGE_KEY]);
}

async function persistSettings() {
  await chrome.storage.local.set({
    [STORAGE_KEY]: state
  });
}

function populateSelect(select, slotKey) {
  const noneLabel = slotKey === "secondary" ? "No secondary effect" : "No filter";

  for (const methodKey of model.METHOD_ORDER) {
    const option = document.createElement("option");
    option.value = methodKey;
    option.textContent = methodKey === "none" ? noneLabel : model.METHOD_DEFS[methodKey].label;
    select.append(option);
  }
}

function createEmptyPanel(message) {
  const note = document.createElement("p");
  note.className = "empty-panel";
  note.textContent = message;
  return note;
}

function updateTransitionLabel() {
  dom.transitionValue.textContent = `${state.transitionMs} ms`;
  dom.transitionSlider.value = String(state.transitionMs);
}

function updateEnabledControl() {
  dom.enabledToggle.checked = state.enabled;
  dom.enabledToggleText.textContent = state.enabled ? "On" : "Off";
  dom.enabledSummary.textContent = state.enabled
    ? "Effects enabled on scriptable tabs."
    : "Plugin disabled. Stored effect settings are preserved.";
}

function updateVerboseControl() {
  document.body.classList.toggle("verbose-on", state.verbose);
  dom.verboseToggle.checked = state.verbose;
  dom.verboseToggleText.textContent = state.verbose ? "On" : "Off";
  dom.verboseSummary.textContent = state.verbose
    ? "Explanatory copy is visible."
    : "Only direct labels are visible.";
}

function createSvgNode(name, attributes = {}) {
  const node = document.createElementNS(SVG_NS, name);

  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, String(value));
  }

  return node;
}

function projectGraphPoint(x, y) {
  const width = GRAPH_VIEWBOX.width - GRAPH_FRAME.left - GRAPH_FRAME.right;
  const height = GRAPH_VIEWBOX.height - GRAPH_FRAME.top - GRAPH_FRAME.bottom;

  return {
    x: GRAPH_FRAME.left + x * width,
    y: GRAPH_FRAME.top + (1 - y) * height
  };
}

function buildPolylinePoints(points) {
  return points
    .map((point) => {
      const projected = projectGraphPoint(point.x, point.y);
      return `${projected.x.toFixed(2)},${projected.y.toFixed(2)}`;
    })
    .join(" ");
}

function interpolateCurveY(points, x) {
  if (x <= points[0].x) {
    return points[0].y;
  }

  for (let index = 1; index < points.length; index += 1) {
    const previous = points[index - 1];
    const current = points[index];

    if (x <= current.x) {
      const span = Math.max(current.x - previous.x, 0.0001);
      const amount = (x - previous.x) / span;
      return model.lerp(previous.y, current.y, amount);
    }
  }

  return points[points.length - 1].y;
}

function createAxisLabel(x, y, content, className, anchor = "middle") {
  const label = createSvgNode("text", {
    x,
    y,
    class: className,
    "text-anchor": anchor
  });
  label.textContent = content;
  return label;
}

function renderGraphPreview(svg, descriptor) {
  const nodes = [];
  const frameWidth = GRAPH_VIEWBOX.width - GRAPH_FRAME.left - GRAPH_FRAME.right;
  const frameHeight = GRAPH_VIEWBOX.height - GRAPH_FRAME.top - GRAPH_FRAME.bottom;
  const frameX = GRAPH_FRAME.left;
  const frameY = GRAPH_FRAME.top;
  const identityStart = projectGraphPoint(0, 0);
  const identityEnd = projectGraphPoint(1, 1);

  nodes.push(createSvgNode("rect", {
    x: frameX,
    y: frameY,
    width: frameWidth,
    height: frameHeight,
    rx: 10,
    class: "graph-frame"
  }));

  for (const step of [0.25, 0.5, 0.75]) {
    const vertical = projectGraphPoint(step, 0);
    const horizontal = projectGraphPoint(0, step);

    nodes.push(createSvgNode("line", {
      x1: vertical.x,
      y1: frameY,
      x2: vertical.x,
      y2: frameY + frameHeight,
      class: "graph-grid"
    }));

    nodes.push(createSvgNode("line", {
      x1: frameX,
      y1: horizontal.y,
      x2: frameX + frameWidth,
      y2: horizontal.y,
      class: "graph-grid"
    }));
  }

  nodes.push(createSvgNode("line", {
    x1: identityStart.x,
    y1: identityStart.y,
    x2: identityEnd.x,
    y2: identityEnd.y,
    class: "graph-reference"
  }));

  for (const marker of descriptor.markers || []) {
    const markerY = typeof marker.y === "number"
      ? marker.y
      : interpolateCurveY(descriptor.points, marker.x);
    const projected = projectGraphPoint(marker.x, markerY);

    nodes.push(createSvgNode("line", {
      x1: projected.x,
      y1: frameY,
      x2: projected.x,
      y2: frameY + frameHeight,
      class: "graph-marker-line"
    }));

    nodes.push(createSvgNode("circle", {
      cx: projected.x,
      cy: projected.y,
      r: 3.5,
      class: "graph-marker-dot"
    }));

    const labelAnchor = projected.x > frameX + frameWidth - 28 ? "end" : "start";
    const labelX = labelAnchor === "end" ? projected.x - 7 : projected.x + 7;
    const labelY = Math.max(projected.y - 8, frameY + 10);
    nodes.push(createAxisLabel(labelX, labelY, marker.label, "graph-marker-label", labelAnchor));
  }

  nodes.push(createSvgNode("polyline", {
    points: buildPolylinePoints(descriptor.points),
    class: "graph-curve"
  }));

  nodes.push(createAxisLabel(frameX, frameY + frameHeight + 15, "0", "graph-axis-label", "middle"));
  nodes.push(createAxisLabel(frameX + frameWidth, frameY + frameHeight + 15, "1", "graph-axis-label", "middle"));
  nodes.push(createAxisLabel(frameX - 8, frameY + frameHeight + 4, "0", "graph-axis-label", "end"));
  nodes.push(createAxisLabel(frameX - 8, frameY + 4, "1", "graph-axis-label", "end"));

  svg.replaceChildren(...nodes);
}

function updateGraphCard(card, descriptor) {
  card.querySelector(".graph-label").textContent = descriptor.label;
  card.querySelector(".graph-caption").textContent = descriptor.caption;

  const svg = card.querySelector(".graph-svg");
  svg.setAttribute("aria-label", descriptor.label);
  renderGraphPreview(svg, descriptor);
}

function createGraphCard(slotKey, methodKey, values) {
  const descriptor = model.getGraphDescriptor(methodKey, values);
  if (!descriptor) {
    return null;
  }

  const card = document.createElement("section");
  card.className = "graph-card";
  card.dataset.slot = slotKey;
  card.dataset.method = methodKey;

  const head = document.createElement("div");
  head.className = "graph-head";

  const label = document.createElement("p");
  label.className = "graph-label";

  const key = document.createElement("p");
  key.className = "graph-key";
  key.textContent = "Input -> output";

  const svg = createSvgNode("svg", {
    class: "graph-svg",
    viewBox: `0 0 ${GRAPH_VIEWBOX.width} ${GRAPH_VIEWBOX.height}`,
    role: "img"
  });

  const caption = document.createElement("p");
  caption.className = "graph-caption";

  head.append(label, key);
  card.append(head, svg, caption);
  updateGraphCard(card, descriptor);
  return card;
}

function refreshGraphCard(slotKey, methodKey) {
  const panel = dom[`${slotKey}Panel`];
  const values = state.slots[slotKey].values[methodKey];
  const descriptor = model.getGraphDescriptor(methodKey, values);
  const existing = panel.querySelector(".graph-card");

  if (!descriptor) {
    if (existing) {
      existing.remove();
    }
    return;
  }

  if (!existing || existing.dataset.method !== methodKey) {
    const replacement = createGraphCard(slotKey, methodKey, values);
    if (!replacement) {
      return;
    }

    if (existing) {
      existing.replaceWith(replacement);
    } else {
      panel.append(replacement);
    }
    return;
  }

  updateGraphCard(existing, descriptor);
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
  output.textContent = model.formatValue(values[param.id], param.format);

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

  input.addEventListener("input", async () => {
    state.slots[slotKey].values[methodKey][param.id] = Number(input.value);
    output.textContent = model.formatValue(Number(input.value), param.format);
    refreshGraphCard(slotKey, methodKey);
    await persistSettings();
  });

  sliderHead.append(label, output);
  wrapper.append(sliderHead, copy, input);
  return wrapper;
}

function renderSlotPanel(slotKey) {
  const slot = state.slots[slotKey];
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
      : model.METHOD_DEFS.none.description;
    return;
  }

  const def = model.METHOD_DEFS[slot.method];
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

  const graphCard = createGraphCard(slotKey, slot.method, values);
  if (graphCard) {
    fragment.append(graphCard);
  }

  panel.replaceChildren(fragment);
  summary.textContent = def.description;
}

async function initialize() {
  await loadSettings();

  populateSelect(dom.primaryMethod, "primary");
  populateSelect(dom.secondaryMethod, "secondary");
  dom.primaryMethod.value = state.slots.primary.method;
  dom.secondaryMethod.value = state.slots.secondary.method;
  updateEnabledControl();
  updateVerboseControl();
  updateTransitionLabel();
  renderSlotPanel("primary");
  renderSlotPanel("secondary");

  dom.enabledToggle.addEventListener("change", async () => {
    state.enabled = dom.enabledToggle.checked;
    updateEnabledControl();
    await persistSettings();
  });

  dom.verboseToggle.addEventListener("change", async () => {
    state.verbose = dom.verboseToggle.checked;
    updateVerboseControl();
    await persistSettings();
  });

  dom.primaryMethod.addEventListener("change", async () => {
    state.slots.primary.method = dom.primaryMethod.value;
    renderSlotPanel("primary");
    await persistSettings();
  });

  dom.secondaryMethod.addEventListener("change", async () => {
    state.slots.secondary.method = dom.secondaryMethod.value;
    renderSlotPanel("secondary");
    await persistSettings();
  });

  dom.transitionSlider.addEventListener("input", async () => {
    state.transitionMs = Number(dom.transitionSlider.value);
    updateTransitionLabel();
    await persistSettings();
  });
}

initialize().catch((error) => {
  console.error(error);
  dom.status.textContent = "Popup initialization failed. Reload the extension and try again.";
});
