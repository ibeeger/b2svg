/// <reference lib="webworker" />
// Tracing runs here so a slow trace never freezes the UI. VTracer is pure CPU
// work with no yield points, so on the main thread a large image would block
// paint for seconds.

import wasmUrl from './vendor/vtracer_wasm_bg.wasm?url';
// @ts-expect-error generated at build time by scripts/build-vtracer-web.mjs
import { initVTracer, vectorize_rgba } from './vendor/vtracer_wasm.js';
import type { TraceOptions, TraceResult, WorkerRequest, WorkerResponse } from './lib/types';

const ready = initVTracer(wasmUrl);

function trace(data: Uint8ClampedArray, width: number, height: number, options: TraceOptions): TraceResult {
  const started = performance.now();
  const svg: string = vectorize_rgba(new Uint8Array(data.buffer, data.byteOffset, data.byteLength), width, height, options);
  const durationMs = performance.now() - started;

  return {
    svg,
    durationMs,
    pathCount: svg.match(/<path\b/g)?.length ?? 0,
    bytes: new TextEncoder().encode(svg).byteLength,
    width,
    height,
  };
}

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  const msg = event.data;
  const reply = (res: WorkerResponse) => self.postMessage(res);

  try {
    await ready;

    if (msg.type === 'ping') {
      reply({ id: msg.id, ok: true, ready: true });
      return;
    }

    const { image, options } = msg;
    reply({ id: msg.id, ok: true, result: trace(image.data, image.width, image.height, options) });
  } catch (err) {
    reply({ id: msg.id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
