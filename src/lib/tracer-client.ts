import type { RgbaImage, TraceOptions, TraceResult, WorkerRequest, WorkerResponse } from './types';

/**
 * Promise-based wrapper around the tracing worker.
 *
 * Requests are matched by id, and a newer request supersedes older ones: while
 * dragging a slider the UI fires constantly, and only the latest result is
 * worth rendering. Superseded promises reject with `TraceAbortedError` so the
 * caller can ignore them without treating it as a failure.
 */
export class TraceAbortedError extends Error {
  constructor() {
    super('superseded by a newer trace request');
    this.name = 'TraceAbortedError';
  }
}

type Pending = {
  resolve: (result: TraceResult) => void;
  reject: (error: Error) => void;
};

export class TracerClient {
  #worker: Worker;
  #pending = new Map<number, Pending>();
  #nextId = 1;
  #latestId = 0;

  constructor() {
    this.#worker = new Worker(new URL('../tracer.worker.ts', import.meta.url), { type: 'module' });
    this.#worker.onmessage = (event: MessageEvent<WorkerResponse>) => this.#handle(event.data);
    this.#worker.onerror = (event) => {
      const error = new Error(event.message || 'tracing worker crashed');
      for (const pending of this.#pending.values()) pending.reject(error);
      this.#pending.clear();
    };
  }

  #handle(msg: WorkerResponse) {
    const pending = this.#pending.get(msg.id);
    if (!pending) return;
    this.#pending.delete(msg.id);

    if (!msg.ok) {
      pending.reject(new Error(msg.error));
    } else if ('result' in msg) {
      pending.resolve(msg.result);
    }
  }

  /** Resolves once the wasm module has instantiated inside the worker. */
  async ready(): Promise<void> {
    const id = this.#nextId++;
    await new Promise<void>((resolve, reject) => {
      this.#pending.set(id, { resolve: () => resolve(), reject });
      this.#worker.postMessage({ id, type: 'ping' } satisfies WorkerRequest);
    });
  }

  trace(image: RgbaImage, options: TraceOptions): Promise<TraceResult> {
    const id = this.#nextId++;
    this.#latestId = id;

    // Drop everything still in flight — their results are already stale.
    for (const [pendingId, pending] of this.#pending) {
      if (pendingId === id) continue;
      this.#pending.delete(pendingId);
      pending.reject(new TraceAbortedError());
    }

    return new Promise<TraceResult>((resolve, reject) => {
      this.#pending.set(id, {
        resolve: (result) => {
          if (id === this.#latestId) resolve(result);
          else reject(new TraceAbortedError());
        },
        reject,
      });

      // The pixel buffer is copied, not transferred: the caller keeps the
      // decoded image so re-tracing with new options needs no re-decode.
      this.#worker.postMessage({ id, type: 'trace', image, options } satisfies WorkerRequest);
    });
  }
}
