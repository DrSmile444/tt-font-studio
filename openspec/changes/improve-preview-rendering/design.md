# Design

## Context

The existing renderer scales bitmap glyphs into a canvas with smoothing disabled and no device-pixel-ratio handling. Both atlas loading paths invoke Fit. Glyph selection redraws the workspace and restores scroll offsets but does not reveal the selected bounds. The visual system is established in DESIGN.md.

## Goals / Non-Goals

Goals: add presentation-only controls, preserve keyboard focus and export invariants, and keep canvas allocation bounded.
Non-goals: alter font pixels, upscale resources, change codecs, or redesign the workspace.

## Decisions

- Allocate text preview backing buffers at device pixel ratio (capped to a practical maximum and an 8-million-pixel budget); keep explicit CSS dimensions and draw using a scaled context. Smooth uses Canvas interpolation and auto CSS sampling; Pixel exact disables interpolation and uses pixelated CSS sampling.
- Set both initial text scale and atlas zoom to 1. Remove automatic Fit calls, reset atlas zoom on new import, and retain the explicit Fit button.
- After list selection or a font switch, compare the selected rectangle with the atlas viewport client area using stage-relative coordinates. Scroll only that container, only on axes that need it; do not use scrollIntoView on the page.
- Add a native background selection group under the atlas with text-labeled buttons and aria-pressed. Apply colors to the stage and viewport through classes; checkerboard remains the default. This state lives outside FontDocument and never enters export data.
- Reuse the current palette, native controls, responsive layout, and centralized English locale messages.

## Risks / Trade-offs

- HiDPI buffers multiply allocation -> cap pixel density and backing pixels, gracefully use reduced density on extreme text.
- Nearest sampling on fractional display scales cannot create source details -> offer smooth rendering, retaining Pixel exact for inspection.
- DOM rebuilds reset viewport positions -> restore scroll during ordinary edits, reveal only on explicit selection or font switch.
- Bright green or white backgrounds change perceived edges -> treat them as view settings, never composite them into exported PNG.
