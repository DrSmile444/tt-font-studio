import "@fontsource-variable/public-sans";
import "./style.css";
import { parseFnt } from "./core/fnt";
import { FontDocument } from "./core/document";
import { FontError, MAX_FILE_BYTES, type Metric } from "./core/types";
import { t, type MessageKey } from "./i18n";
import { atlasCanvas, cpLabel, glyphLabel, renderPreview } from "./ui/canvas";
import { createDemo } from "./ui/demo";
import { icon } from "./ui/icons";

const app = document.querySelector<HTMLDivElement>("#app")!;
const docs: FontDocument[] = [];
let activeId = "",
  query = "",
  editedOnly = false,
  zoom = 1,
  showBoxes = true;
let textScale = 1,
  previewBg = "#22251f",
  busy = false;
let englishText = t("enSample"),
  ukrainianText = t("ukSample");
let previewRendering: "smooth" | "pixel" = "smooth";
let atlasBackground = "transparency";
let source: HTMLCanvasElement | null = null,
  sourceKey: Uint8ClampedArray | null = null;
let message = "",
  isError = false;
const esc = (value: unknown) =>
  String(value).replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
const active = () => docs.find((d) => d.id === activeId);
const byId = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const btn = (
  id: string,
  label: MessageKey,
  svg?: Parameters<typeof icon>[0],
  cls = "",
  disabled = false,
) =>
  `<button id="${id}" class="${cls}" ${disabled ? "disabled" : ""}>${svg ? icon(svg) : ""}<span>${esc(t(label))}</span></button>`;
function notify(text: string, error = false) {
  message = text;
  isError = error;
  renderMessage();
}
function report(error: unknown) {
  const code =
    error instanceof FontError ? (error.code as MessageKey) : "unknownError";
  notify(t(code), true);
}
function renderMessage() {
  const el = document.getElementById("notice");
  if (!el) return;
  el.hidden = !message;
  el.className = `notice ${isError ? "error" : ""}`;
  el.setAttribute("role", isError ? "alert" : "status");
  el.innerHTML = message
    ? `<span>${esc(message)}</span><button id="dismiss" class="icon-button" aria-label="${t("dismiss")}">${icon("close")}</button>`
    : "";
  document.getElementById("dismiss")?.addEventListener("click", () => {
    message = "";
    renderMessage();
  });
}
function header() {
  return `<a class="skip-link" href="#workspace">${esc(t("workspace"))}</a>
  <header class="topbar"><div class="brand"><span class="brand-mark" aria-hidden="true">T<span>T</span></span><div><h1>${t("appName")}</h1><p>${t("tagline")}</p></div></div>
  <div class="header-actions"><span class="privacy">${icon("check")}${t("local")}</span><a class="icon-button source-link" href="https://github.com/DrSmile444/tt-font-studio" target="_blank" rel="noopener" aria-label="${t("github")}">${icon("github")}</a>${btn("open", "openFonts", "open", "secondary")}${btn("export", "exportFnt", "download", "primary", !active() || busy)}</div></header>
  <input type="file" id="fileInput" hidden accept=".fnt" multiple aria-label="${t("openFonts")}"><input type="file" id="pngInput" hidden accept="image/png" aria-label="${t("replaceAtlas")}">
  <div id="notice" hidden></div><div id="dropOverlay" class="drop-overlay" hidden><div>${icon("open")}<strong>${t("dropTitle")}</strong><span>${t("dropHint")}</span></div></div>`;
}
function render() {
  const doc = active();
  app.innerHTML =
    header() +
    (doc ? workspace(doc) : empty()) +
    `<footer><span>${t("footer")}</span><span>${doc ? t("sessionHint") : t("compatibility")}</span></footer>`;
  renderMessage();
  byId("open").addEventListener("click", () =>
    byId<HTMLInputElement>("fileInput").click(),
  );
  byId<HTMLInputElement>("fileInput").addEventListener("change", (e) => {
    void importFiles((e.target as HTMLInputElement).files);
  });
  byId<HTMLInputElement>("pngInput").addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (file) void replacePng(file);
  });
  byId("export").addEventListener("click", () => {
    void downloadFnt();
  });
  if (!doc) {
    byId("browse").addEventListener("click", () =>
      byId<HTMLInputElement>("fileInput").click(),
    );
    byId("demo").addEventListener("click", () => {
      void loadDemo();
    });
    return;
  }
  bindWorkspace(doc);
  renderList();
  renderAtlas();
  drawPreviews();
}
function empty() {
  return `<main id="workspace" class="empty-workspace" tabindex="-1"><div class="empty-intro"><h2>${t("emptyTitle")}</h2><p>${t("emptyText")}</p></div>
  <section class="drop-zone" aria-labelledby="dropTitle"><div class="file-illustration" aria-hidden="true"><div class="file-corner"></div><span>A<span>а</span></span><i>.FNT</i></div>
  <h3 id="dropTitle">${t("dropTitle")}</h3><p>${t("dropHint")}</p>${btn("browse", "browse", "open", "primary")}<div class="demo-row"><span>${t("or")}</span><button id="demo" class="text-button">${t("tryDemo")}${icon("arrow")}</button></div></section>
  <div class="empty-footnote"><span class="format-tag">.FNT</span><div><strong>${t("compatibility")}</strong><p>${t("compatibilityHelp")}</p></div></div></main>`;
}
function workspace(doc: FontDocument) {
  const r = doc.resource,
    mapping = r.mapping[doc.selected] ?? r.mapping[0],
    metric = doc.metrics[mapping.glyphIndex];
  const aliases = r.mapping.filter((m) => m.glyphIndex === mapping.glyphIndex);
  return `<main id="workspace" tabindex="-1"><nav class="font-tabs" aria-label="${t("availableFonts")}">${docs.map((d) => `<div class="font-tab ${d.id === doc.id ? "active" : ""}"><button class="font-select" data-font="${d.id}" aria-current="${d.id === doc.id ? "page" : "false"}">${icon("file")}<span>${esc(d.resource.name)}</span>${d.dirty ? `<span class="dirty" aria-label="${t("unsaved")}"></span>` : ""}</button><button class="tab-close icon-button" data-close="${d.id}" aria-label="${esc(t("closeFont", { name: d.resource.name }))}">${icon("close")}</button></div>`).join("")}</nav>
  <div class="workspace-summary"><div><strong>${esc(r.name)}</strong><span>${t("fontSummary", { glyphs: r.metrics.length, mappings: r.mapping.length })}</span></div><span class="format-caption">PC FNT <span> / </span> DXT5 <span> / </span> ${t("mipCount", { count: r.mipCount })}</span></div>
  ${
    r.warnings.length
      ? `<details id="sourceWarning" class="source-warning"><summary>${esc(t(r.warnings[0] as MessageKey))}</summary>${r.warnings
          .slice(1)
          .map((w) => `<p>${esc(t(w as MessageKey))}</p>`)
          .join("")}</details>`
      : ""
  }
  <div class="editor-grid"><aside class="glyph-panel" aria-labelledby="glyphHeading"><div class="panel-heading"><h2 id="glyphHeading">${t("glyphs")}</h2><span id="glyphCount">${r.mapping.length}</span></div><div class="search-wrap">${icon("search")}<input id="search" type="search" placeholder="${t("searchPlaceholder")}" aria-label="${t("search")}" value="${esc(query)}"></div><label class="filter-toggle"><input id="editedOnly" type="checkbox" ${editedOnly ? "checked" : ""}>${t("editedOnly")}<span id="filter-edited-count">${doc.changedGlyphs}</span></label><div id="glyphList" class="glyph-list" role="group" aria-label="${t("glyphs")}"></div></aside>
  <section class="atlas-panel" aria-labelledby="atlasHeading"><div class="panel-heading"><h2 id="atlasHeading">${t("atlas")}</h2><span>${t("textureSize", { width: r.atlasWidth, height: r.atlasHeight })}</span></div><div class="atlas-toolbar"><label class="checkbox-label"><input id="bounds" type="checkbox" ${showBoxes ? "checked" : ""}>${t("boxes")}</label><div class="zoom-controls"><button id="fit">${t("fit")}</button><select id="zoom" aria-label="${t("zoom")}">${[
    ...new Set([0.25, 0.5, 1, 2, 4, 8, zoom]),
  ]
    .sort((a, b) => a - b)
    .map(
      (z) =>
        `<option value="${z}" ${zoom === z ? "selected" : ""}>${Math.round(z * 100)}%</option>`,
    )
    .join(
      "",
    )}</select></div></div><div id="atlasViewport" class="atlas-viewport background-${atlasBackground}"><div id="atlasStage" class="atlas-stage"><canvas id="atlasCanvas" role="img" aria-label="${t("glyphCanvas")}">${t("atlasHelp")}</canvas><div id="glyphBounds" aria-hidden="true"></div></div></div><div class="atlas-background-controls" role="group" aria-label="${t("atlasBackground")}"><span>${t("atlasBackground")}</span>${[
    ["transparency", "transparency"],
    ["green", "green"],
    ["white", "white"],
  ]
    .map(
      ([value, label]) =>
        `<button type="button" data-atlas-background="${value}" aria-pressed="${atlasBackground === value}">${t(label as MessageKey)}</button>`,
    )
    .join(
      "",
    )}</div><div class="atlas-status"><span>${t("atlasHelp")}</span><span id="edited-count">${t("editedCount", { count: doc.changedGlyphs })}</span></div></section>
  <aside class="inspector" aria-labelledby="inspectorHeading"><div class="panel-heading"><h2 id="inspectorHeading">${t("inspector")}</h2><div class="history-buttons"><button id="undo" class="icon-button" aria-label="${t("undo")}" title="${t("undo")} (Ctrl+Z)" ${!doc.canUndo ? "disabled" : ""}>${icon("undo")}</button><button id="redo" class="icon-button" aria-label="${t("redo")}" title="${t("redo")} (Ctrl+Shift+Z)" ${!doc.canRedo ? "disabled" : ""}>${icon("redo")}</button></div></div>
  <div class="selected-glyph"><canvas id="glyphPreview" width="110" height="94" aria-label="${esc(t("selectGlyph", { char: glyphLabel(mapping.codepoint), codepoint: cpLabel(mapping.codepoint) }))}"></canvas><div><strong>${esc(glyphLabel(mapping.codepoint))}</strong><code>${cpLabel(mapping.codepoint)}</code><span>${t("index")} ${mapping.glyphIndex}</span></div></div>
  <form id="metricsForm" class="metric-form">${metricInput("metricX", "x", metric.x)}${metricInput("metricY", "y", metric.y)}${metricInput("metricWidth", "width", metric.width)}${btn("reset", "resetGlyph", undefined, "reset-button", !doc.isChanged(mapping.glyphIndex))}</form>
  ${aliases.length > 1 ? `<p class="alias-note">${t("codepoints")}: ${aliases.map((a) => esc(glyphLabel(a.codepoint))).join(", ")}</p>` : ""}
  <details id="globalSettings" class="font-settings"><summary>${t("sharedMetrics")}</summary><div>${metricInput("fontHeight", "height", doc.height)}${metricInput("baseline", "baseline", doc.baseline)}<p>${t("globalHelp")}</p><button id="normalize" title="${t("normalizeHelp")}">${t("normalize")}</button><p>${t("normalizeHelp")}</p></div></details>
  <details id="fontActions" class="font-settings"><summary>${t("more")}</summary><div>${btn("replace", "replaceAtlas")}<p>${t("replaceHelp", { width: r.atlasWidth, height: r.atlasHeight })}</p>${doc.pixels ? `<span class="replacement-label">${t("replacement")}</span>` : ""}${btn("png", "exportPng", "download")}${btn("json", "exportJson", "download")}</div></details></aside></div>
  <section class="preview-section" aria-labelledby="previewHeading"><div class="preview-heading"><div><h2 id="previewHeading">${t("preview")}</h2><p>${t("previewHelp")}</p></div><div class="preview-controls"><label>${t("textRendering")}<select id="previewRendering" aria-label="${t("textRendering")}"><option value="smooth" ${previewRendering === "smooth" ? "selected" : ""}>${t("smooth")}</option><option value="pixel" ${previewRendering === "pixel" ? "selected" : ""}>${t("pixelExact")}</option></select></label><label>${t("previewScale")}<select id="textScale" aria-label="${t("previewScale")}">${[0.5, 1, 1.5, 2, 3].map((s) => `<option value="${s}" ${textScale === s ? "selected" : ""}>${s}×</option>`).join("")}</select></label><label>${t("previewBackground")}<select id="previewBg" aria-label="${t("previewBackground")}">${[
    ["#22251f", "dark"],
    ["#f2efe5", "light"],
    ["#806442", "warm"],
  ]
    .map(
      ([v, k]) =>
        `<option value="${v}" ${previewBg === v ? "selected" : ""}>${t(k as MessageKey)}</option>`,
    )
    .join(
      "",
    )}</select></label></div></div><div class="preview-grid">${previewSection("en", "english", englishText)}${previewSection("uk", "ukrainian", ukrainianText)}</div></section></main>`;
}
function metricInput(label: MessageKey, field: string, value: number) {
  return `<label class="metric-row" for="${field}"><span>${t(label)}</span><div><input type="number" aria-label="${t(label)}" id="${field}" value="${value}" step="0.25" ${field !== "baseline" ? 'min="0"' : ""} required><span>${t("pixels")}</span></div></label>`;
}
function previewSection(lang: string, key: MessageKey, text: string) {
  return `<article class="text-preview"><div class="preview-label"><label for="text-${lang}" lang="${lang}">${t(key)}</label><span id="missing-${lang}" role="status" aria-live="polite"></span></div><textarea id="text-${lang}" lang="${lang}" spellcheck="false" rows="2" maxlength="4000">${esc(text)}</textarea><div class="preview-raster"><canvas id="preview-${lang}" role="img"></canvas></div></article>`;
}
function bindWorkspace(doc: FontDocument) {
  document.querySelectorAll<HTMLButtonElement>("[data-font]").forEach((b) =>
    b.addEventListener("click", () => {
      activeId = b.dataset.font!;
      sourceKey = null;
      render();
      revealSelectedGlyph();
    }),
  );
  document
    .querySelectorAll<HTMLButtonElement>("[data-close]")
    .forEach((b) =>
      b.addEventListener("click", () => closeFont(b.dataset.close!)),
    );
  byId<HTMLInputElement>("search").addEventListener("input", (e) => {
    query = (e.target as HTMLInputElement).value;
    renderList();
  });
  byId<HTMLInputElement>("editedOnly").addEventListener("change", (e) => {
    editedOnly = (e.target as HTMLInputElement).checked;
    renderList();
  });
  byId<HTMLInputElement>("bounds").addEventListener("change", (e) => {
    showBoxes = (e.target as HTMLInputElement).checked;
    renderAtlas();
  });
  byId<HTMLSelectElement>("zoom").addEventListener("change", (e) => {
    zoom = Number((e.target as HTMLSelectElement).value);
    renderAtlas();
  });
  byId("fit").addEventListener("click", fitAtlas);
  document
    .querySelectorAll<HTMLButtonElement>("[data-atlas-background]")
    .forEach((button) =>
      button.addEventListener("click", () => {
        atlasBackground = button.dataset.atlasBackground!;
        byId("atlasViewport").className =
          "atlas-viewport background-" + atlasBackground;
        document
          .querySelectorAll<HTMLButtonElement>("[data-atlas-background]")
          .forEach((item) =>
            item.setAttribute("aria-pressed", String(item === button)),
          );
      }),
    );
  byId<HTMLSelectElement>("previewRendering").addEventListener(
    "change",
    (event) => {
      previewRendering = (event.target as HTMLSelectElement).value as
        "smooth" | "pixel";
      drawPreviews();
    },
  );
  byId("undo").addEventListener("click", () => {
    doc.undo();
    refresh();
  });
  byId("redo").addEventListener("click", () => {
    doc.redo();
    refresh();
  });
  byId("metricsForm").addEventListener("submit", (e) => e.preventDefault());
  for (const field of ["x", "y", "width"])
    byId<HTMLInputElement>(field).addEventListener("change", () => {
      const index = doc.resource.mapping[doc.selected].glyphIndex;
      const next: Metric = { ...doc.metrics[index] };
      (["x", "y", "width"] as const).forEach((k) => {
        next[k] =
          byId<HTMLInputElement>(k).value === ""
            ? NaN
            : Number(byId<HTMLInputElement>(k).value);
      });
      try {
        doc.setMetric(index, next);
        byId(field).removeAttribute("aria-invalid");
        updateMetricViews(doc);
      } catch (error) {
        report(error);
        byId(field).setAttribute("aria-invalid", "true");
      }
    });
  byId("reset").addEventListener("click", (e) => {
    e.preventDefault();
    doc.resetMetric(doc.resource.mapping[doc.selected].glyphIndex);
    refresh();
  });
  for (const field of ["height", "baseline"])
    byId<HTMLInputElement>(field).addEventListener("change", () => {
      try {
        const h = byId<HTMLInputElement>("height"),
          b = byId<HTMLInputElement>("baseline");
        doc.setGlobal(
          h.value === "" ? NaN : Number(h.value),
          b.value === "" ? NaN : Number(b.value),
        );
        byId(field).removeAttribute("aria-invalid");
        updateMetricViews(doc);
      } catch (error) {
        report(error);
        byId(field).setAttribute("aria-invalid", "true");
      }
    });
  byId("normalize").addEventListener("click", () => {
    try {
      const rounded = doc.roundMetrics();
      refresh();
      notify(t(rounded ? "normalized" : "alreadyRounded"));
    } catch (error) {
      report(error);
    }
  });
  byId("replace").addEventListener("click", () =>
    byId<HTMLInputElement>("pngInput").click(),
  );
  byId("png").addEventListener("click", () => {
    source!.toBlob((blob) => {
      if (blob) saveBlob(blob, stem(doc.resource.name) + "-atlas.png");
    });
  });
  byId("json").addEventListener("click", () =>
    saveBlob(
      new Blob([JSON.stringify(doc.metadata(), null, 2)], {
        type: "application/json",
      }),
      stem(doc.resource.name) + "-metrics.json",
    ),
  );
  for (const lang of ["en", "uk"])
    byId<HTMLTextAreaElement>("text-" + lang).addEventListener("input", (e) => {
      if (lang === "en") englishText = (e.target as HTMLTextAreaElement).value;
      else ukrainianText = (e.target as HTMLTextAreaElement).value;
      drawPreviews();
    });
  byId<HTMLSelectElement>("textScale").addEventListener("change", (e) => {
    textScale = Number((e.target as HTMLSelectElement).value);
    drawPreviews();
  });
  byId<HTMLSelectElement>("previewBg").addEventListener("change", (e) => {
    previewBg = (e.target as HTMLSelectElement).value;
    drawPreviews();
  });
  byId("atlasStage").addEventListener("click", (e) => {
    const bounds = byId("atlasStage").getBoundingClientRect(),
      x = (e.clientX - bounds.left) / zoom,
      y = (e.clientY - bounds.top) / zoom;
    const hit = doc.resource.mapping.findIndex((m) => {
      const metric = doc.metrics[m.glyphIndex];
      return (
        x >= metric.x &&
        x < metric.x + metric.width &&
        y >= metric.y &&
        y < metric.y + doc.height
      );
    });
    if (hit >= 0) select(hit);
  });
}
function refresh() {
  const expanded = [
    ...document.querySelectorAll<HTMLDetailsElement>("details[open]"),
  ].map((d) => d.id);
  const scrollTop = document.getElementById("glyphList")?.scrollTop ?? 0;
  const atlas = document.getElementById("atlasViewport"),
    sx = atlas?.scrollLeft ?? 0,
    sy = atlas?.scrollTop ?? 0;
  render();
  expanded.forEach((id) => {
    const el = document.getElementById(id) as HTMLDetailsElement | null;
    if (el) el.open = true;
  });
  if (document.getElementById("glyphList"))
    byId("glyphList").scrollTop = scrollTop;
  if (document.getElementById("atlasViewport")) {
    byId("atlasViewport").scrollLeft = sx;
    byId("atlasViewport").scrollTop = sy;
  }
}
function select(index: number) {
  const doc = active();
  if (!doc) return;
  doc.selected = index;
  refresh();
  byId("glyph-" + index)?.focus({ preventScroll: true });
  revealSelectedGlyph();
}
function renderList() {
  const doc = active();
  if (!doc) return;
  const q = query.trim(),
    upper = q.toUpperCase();
  const entries = doc.resource.mapping
    .map((m, i) => ({ ...m, i }))
    .filter(
      (m) =>
        (!editedOnly || doc.isChanged(m.glyphIndex)) &&
        (!q ||
          String.fromCodePoint(m.codepoint) === q ||
          cpLabel(m.codepoint).includes(upper) ||
          String(m.glyphIndex) === q),
    );
  byId("glyphCount").textContent = String(entries.length);
  byId("glyphList").innerHTML = entries.length
    ? entries
        .map(
          (m) =>
            `<button id="glyph-${m.i}" class="glyph-item ${doc.selected === m.i ? "selected" : ""}" data-glyph="${m.i}" aria-pressed="${doc.selected === m.i}" title="${esc(t("selectGlyph", { char: glyphLabel(m.codepoint), codepoint: cpLabel(m.codepoint) }))}"><span class="glyph-char">${esc(glyphLabel(m.codepoint))}</span><code>${cpLabel(m.codepoint)}</code><span class="glyph-index" aria-hidden="true">${m.glyphIndex}</span>${doc.isChanged(m.glyphIndex) ? `<span class="edit-indicator" title="${t("edited")}" aria-label="${t("edited")}">*</span>` : ""}</button>`,
        )
        .join("")
    : `<div class="no-results"><p>${t("noResults")}</p><button id="clear">${t("clearSearch")}</button></div>`;
  document
    .querySelectorAll<HTMLButtonElement>("[data-glyph]")
    .forEach((b) =>
      b.addEventListener("click", () => select(Number(b.dataset.glyph))),
    );
  document.getElementById("clear")?.addEventListener("click", () => {
    query = "";
    editedOnly = false;
    refresh();
    byId("search").focus();
  });
}
function ensureSource(doc: FontDocument) {
  if (sourceKey !== doc.rgba) {
    source = atlasCanvas(doc);
    sourceKey = doc.rgba;
  }
}
function renderAtlas() {
  const doc = active();
  if (!doc) return;
  ensureSource(doc);
  const canvas = byId<HTMLCanvasElement>("atlasCanvas");
  canvas.width = source!.width;
  canvas.height = source!.height;
  canvas.getContext("2d")!.drawImage(source!, 0, 0);
  byId("atlasStage").style.width = doc.resource.atlasWidth * zoom + "px";
  byId("atlasStage").style.height = doc.resource.atlasHeight * zoom + "px";
  const selectedIndex = doc.resource.mapping[doc.selected].glyphIndex;
  const unique = [...new Set(doc.resource.mapping.map((m) => m.glyphIndex))];
  byId("glyphBounds").innerHTML = unique
    .filter((i) => showBoxes || i === selectedIndex)
    .map((i) => {
      const m = doc.metrics[i];
      return `<span class="bound ${i === selectedIndex ? "selected-bound" : ""} ${doc.isChanged(i) ? "edited-bound" : ""}" style="left:${m.x * zoom}px;top:${m.y * zoom}px;width:${Math.max(1, m.width * zoom)}px;height:${doc.height * zoom}px"></span>`;
    })
    .join("");
  const glyph = byId<HTMLCanvasElement>("glyphPreview"),
    ctx = glyph.getContext("2d")!;
  ctx.clearRect(0, 0, glyph.width, glyph.height);
  ctx.imageSmoothingEnabled = false;
  const m = doc.metrics[selectedIndex],
    s = Math.min(4, 90 / Math.max(1, m.width), 74 / doc.height);
  if (m.width > 0)
    ctx.drawImage(
      source!,
      m.x,
      m.y,
      m.width,
      doc.height,
      (110 - m.width * s) / 2,
      (94 - doc.height * s) / 2,
      m.width * s,
      doc.height * s,
    );
}
function fitAtlas() {
  const doc = active();
  if (!doc) return;
  const port = byId("atlasViewport");
  zoom = Math.min(
    (port.clientWidth - 40) / doc.resource.atlasWidth,
    (port.clientHeight - 40) / doc.resource.atlasHeight,
    4,
  );
  renderAtlas();
  const select = byId<HTMLSelectElement>("zoom");
  const option = document.createElement("option");
  option.value = String(zoom);
  option.textContent = `${Math.round(zoom * 100)}%`;
  option.selected = true;
  select.add(option);
}
function drawPreviews() {
  const doc = active();
  if (!doc) return;
  ensureSource(doc);
  for (const [lang, text, key] of [
    ["en", englishText, "english"],
    ["uk", ukrainianText, "ukrainian"],
  ] as const) {
    const missing = renderPreview(
      byId<HTMLCanvasElement>("preview-" + lang),
      source!,
      doc,
      text,
      textScale,
      previewBg,
      t(key),
      previewRendering,
    );
    const el = byId("missing-" + lang);
    el.textContent = missing.length
      ? t("missing", { chars: missing.join(" ") })
      : t("noMissing");
    el.className = missing.length ? "missing" : "complete";
  }
}
async function importFiles(files: FileList | File[] | null) {
  if (!files?.length || busy) return;
  const previousId = activeId;
  busy = true;
  notify(t("loading"));
  // Yield to paint the busy status before decoding each resource.
  for (const file of Array.from(files)) {
    try {
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
      if (!/\.fnt$/i.test(file.name)) throw new FontError("unsupportedFile");
      if (file.size > MAX_FILE_BYTES) throw new FontError("invalidFileSize");
      const doc = new FontDocument(
        parseFnt(new Uint8Array(await file.arrayBuffer()), file.name),
      );
      docs.push(doc);
      activeId = doc.id;
    } catch (error) {
      report(error);
    }
  }
  busy = false;
  if (activeId !== previousId) {
    zoom = 1;
    render();
  } else {
    refresh();
  }
  if (!isError) notify(t("opened", { name: active()?.resource.name ?? "" }));
  if (active() && activeId !== previousId) revealSelectedGlyph();
}
async function loadDemo() {
  if (busy) return;
  busy = true;
  try {
    const doc = await createDemo();
    docs.push(doc);
    activeId = doc.id;
    zoom = 1;
    render();
    notify(t("demoLoaded") + " " + t("demoNote"));
  } catch (error) {
    report(error);
  } finally {
    busy = false;
    render();
  }
}
function closeFont(id: string) {
  const index = docs.findIndex((d) => d.id === id),
    doc = docs[index];
  if (
    !doc ||
    (doc.dirty && !confirm(t("closeConfirm", { name: doc.resource.name })))
  )
    return;
  docs.splice(index, 1);
  if (activeId === id)
    activeId = docs[Math.min(index, docs.length - 1)]?.id ?? "";
  sourceKey = null;
  render();
}
async function replacePng(file: File) {
  const doc = active();
  if (!doc || busy) return;
  let bitmap: ImageBitmap | undefined;
  try {
    if (!/\.png$/i.test(file.name) || file.size > MAX_FILE_BYTES)
      throw new FontError("invalidPng");
    // Read IHDR before decoding to avoid allocating an oversized image.
    const header = new Uint8Array(await file.slice(0, 24).arrayBuffer());
    if (
      header.length < 24 ||
      ![137, 80, 78, 71, 13, 10, 26, 10].every((v, i) => header[i] === v)
    )
      throw new FontError("invalidPng");
    const hv = new DataView(header.buffer);
    if (
      hv.getUint32(16) !== doc.resource.atlasWidth ||
      hv.getUint32(20) !== doc.resource.atlasHeight
    )
      throw new FontError("atlasSize");
    bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0);
    doc.replacePixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
    refresh();
    notify(t("replaced"));
  } catch (error) {
    report(error instanceof FontError ? error : new FontError("invalidPng"));
  } finally {
    bitmap?.close();
  }
}
const stem = (name: string) => name.replace(/\.fnt$/i, "");
function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  notify(t("downloaded", { name }));
}
async function downloadFnt() {
  const doc = active();
  if (!doc || busy) return;
  const snapshot = doc.snapshot();
  busy = true;
  render();
  try {
    let texture: Uint8Array | undefined;
    if (snapshot.pixels) {
      notify(t("encoding"));
      texture = await new Promise<Uint8Array>((resolve, reject) => {
        const worker = new Worker(
          new URL("./core/texture.worker.ts", import.meta.url),
          { type: "module" },
        );
        const stop = () => {
          clearTimeout(timer);
          worker.terminate();
        };
        const timer = setTimeout(() => {
          stop();
          reject(new FontError("textureEncoding"));
        }, 120_000);
        worker.onmessage = (e) => {
          stop();
          if (e.data.error) reject(new FontError("textureEncoding"));
          else resolve(e.data.texture);
        };
        worker.onerror = () => {
          stop();
          reject(new FontError("textureEncoding"));
        };
        worker.postMessage({
          pixels: snapshot.pixels,
          width: doc.resource.atlasWidth,
          height: doc.resource.atlasHeight,
          mipCount: doc.resource.mipCount,
        });
      });
    }
    const bytes = doc.export(texture, snapshot);
    saveBlob(
      new Blob([new Uint8Array(bytes)], { type: "application/octet-stream" }),
      stem(doc.resource.name) + "-edited.FNT",
    );
    doc.markExported(snapshot);
  } catch (error) {
    report(error);
  } finally {
    busy = false;
    render();
  }
}
let dragDepth = 0;
document.addEventListener("dragenter", (e) => {
  if (e.dataTransfer?.types.includes("Files")) {
    e.preventDefault();
    dragDepth++;
    byId("dropOverlay").hidden = false;
  }
});
document.addEventListener("dragover", (e) => {
  if (e.dataTransfer?.types.includes("Files")) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }
});
document.addEventListener("dragleave", () => {
  dragDepth = Math.max(0, dragDepth - 1);
  if (!dragDepth && document.getElementById("dropOverlay"))
    byId("dropOverlay").hidden = true;
});
document.addEventListener("drop", (e) => {
  e.preventDefault();
  dragDepth = 0;
  byId("dropOverlay").hidden = true;
  void importFiles(e.dataTransfer?.files ?? null);
});
window.addEventListener("blur", () => {
  dragDepth = 0;
  if (document.getElementById("dropOverlay")) byId("dropOverlay").hidden = true;
});
window.addEventListener("beforeunload", (e) => {
  if (docs.some((d) => d.dirty)) {
    e.preventDefault();
    e.returnValue = "";
  }
});
document.addEventListener("keydown", (e) => {
  if (
    e.target instanceof HTMLInputElement ||
    e.target instanceof HTMLTextAreaElement ||
    e.target instanceof HTMLSelectElement
  )
    return;
  const doc = active();
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && doc) {
    e.preventDefault();
    e.shiftKey ? doc.redo() : doc.undo();
    refresh();
  }
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "o") {
    e.preventDefault();
    byId<HTMLInputElement>("fileInput").click();
  }
});
render();

/** Leave the focused inspector inputs intact during native stepper changes. */
function updateMetricViews(doc: FontDocument) {
  renderList();
  renderAtlas();
  drawPreviews();
  byId<HTMLButtonElement>("undo").disabled = !doc.canUndo;
  byId<HTMLButtonElement>("redo").disabled = !doc.canRedo;
  byId<HTMLButtonElement>("reset").disabled = !doc.isChanged(
    doc.resource.mapping[doc.selected].glyphIndex,
  );
  byId("edited-count").textContent = t("editedCount", {
    count: doc.changedGlyphs,
  });
  byId("filter-edited-count").textContent = String(doc.changedGlyphs);
  const tab = document.querySelector<HTMLButtonElement>(
    `[data-font="${doc.id}"]`,
  )!;
  const dot = tab.querySelector(".dirty");
  if (doc.dirty && !dot) {
    const el = document.createElement("span");
    el.className = "dirty";
    el.setAttribute("aria-label", t("unsaved"));
    tab.append(el);
  } else if (!doc.dirty) dot?.remove();
}

/** Reveal selection within the atlas only; never scroll the page or change zoom. */
function revealSelectedGlyph() {
  const port = document.getElementById("atlasViewport");
  const selected = document.querySelector<HTMLElement>(".selected-bound");
  if (!port || !selected) return;
  const viewport = port.getBoundingClientRect(),
    bounds = selected.getBoundingClientRect();
  const left = viewport.left + port.clientLeft,
    top = viewport.top + port.clientTop;
  if (bounds.left < left || bounds.right > left + port.clientWidth)
    port.scrollLeft +=
      (bounds.left + bounds.right) / 2 - left - port.clientWidth / 2;
  if (bounds.top < top || bounds.bottom > top + port.clientHeight)
    port.scrollTop +=
      (bounds.top + bounds.bottom) / 2 - top - port.clientHeight / 2;
}
window.addEventListener("resize", drawPreviews);
