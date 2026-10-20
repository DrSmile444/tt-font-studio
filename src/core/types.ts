export type Metric = { x: number; y: number; width: number };
export type Mapping = { codepoint: number; glyphIndex: number };
export type FontResource = {
  name: string;
  original: Uint8Array;
  metrics: Metric[];
  mapping: Mapping[];
  height: number;
  baseline: number;
  atlasWidth: number;
  atlasHeight: number;
  metricsOffset: number;
  mappingOffset: number;
  ddsOffset: number;
  footerOffset: number;
  mipCount: number;
  warnings: string[];
};

export class FontError extends Error {
  constructor(
    public code: string,
    public detail = "",
  ) {
    super(code);
  }
}

export const MAX_FILE_BYTES = 32 * 1024 * 1024;
export const MAX_PIXELS = 4096 * 4096;
