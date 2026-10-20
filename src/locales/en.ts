export const en = {
  appName: "TT Font Studio",
  tagline: "Bitmap fonts, rebuilt for new stories.",
  local: "Files stay on your device",
  github: "View source on GitHub",
  openFonts: "Open fonts",
  exportFnt: "Export FNT",
  exportPng: "Export atlas PNG",
  exportJson: "Export metrics JSON",
  exportMenu: "More exports",
  emptyTitle: "A new chapter starts with a glyph.",
  emptyText:
    "Open a classic TT Games PC font to inspect its atlas, adjust metrics, and see your words come to life.",
  dropTitle: "Drop your .FNT files here",
  dropHint: "Font 1, Font 2, or both. Everything runs in your browser.",
  browse: "Choose FNT files",
  or: "or",
  tryDemo: "Explore a demo font",
  compatibility: "Classic TT Games · PC FNT · DDS / DXT5",
  compatibilityHelp:
    "Tested with LEGO Indiana Jones Font 1 (UI) and Font 2 (Adventure). Other games and console resources need separate validation.",
  demoNote: "Original demo font. No game assets included.",
  emptySteps: "Open a font. Select a glyph. Make it yours.",
  workspace: "Font workspace",
  closeFont: "Close {name}",
  unsaved: "Unexported changes",
  clean: "No unexported changes",
  closeConfirm: "Close {name} and discard its unexported changes?",
  glyphs: "Glyphs",
  glyphCount: "{count} mappings",
  search: "Find a glyph",
  searchPlaceholder: "Character, U+code, or glyph index",
  allGlyphs: "All glyphs",
  editedOnly: "Edited only",
  noResults: "No matching glyphs.",
  clearSearch: "Clear filters",
  edited: "Edited",
  selectGlyph: "Select glyph {char}, {codepoint}",
  atlas: "Texture atlas",
  atlasHelp: "Select a rectangle or choose a glyph from the list.",
  zoom: "Atlas zoom",
  fit: "Fit",
  boxes: "Show bounds",
  inspector: "Glyph inspector",
  metricX: "X position",
  metricY: "Y position",
  metricWidth: "Width / advance",
  pixels: "px",
  index: "Glyph index",
  codepoints: "Mapped characters",
  resetGlyph: "Reset glyph",
  sharedMetrics: "Shared font metrics",
  fontHeight: "Glyph height",
  baseline: "Baseline",
  globalHelp:
    "Height is shared by every glyph. Width also controls character advance.",
  undo: "Undo",
  redo: "Redo",
  historyHint: "Undo / redo",
  normalize: "Round metrics",
  normalizeHelp:
    "Round glyph X, Y, and width to whole pixels. Keeps pixels, mapping, height, and baseline unchanged. One undo restores the operation.",
  normalized: "Glyph metrics rounded. You can undo this operation.",
  alreadyRounded: "All glyph metrics are already whole pixels.",
  replaceAtlas: "Replace atlas PNG",
  replaceHelp:
    "Use a PNG of exactly {width} × {height} pixels. FNT export recompresses all mip levels as DXT5. Undo restores the previous texture.",
  replacement: "Replacement atlas",
  preview: "Live text preview",
  previewHelp: "Rendered from the selected font, with your current edits.",
  english: "English",
  ukrainian: "Ukrainian",
  previewScale: "Text scale",
  previewBackground: "Preview background",
  dark: "Dark",
  light: "Light",
  warm: "Warm",
  custom: "Custom",
  missing: "Missing: {chars}",
  noMissing: "All characters available",
  enSample:
    "The adventure continues!\nThe quick brown fox jumps over the lazy dog. 0123456789",
  ukSample:
    "Пригоди тривають!\nҐанок, єнот, їжак та Україна. Іі Її Єє Ґґ 0123456789",
  previewCanvas: "{language} bitmap text preview",
  glyphCanvas:
    "Texture atlas with selectable glyph rectangles; use the glyph list for keyboard access.",
  opened: "Opened {name}.",
  loading: "Opening fonts…",
  encoding: "Encoding texture mip levels…",
  downloaded: "Downloaded {name}.",
  replaced: "Atlas replaced. Export FNT to save it to a font file.",
  demoLoaded: "Demo loaded. Open your own FNT files whenever you are ready.",
  errorTitle: "Could not complete this action",
  dismiss: "Dismiss message",
  importing: "Loading",
  unsupportedFile:
    "Choose a .FNT file. Use Replace atlas PNG to change a loaded font’s texture.",
  invalidFileSize:
    "This file is too small or larger than the 32 MB limit. Choose a classic PC FNT resource.",
  invalidRange:
    "A file pointer or table extends outside the resource. Choose an intact FNT file.",
  unsupportedFormat:
    "This is not a supported classic TT Games PC FNT with an embedded DDS texture.",
  unsupportedTexture:
    "This font’s texture is not DXT5 / BC3. This version supports classic PC DXT5 resources.",
  invalidTexture:
    "Texture dimensions or layout are unsupported. Use a 2D atlas up to 4096 × 4096 pixels.",
  invalidMipChain:
    "The DDS mip chain does not match the FNT resource boundaries. The file may use a different format.",
  invalidDescriptor:
    "The engine texture descriptor does not match the DDS header. This variant cannot be edited safely.",
  invalidTables:
    "The font metrics or mapping table overlaps another resource section or has an unsupported count.",
  invalidMetrics:
    "Enter a valid height and baseline. Height must be positive and baseline must be between zero and height.",
  invalidMapping:
    "The Unicode mapping has an invalid glyph index, sentinel, or character. Choose a supported FNT resource.",
  invalidRelocation:
    "The relocation table is not supported or is damaged. Choose a supported FNT resource.",
  metricBounds:
    "Keep X, Y, and width at or above zero, and the glyph rectangle inside the atlas.",
  atlasSize:
    "The replacement PNG must have exactly the same dimensions as the current atlas.",
  invalidPng:
    "Could not read this PNG. Choose an intact PNG image with the same dimensions as the atlas.",
  textureEncoding:
    "Texture encoding failed. Your edits are retained; try exporting again.",
  unknownError:
    "The action failed. Your open fonts are retained. Try the action again.",
  opaquePointer:
    "This source contains an opaque pointer outside the file. Fixed-size editing preserves its original value; the editor does not repair the source.",
  sourceBounds:
    "Some source glyph rectangles extend outside the atlas. They are preserved on import; edited rectangles must fit inside the atlas.",
  editedCount: "{count} edited glyphs",
  mipCount: "{count} mip levels",
  textureSize: "{width} × {height}",
  fontSummary: "{glyphs} glyphs · {mappings} mappings",
  sessionHint: "Work is kept in this tab. Export FNT before leaving.",
  footer: "An independent tool for LEGO TT Games modders.",
  availableFonts: "Open fonts",
  more: "Font actions",
  editHint:
    "Select a glyph to edit its rectangle. Changes update both previews.",
} as const;
export type MessageKey = keyof typeof en;
export type LocaleMessages = Partial<Record<MessageKey, string>>;
