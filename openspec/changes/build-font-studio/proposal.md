# Proposal

## Why

LEGO TT Games font editing currently requires Python preprocessing and project-specific assets. A standalone browser application will let modders open their own classic PC FNT resources, edit glyph metrics, preview English and Ukrainian text, and download valid game resources without a backend.

## What Changes

- Create TT Font Studio as a public, independent project with a static GitHub Pages build.
- Import classic TT Games PC FNT resources through drag and drop or a file picker, including the Font 1 UI and Font 2 Adventure layouts used in LEGO Indiana Jones.
- Decode embedded DXT5 DDS atlases locally and populate a format-independent editing model.
- Edit glyph rectangles, shared height and baseline, with undo/redo and per-font state.
- Render live English and Ukrainian sample text and custom text using imported atlas pixels.
- Export valid FNT resources with original texture bytes preserved for metric-only changes; export PNG and JSON for external workflows.
- Add explicit reversible metric normalization, PNG atlas replacement with BC3 mip encoding, and extensible format adapters.
- Keep the application, code, repository documents, and specifications in English with a typed locale dictionary and fallback.
- Validate binary round trips on synthetic redistributable fixtures and both local game fonts without publishing game assets.

## Capabilities

### New Capabilities

- `font-import-export`: Local FNT parsing, validation, DXT5 decode/encode, metric editing, and binary export.
- `font-workspace`: Multi-font drag-and-drop workspace, glyph inspection, English/Ukrainian previews, undo, and normalization.
- `static-application`: English-first i18n, responsive accessible interface, static build, CI, and GitHub Pages deployment.

### Modified Capabilities

None. This is a new repository.

## Impact

New browser application and format core. Existing localization tools serve as algorithm references under their MIT software license. No game font files or proprietary images will be committed. Only classic PC DDS/DXT5 FNT variants are initially supported; the PS2/HD era describes the games, not verified console resource compatibility. Later TT formats are extension points, not advertised as supported.
