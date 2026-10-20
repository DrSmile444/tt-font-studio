# Proposal

## Why

Pixel-only text scaling makes imported bitmap fonts look unnecessarily coarse, especially on HiDPI displays. Automatic fit also hides native atlas resolution and selecting an off-screen glyph leaves its rectangle out of view.

## What Changes

- Add Smooth and Pixel exact text rendering, defaulting to Smooth, with density-aware canvases and a 100% initial text scale.
- Open fonts and the demo at 100% atlas zoom; retain Fit as an explicit action.
- Reveal the selected glyph by scrolling only the atlas viewport when necessary, preserving zoom and page position.
- Add labeled Transparency, Green, and White background buttons directly below the atlas.
- Keep all presentation settings separate from atlas pixels and exported FNT/PNG data.

## Capabilities

### New Capabilities

- `preview-controls`: Rendering quality, native-scale navigation, and atlas background choices.

### Modified Capabilities

None. Main specs have not yet been populated; the initial workspace contract remains in the completed build-font-studio change.

## Impact

Changes are limited to preview rendering, workspace controls, localized labels, tests, and documentation. The FNT codec and writer remain unchanged.
