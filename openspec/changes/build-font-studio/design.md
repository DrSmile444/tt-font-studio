# Design

## Context

See proposal.md for the product motivation. The reference repository contains a working classic PC FNT parser, pointer validator, DXT5 encoders, and a canvas glyph viewer. Font 1 and Font 2 differ in atlas dimensions, glyph count, and mapping sentinel slots. Their leading bytes are relocation offsets, not format signatures. No source game assets belong in the public repository.

## Goals / Non-Goals

**Goals:** Keep binary handling independent of UI and locale. Preserve the original byte buffer and mutate only validated fields. Provide useful live editing for both existing font layouts and a local static deployment.

**Non-Goals:** Console swizzling, later FT2 variants, archive extraction, new glyph insertion, atlas resizing, and TTF/WOFF conversion are not part of this initial version.

## Decisions

- Use typed TypeScript modules and a Vite static build. A framework is optional pending user preference; binary and workspace modules have no framework dependency.
- Use DataView with explicit little-endian access, checked relative pointers, finite metrics, allocation limits, and strict DDS/descriptor/mip/footer consistency. Detect by structural validation, never by the apparent first two bytes.
- Represent glyph metrics by glyph index and keep Unicode mappings as an ordered array, preserving aliases and duplicates. UI lists codepoints but updates the shared metrics record.
- Decode BC3 to RGBA on the CPU for deterministic Canvas rendering. Encode same-size PNG replacements using a visible-color endpoint encoder derived from the MIT reference. Preserve original texture blocks when pixels are unchanged, including on metric-only export. Rebuild all existing mip levels for changed pixels. Encoding runs in a worker so the UI remains responsive.
- Store each document's original bytes, current metrics, atlas state, selection, export snapshot, and bounded command history separately. Changing tabs never clears work. Export state is compared with the last exported snapshot; undoing past a save is still dirty.
- Treat normalization as explicit rounding of metrics with an operation description and undo, not automatic image resampling or automatic baseline modification.
- Keep English messages and formatter interpolation in one locale module with English fallback. Preview languages are content, independent of UI locale.
- Build one workspace route: file rail, atlas stage, glyph inspector, and a bilingual preview area. Empty state has file import and an original synthetic demo. Use native controls, labeled actions, visible keyboard focus, live status, non-color edit indicators, and a stacked narrow layout.
- Use synthetic fixture generators in tests. Optionally run real-file integration against an environment-supplied private fixture directory. Commit no proprietary resources.
- Deploy dist with official GitHub Pages artifact/deployment actions, repository-relative paths, build/test gates, and workflow_dispatch.

## Risks / Trade-offs

- Reverse-engineered variants may look similar but differ semantically -> validate pointers and supported features and reject unknown structure, document observed compatibility only.
- BC3 is lossy -> show replacement as a pixel change, retain original bytes until export, preserve unaffected blocks where possible, and disclose recompression.
- An FNT file can be malicious or huge -> cap input bytes, dimensions, pixel count and tables before decoding or allocating.
- Canvas preview is a bitmap simulation, not the game renderer -> show missing codepoints explicitly, preserve space advance, and document lack of full shaping and engine-level validation.
- Worker or import failures -> announce an actionable message and retain other documents and unsaved edits.

## Migration Plan

Create a fresh repository. Build and validate locally; publish only source, synthetic fixtures, and generated static assets. Enable GitHub Pages with Actions, verify its first deployment, and roll back by reverting the relevant source commit.

Observed compatibility decision: patched Font 1 contains a stale opaque pointer at 0x4c. Rejecting that target would reject a required input. Validate relocation field locations strictly, report opaque out-of-file targets as a source warning, and preserve those bytes because this editor never resizes the resource.
