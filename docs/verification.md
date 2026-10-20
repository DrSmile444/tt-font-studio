# Verification record

Verified on 2026-10-20.

## Local automated checks

- TypeScript typecheck and Vite production build pass.
- 30 portable unit tests pass: two synthetic FNT layouts, malformed inputs, aliases, byte-preserving export, metric/history behavior, BC3 known blocks, alpha filtering, all mip levels, and locale fallback.
- Four additional private integration cases pass against original 512 × 512 and patched 1024 × 1024 UI/Adventure resources. Private fonts remain ignored and unpublished.
- Eight Chromium browser scenarios pass when private fixtures are supplied (seven portable cases plus one private two-font integration).
- Portable browser coverage includes file picker, actual drag/drop events, multi-font state, bilingual previews, missing glyphs, invalid input, no-result recovery, PNG/JSON/FNT downloads, worker texture replacement, undo recovery, close confirmation, repeated numeric stepping and Tab focus.
- Automated axe scans pass on empty and populated desktop states. 390 px mobile layout has no page-level horizontal overflow.
- Prettier check, git diff whitespace check, and strict OpenSpec validation pass.
- Impeccable detector reports no findings; finish reviewer disposition is ship following the keyboard-focus correction. UX Crux evidence and limitations are in ux-review.md.

## Hosted checks

The first GitHub Actions verification and GitHub Pages deployment succeeded. The public URL loads without failed resource requests or JavaScript errors. A hosted browser opened both real local fonts, rendered the English and Ukrainian samples without missing characters, and downloaded an untouched Font 1 byte-identical to its local source. The files were processed locally by the browser; no fonts were committed or uploaded to the host.

## Limits

Chromium was exercised. Screen-reader sessions, other browser engines, actual console resources, later TT formats, and exported fonts in the running game are not verified by this pass. Binary structural validity and correct browser preview are not an in-game compatibility guarantee.

## Preview controls follow-up

The improve-preview-rendering change adds three browser regressions: native 100% defaults and viewport-only glyph focus; background persistence with unchanged source pixels and byte-identical FNT export; and density-aware Smooth/Pixel exact rendering at device pixel ratio 2 with an allocation cap. All 11 browser scenarios pass when private fixtures are supplied; the 30 portable core tests and production build also pass. Axe checks continue to pass on empty and populated workspaces. Desktop and 390 px mobile captures were inspected for control wrapping and atlas overflow. The detector returned design-token advisories, primarily pre-existing palette/type details; the intentionally new green and white inspection backgrounds are now recorded in DESIGN.md. Unrelated pre-existing token drift was not changed.
