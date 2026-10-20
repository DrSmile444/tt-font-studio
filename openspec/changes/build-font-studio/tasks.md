# Tasks

## 1. Project and product foundation

- [x] 1.1 Record product, naming research, design direction, and MIT attribution; verify English documents exist.
- [x] 1.2 Set up TypeScript, Vite, test tools, and locale fallback; verify install, typecheck, and locale tests pass.

## 2. Binary font core

- [x] 2.1 Parse and validate classic PC FNT tables, descriptors, mip chains, and relocations; verify both synthetic layouts and private Font 1/Font 2 fixtures load.
- [x] 2.2 Decode and encode BC3 DDS mip levels with bounds limits; verify independent known-block tests and texture replacement round trips.
- [x] 2.3 Implement shared-index metrics, validated edits, undo/redo, normalization, and byte-preserving export; verify aliases, no-op bytes, edit boundaries, and history tests.

## 3. Browser workspace

- [x] 3.1 Build drag-and-drop and file-picker import, font switching, original demo, errors, and changed-state recovery; verify browser import and recovery scenarios.
- [x] 3.2 Build searchable glyph list, atlas selection, inspector, history actions, PNG replacement, PNG/JSON/FNT downloads; verify live edits and downloaded files.
- [x] 3.3 Add editable English and Ukrainian bitmap previews, missing-character reporting, scale and background controls; verify both previews on both private fonts.
- [x] 3.4 Verify keyboard access, narrow layout, locale coverage, and design finish through Impeccable and UX Crux; fix actionable findings and record evidence.

## 4. Delivery

- [x] 4.1 Add CI and GitHub Pages workflow, compatibility and usage docs; verify production build and automated tests.
- [ ] 4.2 Create public DrSmile444/tt-font-studio, push focused commits, enable Pages, and verify deployment and hosted application.
