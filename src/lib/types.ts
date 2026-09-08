/** Subset of VTracer options this UI exposes, plus our own preprocessing knobs. */
export interface TraceOptions {
  preset?: 'bw' | 'poster' | 'photo';
  clustering?: 'color-cluster' | 'bw' | 'watershed';
  hierarchical?: 'stacked' | 'cutout';
  mode?: 'pixel' | 'polygon' | 'spline';
  filterSpeckle?: number;
  colorPrecision?: number;
  layerDifference?: number;
  cornerThreshold?: number;
  lengthThreshold?: number;
  spliceThreshold?: number;
  simplify?: number;
  pathPrecision?: number;
  maxColors?: number;
  optimize?: number;
  binaryThreshold?: number;
  adaptive?: boolean;
  adaptiveT?: number;
  watershedDetail?: number;
}

export interface RgbaImage {
  /** Pinned to ArrayBuffer (not SharedArrayBuffer) so it round-trips through ImageData. */
  data: Uint8ClampedArray<ArrayBuffer>;
  width: number;
  height: number;
}

export interface TraceResult {
  svg: string;
  /** Wall-clock time inside the worker, milliseconds. */
  durationMs: number;
  /** Number of `<path>` elements in the output. */
  pathCount: number;
  /** UTF-8 byte length of the SVG. */
  bytes: number;
  width: number;
  height: number;
}

export type WorkerRequest =
  | { id: number; type: 'trace'; image: RgbaImage; options: TraceOptions }
  | { id: number; type: 'ping' };

export type WorkerResponse =
  | { id: number; ok: true; result: TraceResult }
  | { id: number; ok: true; ready: true }
  | { id: number; ok: false; error: string };
