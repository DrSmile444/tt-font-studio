import { FontDocument } from "../core/document";
import { t } from "../i18n";

export function atlasCanvas(doc: FontDocument): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = doc.resource.atlasWidth;
  canvas.height = doc.resource.atlasHeight;
  canvas
    .getContext("2d")!
    .putImageData(
      new ImageData(
        new Uint8ClampedArray(doc.rgba),
        canvas.width,
        canvas.height,
      ),
      0,
      0,
    );
  return canvas;
}
export const cpLabel = (cp: number) =>
  "U+" + cp.toString(16).toUpperCase().padStart(4, "0");
export function glyphLabel(cp: number) {
  return cp === 32 ? "␣" : cp < 32 ? cpLabel(cp) : String.fromCodePoint(cp);
}
export type PreviewRendering = "smooth" | "pixel";

export function renderPreview(
  canvas: HTMLCanvasElement,
  source: HTMLCanvasElement,
  doc: FontDocument,
  text: string,
  scale: number,
  background: string,
  language: string,
  rendering: PreviewRendering = "smooth",
): string[] {
  const ctx = canvas.getContext("2d")!;
  const mapping = new Map<number, number>();
  for (const m of doc.resource.mapping)
    if (!mapping.has(m.codepoint)) mapping.set(m.codepoint, m.glyphIndex);
  // Bound raster output even for extreme metrics or very long pasted text.
  const lines = text.slice(0, 4000).split("\n").slice(0, 20),
    lineHeight = Math.ceil(doc.height * scale + 12);
  const missing = new Set<string>();
  const widths = lines.map((line) =>
    [...line].reduce((sum, c) => {
      const i = mapping.get(c.codePointAt(0)!);
      return (
        sum +
        (i === undefined
          ? doc.height * 0.6
          : Math.max(0, doc.metrics[i].width)) *
          scale
      );
    }, 0),
  );
  const desiredWidth = Math.max(
    240,
    Math.min(6000, Math.ceil(Math.max(0, ...widths) + 32)),
  );
  const desiredHeight = Math.max(
    60,
    Math.min(4096, lines.length * lineHeight + 24),
  );
  const logicalHeight = Math.min(
    desiredHeight,
    Math.floor(8_000_000 / desiredWidth),
  );
  const density = Math.min(
    Math.max(1, window.devicePixelRatio || 1),
    3,
    Math.sqrt(8_000_000 / (desiredWidth * logicalHeight)),
  );
  canvas.width = Math.max(1, Math.floor(desiredWidth * density));
  canvas.height = Math.max(1, Math.floor(logicalHeight * density));
  canvas.style.width = desiredWidth + "px";
  canvas.style.height = logicalHeight + "px";
  canvas.style.imageRendering = rendering === "smooth" ? "auto" : "pixelated";
  ctx.setTransform(
    canvas.width / desiredWidth,
    0,
    0,
    canvas.height / logicalHeight,
    0,
    0,
  );
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, desiredWidth, logicalHeight);
  ctx.imageSmoothingEnabled = rendering === "smooth";
  ctx.imageSmoothingQuality = "high";
  lines.forEach((line, row) => {
    let x = 16;
    const y = 12 + row * lineHeight;
    for (const c of line) {
      const index = mapping.get(c.codePointAt(0)!);
      if (index === undefined) {
        const w = doc.height * 0.6 * scale;
        missing.add(c);
        ctx.strokeStyle = background === "#f2efe5" ? "#a32d23" : "#ff9c8c";
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.strokeRect(
          x + 1,
          y + 1,
          Math.max(4, w - 3),
          doc.height * scale - 2,
        );
        ctx.setLineDash([]);
        x += w;
      } else {
        const m = doc.metrics[index];
        if (c !== " " && m.width > 0)
          ctx.drawImage(
            source,
            m.x,
            m.y,
            m.width,
            doc.height,
            x,
            y,
            m.width * scale,
            doc.height * scale,
          );
        x += Math.max(0, m.width) * scale;
      }
    }
  });
  canvas.setAttribute("aria-label", t("previewCanvas", { language }));
  canvas.textContent = text;
  return [...missing];
}
