import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { makeFixture } from "../src/core/fixture";
import { parseFnt, exportFnt } from "../src/core/fnt";
import { FontDocument } from "../src/core/document";
import {
  decodeBC3,
  encodeBC3,
  downsample,
  encodeMipChain,
  mipLevels,
} from "../src/core/bc3";
import { setLocale, t } from "../src/i18n";

const fixture1 = makeFixture();
const fixture2 = makeFixture({
  width: 512,
  height: 512,
  sentinels: 3,
  colored: true,
});

describe("classic TT Games FNT", () => {
  it.each([
    ["Font 1", fixture1],
    ["Font 2", fixture2],
  ] as const)("round-trips %s without changing a byte", (_name, bytes) => {
    const font = parseFnt(bytes);
    expect(font.mapping.length).toBeGreaterThan(150);
    expect(exportFnt(font)).toEqual(bytes);
    expect(font.atlasWidth).toBe(_name === "Font 1" ? 256 : 512);
  });
  it("retains duplicate mappings and aliases while editing one shared record", () => {
    const bytes = fixture1.slice(),
      source = parseFnt(bytes),
      v = new DataView(bytes.buffer);
    v.setUint16(source.mappingOffset + 6, source.mapping[0].glyphIndex, true);
    const font = parseFnt(bytes),
      doc = new FontDocument(font),
      index = font.mapping[0].glyphIndex;
    expect(font.mapping[1].glyphIndex).toBe(index);
    doc.setMetric(index, { ...doc.metrics[index], width: 8.25 });
    const exported = parseFnt(doc.export());
    expect(exported.metrics[exported.mapping[0].glyphIndex].width).toBe(8.25);
    expect(exported.metrics[exported.mapping[1].glyphIndex].width).toBe(8.25);
    expect(exported.original.subarray(font.mappingOffset)).toEqual(
      bytes.subarray(font.mappingOffset),
    );
  });
  it("changes only the intended metric bytes and preserves DDS and footer", () => {
    const font = parseFnt(fixture2),
      doc = new FontDocument(font);
    doc.setMetric(0, { ...doc.metrics[0], width: 7 });
    const bytes = doc.export();
    const delta = Array.from(bytes).flatMap((byte, i) =>
      byte !== font.original[i] ? [i] : [],
    );
    expect(delta.length).toBeGreaterThan(0);
    expect(
      [...delta].every(
        (i) => i >= font.metricsOffset + 8 && i < font.metricsOffset + 12,
      ),
    ).toBe(true);
    expect(bytes.subarray(font.ddsOffset)).toEqual(
      font.original.subarray(font.ddsOffset),
    );
  });
  it.each([0, 16, 255])("rejects truncated input of %i bytes", (length) => {
    expect(() => parseFnt(fixture1.slice(0, length))).toThrow();
  });
  it.each([0, 8, 0x1c, 0x20, 0x44, 0x48])(
    "rejects corrupted structural field at %i",
    (offset) => {
      const bytes = fixture1.slice();
      new DataView(bytes.buffer).setUint32(offset, 0x7fffffff, true);
      expect(() => parseFnt(bytes)).toThrow();
    },
  );
  it("rejects unsupported texture and oversized atlas before decoding", () => {
    const font = parseFnt(fixture1),
      bytes = fixture1.slice(),
      v = new DataView(bytes.buffer);
    bytes[font.ddsOffset + 87] = 49;
    expect(() => parseFnt(bytes)).toThrow("unsupportedTexture");
    bytes[font.ddsOffset + 87] = 53;
    v.setUint32(font.ddsOffset + 16, 50000, true);
    expect(() => parseFnt(bytes)).toThrow("invalidTexture");
  });
  it("preserves negative zero and unknown bytes on no-op export", () => {
    const bytes = fixture1.slice();
    const v = new DataView(bytes.buffer);
    v.setFloat32(0x60, -0, true);
    bytes[0x50] = 219;
    expect(exportFnt(parseFnt(bytes))).toEqual(bytes);
  });
  it("preserves opaque pointer targets but rejects invalid relocation field locations", () => {
    const bytes = fixture1.slice();
    const v = new DataView(bytes.buffer),
      font = parseFnt(bytes);
    v.setInt32(font.footerOffset + 8, 0x4c - (font.footerOffset + 8), true);
    v.setInt32(0x4c, -123456, true);
    const parsed = parseFnt(bytes);
    expect(parsed.warnings).toContain("opaquePointer");
    expect(exportFnt(parsed)).toEqual(bytes);
    v.setInt32(font.footerOffset + 8, 0x7fffffff, true);
    expect(() => parseFnt(bytes)).toThrow();
  });
});

describe("document history and validation", () => {
  it("normalizes atomically and undoes to exact original metrics", () => {
    const doc = new FontDocument(parseFnt(fixture1));
    doc.setMetric(0, { x: 0.2, y: 0.4, width: 7.6 });
    const before = doc.snapshot();
    expect(doc.roundMetrics()).toBe(true);
    expect(doc.metrics[0]).toEqual({ x: 0, y: 0, width: 8 });
    doc.undo();
    expect(doc.snapshot()).toEqual(before);
    doc.redo();
    expect(doc.metrics[0].width).toBe(8);
  });
  it("tracks unsaved edits across export, undo, and divergent history", () => {
    const doc = new FontDocument(parseFnt(fixture1));
    expect(doc.dirty).toBe(false);
    doc.setMetric(0, { ...doc.metrics[0], width: 8 });
    expect(doc.dirty).toBe(true);
    doc.markExported(doc.snapshot());
    expect(doc.dirty).toBe(false);
    doc.undo();
    expect(doc.dirty).toBe(true);
    doc.redo();
    expect(doc.dirty).toBe(false);
    doc.undo();
    doc.setMetric(0, { ...doc.metrics[0], width: 9 });
    expect(doc.canRedo).toBe(false);
  });
  it.each([NaN, Infinity, -1, 100000])(
    "rejects invalid metric %s without altering history",
    (value) => {
      const doc = new FontDocument(parseFnt(fixture1));
      expect(() =>
        doc.setMetric(0, { ...doc.metrics[0], width: value }),
      ).toThrow();
      expect(doc.canUndo).toBe(false);
    },
  );
  it("rejects invalid shared metrics", () => {
    const doc = new FontDocument(parseFnt(fixture1));
    expect(() => doc.setGlobal(-1, 2)).toThrow();
    expect(() => doc.setGlobal(14, 99)).toThrow();
  });
  it("keeps documents independent and can undo texture replacement", () => {
    const first = new FontDocument(parseFnt(fixture1)),
      second = new FontDocument(parseFnt(fixture2));
    const pixels = first.originalPixels.slice();
    pixels[0] = pixels[0] ^ 255;
    first.replacePixels(pixels);
    expect(first.dirty).toBe(true);
    expect(second.dirty).toBe(false);
    first.undo();
    expect(first.pixels).toBeNull();
    expect(first.dirty).toBe(false);
  });
});

describe("BC3 codec against independent blocks", () => {
  it("decodes opaque red from RGB565 and first alpha endpoint", () => {
    const block = new Uint8Array(16);
    block[0] = 255;
    block[9] = 0xf8;
    const pixels = decodeBC3(block, 4, 4);
    for (let i = 0; i < 16; i++)
      expect([...pixels.slice(i * 4, i * 4 + 4)]).toEqual([255, 0, 0, 255]);
  });
  it("decodes alpha special mode index 7 as opaque", () => {
    const block = new Uint8Array(16);
    block[1] = 100;
    block.fill(255, 2, 8);
    block[8] = 0xff;
    block[9] = 0xff;
    expect([...decodeBC3(block, 1, 1)]).toEqual([255, 255, 255, 255]);
  });
  it("supports partial blocks and encodes a solid-color reference", () => {
    const pixels = new Uint8ClampedArray(3 * 5 * 4);
    for (let i = 0; i < pixels.length; i += 4) pixels.set([255, 0, 0, 255], i);
    const encoded = encodeBC3(pixels, 3, 5);
    expect(encoded.length).toBe(32);
    expect(decodeBC3(encoded, 3, 5)).toEqual(pixels);
  });
  it("filters alpha without blackening visible edge colors", () => {
    const result = downsample(
      new Uint8ClampedArray([
        255, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
      ]),
      2,
      2,
    );
    expect([...result]).toEqual([255, 0, 0, 64]);
  });
  it("replaces every mip level and retains the resource structure", () => {
    const font = parseFnt(fixture2),
      pixels = new Uint8ClampedArray(font.atlasWidth * font.atlasHeight * 4);
    pixels.fill(255);
    const texture = encodeMipChain(
        pixels,
        font.atlasWidth,
        font.atlasHeight,
        font.mipCount,
      ),
      exported = parseFnt(
        exportFnt(font, font.metrics, font.height, font.baseline, texture),
      );
    expect(exported.mipCount).toBe(font.mipCount);
    for (const level of mipLevels(
      font.atlasWidth,
      font.atlasHeight,
      font.mipCount,
    ))
      expect(
        decodeBC3(
          texture.subarray(level.offset),
          level.width,
          level.height,
        ).every((v) => v === 255),
      ).toBe(true);
  });
});

describe("i18n", () => {
  it("falls back to English and interpolates future translations", () => {
    setLocale("test", { openFonts: "Open translated" });
    expect(t("openFonts")).toBe("Open translated");
    expect(t("exportFnt")).toBe("Export FNT");
    expect(t("opened", { name: "FONT.FNT" })).toBe("Opened FONT.FNT.");
    setLocale("en");
  });
});

const privateDir = process.env.TT_PRIVATE_FIXTURES;
describe.skipIf(!privateDir)(
  "private real-world FNT integration (never distributed)",
  () => {
    const files = privateDir
      ? readdirSync(privateDir).filter((f) => f.toLowerCase().endsWith(".fnt"))
      : [];
    it.each(files)(
      "loads, previews pixels, edits, and round-trips %s",
      (name) => {
        const bytes = new Uint8Array(readFileSync(join(privateDir!, name))),
          font = parseFnt(bytes, name),
          doc = new FontDocument(font);
        expect(doc.export()).toEqual(bytes);
        expect(doc.rgba.length).toBe(font.atlasWidth * font.atlasHeight * 4);
        const entry = font.mapping.find((m) => m.codepoint === 65)!;
        expect(entry).toBeDefined();
        const m = doc.metrics[entry.glyphIndex];
        doc.setMetric(entry.glyphIndex, { ...m, width: m.width - 0.25 });
        expect(parseFnt(doc.export()).metrics[entry.glyphIndex].width).toBe(
          m.width - 0.25,
        );
        doc.undo();
        expect(doc.export()).toEqual(bytes);
      },
    );
  },
);
