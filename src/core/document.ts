import { decodeBC3 } from "./bc3";
import { exportFnt, validateMetric } from "./fnt";
import { FontError, type FontResource, type Metric } from "./types";

export type Snapshot = {
  metrics: Metric[];
  height: number;
  baseline: number;
  pixels: Uint8ClampedArray | null;
};
const copyMetrics = (metrics: Metric[]) => metrics.map((m) => ({ ...m }));
export class FontDocument {
  readonly id = crypto.randomUUID();
  readonly originalPixels: Uint8ClampedArray;
  metrics: Metric[];
  height: number;
  baseline: number;
  pixels: Uint8ClampedArray | null = null;
  selected = 0;
  private past: Snapshot[] = [];
  private future: Snapshot[] = [];
  private exported: Snapshot;
  constructor(readonly resource: FontResource) {
    this.metrics = copyMetrics(resource.metrics);
    this.height = resource.height;
    this.baseline = resource.baseline;
    this.originalPixels = decodeBC3(
      resource.original.subarray(
        resource.ddsOffset + 128,
        resource.footerOffset,
      ),
      resource.atlasWidth,
      resource.atlasHeight,
    );
    this.selected = Math.max(
      0,
      resource.mapping.findIndex((m) => m.codepoint === 65),
    );
    this.exported = this.snapshot();
  }
  get rgba() {
    return this.pixels ?? this.originalPixels;
  }
  get canUndo() {
    return this.past.length > 0;
  }
  get canRedo() {
    return this.future.length > 0;
  }
  get changedGlyphs() {
    return this.metrics.reduce((n, m, i) => n + (this.isChanged(i) ? 1 : 0), 0);
  }
  isChanged(i: number) {
    return (["x", "y", "width"] as const).some(
      (k) => this.metrics[i][k] !== this.resource.metrics[i][k],
    );
  }
  get dirty() {
    return (
      this.height !== this.exported.height ||
      this.baseline !== this.exported.baseline ||
      this.pixels !== this.exported.pixels ||
      this.metrics.some((m, i) =>
        (["x", "y", "width"] as const).some(
          (k) => m[k] !== this.exported.metrics[i][k],
        ),
      )
    );
  }
  snapshot(): Snapshot {
    return {
      metrics: copyMetrics(this.metrics),
      height: this.height,
      baseline: this.baseline,
      pixels: this.pixels,
    };
  }
  private restore(s: Snapshot) {
    this.metrics = copyMetrics(s.metrics);
    this.height = s.height;
    this.baseline = s.baseline;
    this.pixels = s.pixels;
  }
  private commit() {
    this.past.push(this.snapshot());
    if (this.past.length > 40) this.past.shift();
    this.future = [];
  }
  setMetric(index: number, metric: Metric) {
    if (!this.metrics[index]) throw new FontError("invalidMetrics");
    const m = {
      x: Math.fround(metric.x),
      y: Math.fround(metric.y),
      width: Math.fround(metric.width),
    };
    validateMetric(m, { ...this.resource, height: this.height });
    if (
      Object.keys(m).every(
        (k) => m[k as keyof Metric] === this.metrics[index][k as keyof Metric],
      )
    )
      return;
    this.commit();
    this.metrics[index] = m;
  }
  setGlobal(height: number, baseline: number) {
    height = Math.fround(height);
    baseline = Math.fround(baseline);
    if (
      !Number.isFinite(height) ||
      !Number.isFinite(baseline) ||
      height <= 0 ||
      height > this.resource.atlasHeight ||
      baseline < 0 ||
      baseline > height
    )
      throw new FontError("invalidMetrics");
    if (height !== this.height)
      for (const { glyphIndex } of this.resource.mapping) {
        const m = this.metrics[glyphIndex];
        if (
          m.y + height > this.resource.atlasHeight &&
          m.y + this.height <= this.resource.atlasHeight
        )
          throw new FontError("metricBounds");
      }
    if (height === this.height && baseline === this.baseline) return;
    this.commit();
    this.height = height;
    this.baseline = baseline;
  }
  resetMetric(index: number) {
    if (this.isChanged(index)) {
      this.commit();
      this.metrics[index] = { ...this.resource.metrics[index] };
    }
  }
  roundMetrics() {
    const next = this.metrics.map((m) => ({
      x: Math.round(m.x),
      y: Math.round(m.y),
      width: Math.round(m.width),
    }));
    for (let i = 0; i < next.length; i++) {
      if (
        next[i].x !== this.metrics[i].x ||
        next[i].y !== this.metrics[i].y ||
        next[i].width !== this.metrics[i].width
      )
        validateMetric(next[i], { ...this.resource, height: this.height });
    }
    if (
      next.every(
        (m, i) =>
          m.x === this.metrics[i].x &&
          m.y === this.metrics[i].y &&
          m.width === this.metrics[i].width,
      )
    )
      return false;
    this.commit();
    this.metrics = next;
    return true;
  }
  replacePixels(rgba: Uint8ClampedArray) {
    if (rgba.length !== this.originalPixels.length)
      throw new FontError("atlasSize");
    const same = (a: Uint8ClampedArray, b: Uint8ClampedArray) =>
      a.every((v, i) => v === b[i]);
    if (same(rgba, this.rgba)) return;
    this.commit();
    this.pixels = same(rgba, this.originalPixels) ? null : rgba.slice();
  }
  undo() {
    const prev = this.past.pop();
    if (prev) {
      this.future.push(this.snapshot());
      this.restore(prev);
    }
  }
  redo() {
    const next = this.future.pop();
    if (next) {
      this.past.push(this.snapshot());
      this.restore(next);
    }
  }
  markExported(snapshot: Snapshot) {
    this.exported = snapshot;
  }
  export(texture?: Uint8Array, snapshot = this.snapshot()) {
    return exportFnt(
      this.resource,
      snapshot.metrics,
      snapshot.height,
      snapshot.baseline,
      texture,
    );
  }
  metadata() {
    return {
      format: "tt-classic-pc-fnt",
      source: this.resource.name,
      atlasWidth: this.resource.atlasWidth,
      atlasHeight: this.resource.atlasHeight,
      height: this.height,
      baseline: this.baseline,
      metrics: this.metrics,
      mapping: this.resource.mapping,
      schemaVersion: 1,
    };
  }
}
