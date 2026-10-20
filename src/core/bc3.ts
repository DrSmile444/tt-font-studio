import { FontError, MAX_PIXELS } from "./types";

export const blockBytes = (w: number, h: number) =>
  Math.ceil(w / 4) * Math.ceil(h / 4) * 16;
export function mipLevels(width: number, height: number, count: number) {
  const levels: {
    width: number;
    height: number;
    offset: number;
    size: number;
  }[] = [];
  let offset = 0;
  for (let i = 0; i < count; i++) {
    const size = blockBytes(width, height);
    levels.push({ width, height, offset, size });
    offset += size;
    width = Math.max(1, width >> 1);
    height = Math.max(1, height >> 1);
  }
  return levels;
}
const rgb565 = (c: number) => [
  Math.round((((c >> 11) & 31) * 255) / 31),
  Math.round((((c >> 5) & 63) * 255) / 63),
  Math.round(((c & 31) * 255) / 31),
];
const to565 = (r: number, g: number, b: number) =>
  (Math.round((r * 31) / 255) << 11) |
  (Math.round((g * 63) / 255) << 5) |
  Math.round((b * 31) / 255);
const alphaPalette = (a: number, b: number) =>
  a > b
    ? [
        a,
        b,
        ...Array.from({ length: 6 }, (_, i) =>
          Math.floor(((6 - i) * a + (i + 1) * b) / 7),
        ),
      ]
    : [
        a,
        b,
        ...Array.from({ length: 4 }, (_, i) =>
          Math.floor(((4 - i) * a + (i + 1) * b) / 5),
        ),
        0,
        255,
      ];
const colors = (a: number, b: number) => {
  const c = rgb565(a),
    d = rgb565(b);
  return [
    c,
    d,
    c.map((v, i) => Math.floor((2 * v + d[i]) / 3)),
    c.map((v, i) => Math.floor((v + 2 * d[i]) / 3)),
  ];
};

export function decodeBC3(
  data: Uint8Array,
  width: number,
  height: number,
): Uint8ClampedArray {
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < 1 ||
    height < 1 ||
    width * height > MAX_PIXELS ||
    data.length < blockBytes(width, height)
  )
    throw new FontError("invalidTexture");
  const rgba = new Uint8ClampedArray(width * height * 4);
  const view = new DataView(data.buffer, data.byteOffset, data.byteLength);
  let off = 0;
  for (let by = 0; by < height; by += 4)
    for (let bx = 0; bx < width; bx += 4, off += 16) {
      const ap = alphaPalette(data[off], data[off + 1]);
      const cp = colors(
        view.getUint16(off + 8, true),
        view.getUint16(off + 10, true),
      );
      const cb = view.getUint32(off + 12, true);
      let ab = 0;
      for (let i = 0; i < 6; i++) ab += data[off + 2 + i] * 2 ** (8 * i);
      for (let p = 0; p < 16; p++) {
        const x = bx + (p % 4),
          y = by + (p >> 2);
        if (x >= width || y >= height) continue;
        const dest = (y * width + x) * 4,
          c = cp[(cb >>> (p * 2)) & 3];
        rgba[dest] = c[0];
        rgba[dest + 1] = c[1];
        rgba[dest + 2] = c[2];
        rgba[dest + 3] = ap[Math.floor(ab / 2 ** (p * 3)) % 8];
      }
    }
  return rgba;
}

/** Visible luminance endpoints, adapted from the reference project's MIT BC3 encoder. */
export function encodeBC3(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8Array {
  if (rgba.length !== width * height * 4 || width * height > MAX_PIXELS)
    throw new FontError("invalidTexture");
  const out = new Uint8Array(blockBytes(width, height)),
    view = new DataView(out.buffer);
  let off = 0;
  for (let by = 0; by < height; by += 4)
    for (let bx = 0; bx < width; bx += 4, off += 16) {
      const pixels: number[][] = [];
      for (let i = 0; i < 16; i++) {
        const x = Math.min(width - 1, bx + (i % 4)),
          y = Math.min(height - 1, by + (i >> 2)),
          p = (y * width + x) * 4;
        pixels.push([rgba[p], rgba[p + 1], rgba[p + 2], rgba[p + 3]]);
      }
      const visible = pixels.filter((p) => p[3] > 8);
      const sample = visible.length ? visible : pixels;
      const lum = (p: number[]) => p[0] * 0.299 + p[1] * 0.587 + p[2] * 0.114;
      const ordered = [...sample].sort((a, b) => lum(a) - lum(b));
      const lo = ordered[0],
        hi = ordered.at(-1)!;
      const c0 = to565(hi[0], hi[1], hi[2]),
        c1 = to565(lo[0], lo[1], lo[2]);
      const cp = colors(c0, c1),
        a0 = Math.max(...pixels.map((p) => p[3])),
        a1 = Math.min(...pixels.map((p) => p[3]));
      const ap = alphaPalette(a0, a1);
      let cb = 0,
        ab = 0;
      pixels.forEach((p, i) => {
        let ci = 0,
          cd = Infinity,
          ai = 0,
          ad = Infinity;
        cp.forEach((c, j) => {
          const d = c.reduce((s, v, k) => s + (v - p[k]) ** 2, 0);
          if (d < cd) {
            cd = d;
            ci = j;
          }
        });
        ap.forEach((a, j) => {
          const d = Math.abs(a - p[3]);
          if (d < ad) {
            ad = d;
            ai = j;
          }
        });
        cb = (cb | (ci << (2 * i))) >>> 0;
        ab += ai * 2 ** (3 * i);
      });
      out[off] = a0;
      out[off + 1] = a1;
      for (let i = 0; i < 6; i++)
        out[off + 2 + i] = Math.floor(ab / 2 ** (8 * i)) % 256;
      view.setUint16(off + 8, c0, true);
      view.setUint16(off + 10, c1, true);
      view.setUint32(off + 12, cb, true);
    }
  return out;
}

/** Alpha-weighted box filter avoids dark fringes around transparent glyphs. */
export function downsample(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
): Uint8ClampedArray {
  const w = Math.max(1, width >> 1),
    h = Math.max(1, height >> 1),
    out = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let alpha = 0;
      const rgb = [0, 0, 0];
      let n = 0;
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          const sx = x * 2 + dx,
            sy = y * 2 + dy;
          if (sx >= width || sy >= height) continue;
          const p = (sy * width + sx) * 4,
            a = rgba[p + 3];
          alpha += a;
          n++;
          for (let k = 0; k < 3; k++) rgb[k] += rgba[p + k] * a;
        }
      const p = (y * w + x) * 4;
      for (let k = 0; k < 3; k++) out[p + k] = alpha ? rgb[k] / alpha : 0;
      out[p + 3] = alpha / n;
    }
  return out;
}

export function encodeMipChain(
  rgba: Uint8ClampedArray,
  width: number,
  height: number,
  count: number,
): Uint8Array {
  const levels = mipLevels(width, height, count),
    out = new Uint8Array(levels.reduce((s, l) => s + l.size, 0));
  for (const level of levels) {
    out.set(encodeBC3(rgba, level.width, level.height), level.offset);
    rgba = downsample(rgba, level.width, level.height);
  }
  return out;
}
