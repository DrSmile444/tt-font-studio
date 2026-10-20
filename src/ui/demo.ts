import { makeFixture } from "../core/fixture";
import { parseFnt } from "../core/fnt";
import { FontDocument } from "../core/document";

export async function createDemo() {
  await document.fonts.ready;
  const doc = new FontDocument(parseFnt(makeFixture(), "DEMO_FONT.FNT"));
  const canvas = document.createElement("canvas");
  canvas.width = doc.resource.atlasWidth;
  canvas.height = doc.resource.atlasHeight;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f5efdb";
  ctx.font = 'bold 11px "Public Sans Variable", sans-serif';
  for (const m of doc.resource.mapping) {
    if (m.codepoint === 32) continue;
    const metric = doc.metrics[m.glyphIndex];
    ctx.fillText(
      String.fromCodePoint(m.codepoint),
      metric.x + 1,
      metric.y + 11,
      10,
    );
  }
  doc.replacePixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
  doc.markExported(doc.snapshot());
  return doc;
}
