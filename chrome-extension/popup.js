const STORAGE_KEY = "nightBrightSettings";
const model = globalThis.NightBrightModel;

const dom = {
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

  panel.replaceChildren(fragment);
  summary.textContent = def.description;
}

async function initialize() {
  await loadSettings();

  populateSelect(dom.primaryMethod, "primary");
  populateSelect(dom.secondaryMethod, "secondary");
  dom.primaryMethod.value = state.slots.primary.method;
  dom.secondaryMethod.value = state.slots.secondary.method;
  updateTransitionLabel();
  renderSlotPanel("primary");
  renderSlotPanel("secondary");

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
