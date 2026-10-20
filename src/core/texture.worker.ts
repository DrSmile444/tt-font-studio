import { encodeMipChain } from "./bc3";
self.onmessage = (
  event: MessageEvent<{
    pixels: Uint8ClampedArray;
    width: number;
    height: number;
    mipCount: number;
  }>,
) => {
  try {
    const { pixels, width, height, mipCount } = event.data;
    const texture = encodeMipChain(pixels, width, height, mipCount);
    self.postMessage({ texture }, { transfer: [texture.buffer] });
  } catch {
    self.postMessage({ error: "textureEncoding" });
  }
};
