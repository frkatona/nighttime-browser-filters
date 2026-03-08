# Chrome Extension Folder

This folder contains the Manifest V3 extension that applies Night Bright effects to existing browser tabs.

## What is in here

- `manifest.json`: extension manifest
- `popup.html`, `popup.css`, `popup.js`: the toolbar popup UI for choosing effects and tuning parameters
- `effect-model.js`: shared effect metadata and effect-resolution logic used by both popup and content script
- `content.css`, `content.js`: page-side injection that applies filters, overlays, media adjustments, and reading-mode heuristics
- `icons/`: extension icons

## How to use it

1. Open `chrome://extensions`.
2. Turn on Developer mode.
3. Click Load unpacked.
4. Select the `chrome-extension` folder.
5. Open a normal browser tab.
6. Click the extension icon and choose the effect settings you want.

## Notes

- The root-level `index.html` testbench remains separate and is not opened by the extension.
- The extension applies a global settings profile to scriptable tabs.
- Restricted pages such as `chrome://` URLs will not allow content-script injection.
