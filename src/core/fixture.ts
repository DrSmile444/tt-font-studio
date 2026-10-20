import { encodeMipChain } from "./bc3";

/** An original diagnostic texture and resource; contains no game assets. */
export function makeFixture({
  width = 256,
  height = 256,
  sentinels = 1,
  colored = false,
}: {
  width?: number;
  height?: number;
  sentinels?: number;
  colored?: boolean;
} = {}) {
  const chars = [
    ...new Set(
      Array.from(
        " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789.,!?-:;()'\"/\\+%=<>_@#&*[]{}АБВГҐДЕЄЖЗИІЇЙКЛМНОПРСТУФХЦЧШЩЬЮЯабвгґдеєжзиіїйклмнопрстуфхцчшщьюя",
      ),
    ),
  ].sort((a, b) => a.codePointAt(0)! - b.codePointAt(0)!);
  const cell = 12,
    glyphHeight = 14,
    cols = Math.floor(width / cell),
    count = chars.length + 1;
  const metricsOffset = 0x60,
    mappingOffset = metricsOffset + count * 12;
  const descriptor =
      Math.ceil((mappingOffset + (chars.length + sentinels) * 4) / 128) * 128,
    dds = descriptor + 128;
  const mipCount = Math.floor(Math.log2(Math.max(width, height))) + 1;
  const rgba = new Uint8ClampedArray(width * height * 4);
  chars.forEach((char, index) => {
    if (char === " ") return;
    const x = (index % cols) * cell,
      y = Math.floor(index / cols) * glyphHeight;
    // Deterministic diagnostic shapes; the browser demo overlays real local-system lettering.
    for (let py = 2; py < glyphHeight - 2; py++)
      for (let px = 2; px < cell - 2; px++) {
        const on =
          px === 2 ||
          py === 2 ||
          ((char.codePointAt(0)! >> ((px + py) % 12)) & 1) === 1;
        if (!on || y + py >= height) continue;
        const p = ((y + py) * width + x + px) * 4;
        rgba[p] = colored ? 246 : 255;
        rgba[p + 1] = colored ? 185 : 255;
        rgba[p + 2] = colored ? 55 : 255;
        rgba[p + 3] = 255;
      }
  });
  const texture = encodeMipChain(rgba, width, height, mipCount),
    footer = dds + 128 + texture.length;
  const relocFields = [0, 4, 8, 0x44, 0x48];
  const out = new Uint8Array(footer + 4 + relocFields.length * 4),
    v = new DataView(out.buffer);
  const u = (p: number, n: number) => v.setUint32(p, n, true);
  u(0, footer);
  u(4, 0x10 - 4);
  u(8, dds - 8);
  u(0x18, mappingOffset + chars.length * 4);
  u(0x1c, count);
  u(0x20, chars.length + sentinels);
  v.setFloat32(0x24, glyphHeight, true);
  v.setFloat32(0x28, 11, true);
  u(0x44, metricsOffset - 0x44);
  u(0x48, mappingOffset - 0x48);
  chars.forEach((char, i) => {
    const p = metricsOffset + i * 12;
    v.setFloat32(p, (i % cols) * cell, true);
    v.setFloat32(p + 4, Math.floor(i / cols) * glyphHeight, true);
    v.setFloat32(p + 8, cell - 1, true);
    v.setUint16(mappingOffset + i * 4, char.codePointAt(0)!, true);
    v.setUint16(mappingOffset + i * 4 + 2, i, true);
  });
  for (let i = 0; i < sentinels; i++)
    u(mappingOffset + chars.length * 4 + i * 4, 0xffffffff);
  u(descriptor, width);
  u(descriptor + 4, height);
  u(descriptor + 64, mipCount);
  u(descriptor + 68, 128 + texture.length);
  out.set([68, 68, 83, 32], dds);
  u(dds + 4, 124);
  u(dds + 8, 0xa1007);
  u(dds + 12, height);
  u(dds + 16, width);
  u(dds + 20, Math.ceil(width / 4) * Math.ceil(height / 4) * 16);
  u(dds + 28, mipCount);
  u(dds + 76, 32);
  u(dds + 80, 4);
  out.set([68, 88, 84, 53], dds + 84);
  u(dds + 108, 0x401008);
  out.set(texture, dds + 128);
  u(footer, relocFields.length);
  relocFields.forEach((field, i) =>
    v.setInt32(footer + 4 + i * 4, field - (footer + 4 + i * 4), true),
  );
  return out;
}
