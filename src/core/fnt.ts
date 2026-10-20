import { mipLevels } from "./bc3";
import {
  FontError,
  MAX_FILE_BYTES,
  MAX_PIXELS,
  type FontResource,
  type Metric,
} from "./types";

export function parseFnt(input: Uint8Array, name = "font.fnt"): FontResource {
  if (input.length < 0x60 + 128 + 128 || input.length > MAX_FILE_BYTES)
    throw new FontError("invalidFileSize");
  const original = input.slice(),
    v = new DataView(original.buffer);
  const range = (offset: number, size: number) => {
    if (
      !Number.isSafeInteger(offset) ||
      !Number.isSafeInteger(size) ||
      offset < 0 ||
      size < 0 ||
      offset + size > original.length
    )
      throw new FontError("invalidRange");
  };
  const u32 = (p: number) => {
    range(p, 4);
    return v.getUint32(p, true);
  };
  const relative = (p: number) => {
    range(p, 4);
    const target = p + v.getInt32(p, true);
    range(target, 0);
    return target;
  };
  const ddsOffset = relative(8),
    footerOffset = relative(0);
  range(ddsOffset, 128);
  if (
    String.fromCharCode(...original.subarray(ddsOffset, ddsOffset + 4)) !==
      "DDS " ||
    u32(ddsOffset + 4) !== 124 ||
    u32(ddsOffset + 76) !== 32
  )
    throw new FontError("unsupportedFormat");
  if (
    String.fromCharCode(
      ...original.subarray(ddsOffset + 84, ddsOffset + 88),
    ) !== "DXT5"
  )
    throw new FontError("unsupportedTexture");
  const atlasHeight = u32(ddsOffset + 12),
    atlasWidth = u32(ddsOffset + 16),
    mipCount = u32(ddsOffset + 28);
  if (
    !atlasWidth ||
    !atlasHeight ||
    atlasWidth > 4096 ||
    atlasHeight > 4096 ||
    atlasWidth * atlasHeight > MAX_PIXELS ||
    mipCount < 1 ||
    mipCount > Math.floor(Math.log2(Math.max(atlasWidth, atlasHeight))) + 1 ||
    u32(ddsOffset + 112) !== 0
  )
    throw new FontError("invalidTexture");
  const ddsSize =
    128 +
    mipLevels(atlasWidth, atlasHeight, mipCount).reduce(
      (s, l) => s + l.size,
      0,
    );
  if (ddsOffset + ddsSize !== footerOffset)
    throw new FontError("invalidMipChain");
  range(ddsOffset, ddsSize);
  const descriptor = ddsOffset - 128;
  if (
    u32(descriptor) !== atlasWidth ||
    u32(descriptor + 4) !== atlasHeight ||
    u32(descriptor + 64) !== mipCount ||
    u32(descriptor + 68) !== ddsSize
  )
    throw new FontError("invalidDescriptor");
  const glyphCount = u32(0x1c),
    mapCount = u32(0x20),
    metricsOffset = relative(0x44),
    mappingOffset = relative(0x48);
  if (
    !glyphCount ||
    glyphCount > 65535 ||
    !mapCount ||
    mapCount > 65535 ||
    metricsOffset < 0x60 ||
    metricsOffset + glyphCount * 12 > mappingOffset ||
    mappingOffset + mapCount * 4 > descriptor
  )
    throw new FontError("invalidTables");
  range(metricsOffset, glyphCount * 12);
  range(mappingOffset, mapCount * 4);
  const height = v.getFloat32(0x24, true),
    baseline = v.getFloat32(0x28, true);
  if (
    !Number.isFinite(height) ||
    height <= 0 ||
    height > atlasHeight ||
    !Number.isFinite(baseline)
  )
    throw new FontError("invalidMetrics");
  const metrics: Metric[] = [];
  for (let i = 0; i < glyphCount; i++) {
    const p = metricsOffset + i * 12,
      metric = {
        x: v.getFloat32(p, true),
        y: v.getFloat32(p + 4, true),
        width: v.getFloat32(p + 8, true),
      };
    if (Object.values(metric).some((x) => !Number.isFinite(x)))
      throw new FontError("invalidMetrics");
    metrics.push(metric);
  }
  const mapping: FontResource["mapping"] = [];
  let sentinel = false;
  for (let i = 0; i < mapCount; i++) {
    const p = mappingOffset + i * 4,
      codepoint = v.getUint16(p, true),
      glyphIndex = v.getUint16(p + 2, true);
    if (codepoint === 0xffff && glyphIndex === 0xffff) {
      sentinel = true;
      continue;
    }
    if (
      sentinel ||
      glyphIndex >= glyphCount ||
      (codepoint >= 0xd800 && codepoint <= 0xdfff)
    )
      throw new FontError("invalidMapping");
    mapping.push({ codepoint, glyphIndex });
  }
  if (!sentinel || !mapping.length) throw new FontError("invalidMapping");
  const warnings: string[] = [];
  const relocCount = u32(footerOffset);
  range(footerOffset + 4, relocCount * 4);
  if (relocCount > 1024) throw new FontError("invalidRelocation");
  for (let i = 0; i < relocCount; i++) {
    const field = relative(footerOffset + 4 + i * 4);
    range(field, 4);
    const target = field + v.getInt32(field, true);
    // Historical resources can contain stale values in opaque pointer fields.
    // Fixed-size edits retain those bytes rather than inventing a repair.
    if (
      v.getInt32(field, true) !== 0 &&
      (target < 0 || target >= original.length)
    )
      warnings.push("opaquePointer");
  }
  const mapped = new Set(mapping.map((m) => m.glyphIndex));
  if (
    [...mapped].some((i) => {
      const m = metrics[i];
      return (
        m.x < 0 ||
        m.y < 0 ||
        m.width < 0 ||
        m.x + m.width > atlasWidth ||
        m.y + height > atlasHeight
      );
    })
  )
    warnings.push("sourceBounds");
  return {
    name,
    original,
    metrics,
    mapping,
    height,
    baseline,
    atlasWidth,
    atlasHeight,
    metricsOffset,
    mappingOffset,
    ddsOffset,
    footerOffset,
    mipCount,
    warnings: [...new Set(warnings)],
  };
}

export function validateMetric(
  m: Metric,
  font: Pick<FontResource, "atlasWidth" | "atlasHeight" | "height">,
): void {
  if (
    Object.values(m).some((x) => !Number.isFinite(x)) ||
    m.x < 0 ||
    m.y < 0 ||
    m.width < 0 ||
    m.x + m.width > font.atlasWidth ||
    m.y + font.height > font.atlasHeight
  )
    throw new FontError("metricBounds");
}

export function exportFnt(
  font: FontResource,
  metrics = font.metrics,
  height = font.height,
  baseline = font.baseline,
  texture?: Uint8Array,
): Uint8Array {
  const out = font.original.slice(),
    v = new DataView(out.buffer),
    source = new DataView(font.original.buffer);
  if (
    metrics.length !== font.metrics.length ||
    !Number.isFinite(height) ||
    height <= 0 ||
    height > font.atlasHeight ||
    !Number.isFinite(baseline)
  )
    throw new FontError("invalidMetrics");
  metrics.forEach((m, i) => {
    const p = font.metricsOffset + i * 12;
    // Preserve all original bytes when a metric did not change, including -0.
    (["x", "y", "width"] as const).forEach((key, j) => {
      const value = m[key];
      if (!Number.isFinite(value)) throw new FontError("invalidMetrics");
      if (!Object.is(value, source.getFloat32(p + j * 4, true)))
        v.setFloat32(p + j * 4, value, true);
    });
  });
  if (!Object.is(height, source.getFloat32(0x24, true)))
    v.setFloat32(0x24, height, true);
  if (!Object.is(baseline, source.getFloat32(0x28, true)))
    v.setFloat32(0x28, baseline, true);
  if (texture) {
    if (texture.length !== font.footerOffset - font.ddsOffset - 128)
      throw new FontError("invalidTexture");
    out.set(texture, font.ddsOffset + 128);
  }
  return out;
}
