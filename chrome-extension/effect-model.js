(function () {
  const SLOT_KEYS = ["primary", "secondary"];

  const METHOD_DEFS = {
    none: {
      label: "No filter",
      description: "Leaves the page unchanged.",
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
      description: "Dark-themes white surfaces and caps text contrast.",
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
          description: "Target gray for transformed white areas.",
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
      description: "Suppresses bright spots and reduces white-surface glare.",
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
          description: "Upper limit for local dimming strength.",
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

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function clamp01(value) {
    return clamp(value, 0, 1);
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function cssNumber(value) {
    return clamp(value, 0, 5).toFixed(3);
  }

  function composeFilter(parts) {
    const cleanParts = parts.filter(Boolean);
    return cleanParts.length ? cleanParts.join(" ") : "none";
  }

  function normalizedSigmoid(value, midpoint, steepness) {
    return 1 / (1 + Math.exp(-steepness * (value - midpoint)));
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

  function createSlotState(slotKey) {
    const strengthDefault = slotKey === "primary" ? 0.72 : 0.38;
    const values = {};

    for (const [methodKey, def] of Object.entries(METHOD_DEFS)) {
      if (methodKey === "none") {
        continue;
      }
      values[methodKey] = { strength: strengthDefault };
      for (const param of def.params) {
        values[methodKey][param.id] = param.default;
      }
    }

    return {
      method: "none",
      values
    };
  }

  function createDefaultSettings() {
    return {
      transitionMs: 450,
      slots: {
        primary: createSlotState("primary"),
        secondary: createSlotState("secondary")
      }
    };
  }

  function mergeSettings(raw) {
    const defaults = createDefaultSettings();
    if (!raw || typeof raw !== "object") {
      return defaults;
    }

    defaults.transitionMs = typeof raw.transitionMs === "number"
      ? clamp(raw.transitionMs, 0, 2000)
      : defaults.transitionMs;

    for (const slotKey of SLOT_KEYS) {
      const incomingSlot = raw.slots && raw.slots[slotKey];
      if (!incomingSlot || typeof incomingSlot !== "object") {
        continue;
      }

      defaults.slots[slotKey].method =
        typeof incomingSlot.method === "string" && METHOD_DEFS[incomingSlot.method]
          ? incomingSlot.method
          : "none";

      const incomingValues = incomingSlot.values || {};
      for (const methodKey of Object.keys(defaults.slots[slotKey].values)) {
        const methodValues = incomingValues[methodKey];
        if (!methodValues || typeof methodValues !== "object") {
          continue;
        }

        for (const [valueKey, value] of Object.entries(defaults.slots[slotKey].values[methodKey])) {
          if (typeof methodValues[valueKey] === "number") {
            defaults.slots[slotKey].values[methodKey][valueKey] = methodValues[valueKey];
          } else {
            defaults.slots[slotKey].values[methodKey][valueKey] = value;
          }
        }
      }
    }

    return defaults;
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

  function sampleCurve(sampleCount, fn) {
    const points = [];
    const steps = Math.max(2, sampleCount);

    for (let index = 0; index < steps; index += 1) {
      const x = index / (steps - 1);
      points.push({
        x,
        y: clamp01(fn(x))
      });
    }

    return points;
  }

  function getGraphDescriptor(methodKey, values) {
    const amount = values.strength;

    switch (methodKey) {
      case "scalarDimming":
        return {
          label: "Brightness transfer",
          caption: "Linear dimming with a retained shadow floor.",
          points: sampleCurve(56, (x) => lerp(x, values.shadowFloor + x * values.dimScale, amount)),
          markers: []
        };

      case "gammaRemap":
        return {
          label: "Gamma curve",
          caption: "Higher exponent bends mids downward while lift preserves the low end.",
          points: sampleCurve(56, (x) => {
            const target = values.shadowLift + (1 - values.shadowLift) * Math.pow(x, values.exponent);
            return lerp(x, target, amount);
          }),
          markers: []
        };

      case "luminanceRemap":
        return {
          label: "Luminance remap",
          caption: "Luma is compressed with a gamma-shaped curve and floor.",
          points: sampleCurve(56, (x) => {
            const target = values.lumaFloor + (1 - values.lumaFloor) * Math.pow(x, values.lumaGamma);
            return lerp(x, target, amount);
          }),
          markers: []
        };

      case "sigmoidContrast":
        return {
          label: "Sigmoid shaping",
          caption: "Midpoint moves the bend; steepness sharpens the shoulder and toe.",
          points: sampleCurve(56, (x) => {
            const lo = normalizedSigmoid(0, values.midpoint, values.steepness);
            const hi = normalizedSigmoid(1, values.midpoint, values.steepness);
            const sig = (normalizedSigmoid(x, values.midpoint, values.steepness) - lo) / Math.max(hi - lo, 0.0001);
            const target = sig * 0.82;
            return lerp(x, target, amount);
          }),
          markers: [
            {
              x: values.midpoint,
              label: "mid"
            }
          ]
        };

      case "softKnee":
        return {
          label: "Soft-knee shoulder",
          caption: "Threshold sets the knee start; softness rounds the highlight rolloff.",
          points: sampleCurve(56, (x) => {
            if (x <= values.threshold) {
              return lerp(x, x, amount);
            }

            const shoulder = (x - values.threshold) / Math.max(1 - values.threshold, 0.0001);
            const softness = Math.max(values.knee, 0.02);
            const normalized = (1 - Math.exp(-shoulder / softness)) / (1 - Math.exp(-1 / softness));
            const target = values.threshold + normalized * (1 - values.threshold) * 0.78;
            return lerp(x, target, amount);
          }),
          markers: [
            {
              x: values.threshold,
              label: "knee"
            }
          ]
        };

      case "rodFriendly":
        return {
          label: "Luminance band",
          caption: "Brightness is compressed into a narrower, calmer range.",
          points: sampleCurve(56, (x) => {
            const floor = 0.06;
            const target = floor + x * (values.ceiling - floor);
            return lerp(x, target, amount);
          }),
          markers: [
            {
              x: 1,
              y: values.ceiling,
              label: "ceiling"
            }
          ]
        };

      default:
        return null;
    }
  }

  globalThis.NightBrightModel = {
    SLOT_KEYS,
    METHOD_DEFS,
    METHOD_ORDER,
    clamp,
    clamp01,
    lerp,
    cssNumber,
    composeFilter,
    formatValue,
    createSlotState,
    createDefaultSettings,
    mergeSettings,
    defaultContentAdjust,
    buildSlotResult,
    combineContentAdjustments,
    getGraphDescriptor
  };
})();
