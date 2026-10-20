# TT Font Studio

A browser-based bitmap font editor for classic LEGO TT Games PC `.FNT` resources. Open your own fonts, edit glyph metrics, and preview English and Ukrainian without Python or a backend.

[Open the editor](https://drsmile444.github.io/tt-font-studio/)

## Features

- Drag and drop one or multiple `.FNT` files, or use the file picker.
- Open Font 1 (UI) and Font 2 (Adventure) together with independent edit history.
- Decode embedded DDS / DXT5 atlases directly in the browser.
- Search by character, `U+XXXX`, or glyph index; select rectangles on the atlas.
- Edit X, Y, width/advance, shared glyph height, and baseline.
- Preview editable English and Ukrainian samples using the actual bitmap pixels, with Smooth (default) and Pixel exact rendering and HiDPI support.
- Open atlases at 100%, reveal selected off-screen glyphs automatically, and use Fit only when requested.
- Compare the atlas against Transparency, Green, or White backgrounds without changing exported pixels.
- Undo, redo, reset individual glyphs, and explicitly round fractional metrics.
- Replace the atlas with a PNG of identical dimensions, with DXT5 mip encoding in a worker.
- Download edited FNT, decoded atlas PNG, or current metrics and mappings JSON.
- English UI with typed locale dictionaries, interpolation, and English fallback.
- Local processing: user files are never uploaded.

## Compatibility

Verified locally with LEGO Indiana Jones: The Original Adventures **PC** resources:

| Resource | Atlas | Verified |
| --- | --- | --- |
| Original Font 1 UI | 512 × 512 | Import, decode, metric edit, byte-identical no-op export |
| Original Font 2 Adventure | 512 × 512 | Import, decode, metric edit, byte-identical no-op export |
| Patched Font 1 UI | 1024 × 1024 | Above, plus browser English/Ukrainian previews |
| Patched Font 2 Adventure | 1024 × 1024 | Above, plus browser English/Ukrainian previews |

The PS2/HD era describes the games, **not console-file compatibility**. Other games, console textures, later FT2 formats, atlas resizing, and adding/remapping characters need further implementation and validation. The editor preserves existing mappings, aliases, duplicate entries, descriptor bytes, and relocation information. Historical opaque pointer values are retained and reported, not repaired.

A browser preview does not replace testing the exported font in the game. No new in-game verification is claimed for exports produced by this application.

## Use

1. Open the editor and drop your `.FNT` files anywhere on the page.
2. Select a font tab, then search or click a glyph.
3. Edit its metrics; both text previews update immediately. Multiple characters referencing one glyph share its metrics.
4. Open **Shared font metrics** for height, baseline, and reversible rounding.
5. Open **Font actions** for PNG replacement and PNG/JSON exports.
6. Choose **Export FNT** to download the resource. The input file on disk is never overwritten.

**Width / advance** is the classic format's shared source-rectangle width and horizontal advance. Space advances without drawing pixels. No-op and metric-only exports preserve DDS bytes; PNG replacement recompresses all original mip levels and can change pixels because BC3 is lossy.

Changes stay in the current tab, not persistent storage. Export before leaving. Closing an edited font asks for confirmation. Undo history holds up to 40 operations and is independent for each document. Ctrl/Cmd+O opens files; Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z undo and redo outside text fields.

The included demo is an original synthetic diagnostic resource with locally rasterized text, not a bundled game font.

## Development

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
npm run build
npm test
npx playwright install chromium
npm run test:e2e
```

`npm run check` runs the build and both test suites. Production output is `dist/` and has relative asset paths for project GitHub Pages hosting.

To run optional private integrations, place legally obtained font copies in an ignored folder and set `TT_PRIVATE_FIXTURES` to its absolute path. Core tests inspect all `.FNT` files there. Browser tests expect `FONT1.FNT` and `FONT2.FNT`. Never commit this folder, real font binaries, or private screenshots.

## Architecture and i18n

- `src/core/fnt.ts`: checked classic PC FNT reader and fixed-size writer.
- `src/core/bc3.ts`: CPU BC3 codec, alpha-weighted mip filtering.
- `src/core/document.ts`: glyph-index-based state, export snapshots, bounded undo/redo.
- `src/core/texture.worker.ts`: background texture encoding.
- `src/ui/`: bitmap rendering, icons, and original demo.
- `src/locales/en.ts` and `src/i18n.ts`: all UI messages, typed partial locale dictionaries, and English fallback. Add a locale module and pass its messages to `setLocale(code, messages)`; preview language is independent of UI locale.

Later format adapters can produce the same editor data while keeping their own source buffer and writer. Do not detect variants by the initial apparent `pa`/`pb` bytes: these bytes belong to a relative relocation pointer.

## GitHub Pages

`.github/workflows/pages.yml` builds, typechecks, runs unit and Chromium browser tests, then deploys `dist/` on pushes to `main`. Pull requests run verification only. In repository **Settings → Pages**, use **GitHub Actions** as the source. A failed verification prevents deployment.

## Design and specifications

Development follows the OpenSpec change under `openspec/changes/build-font-studio/`. Product context is in `PRODUCT.md`; visual tokens and interaction conventions are in `DESIGN.md`. Design references and naming research are documented under `docs/`.

## License and credits

MIT. Binary format and BC3 implementation draw on the MIT-licensed tools in [LEGO Indiana Jones Ukrainian localization](https://github.com/DrSmile444/lego-indi-1-ukrainizator-old). See [NOTICE.md](NOTICE.md) for attribution and bundled font licensing. This is an independent fan tool, unaffiliated with LEGO, TT Games, or their licensors. Users supply their own game resources.

