// Verifies the generated browser glue is free of node built-ins and actually
// instantiates + traces. Runs the same code path the browser uses, feeding the
// wasm in as bytes instead of a fetch.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const vendor = join(root, 'src', 'vendor');

const { initVTracer, vectorize_rgba } = await import(join(vendor, 'vtracer_wasm.js'));

test('generated glue contains no node built-ins', async () => {
  const src = await readFile(join(vendor, 'vtracer_wasm.js'), 'utf8');
  assert.doesNotMatch(src, /\brequire\s*\(/);
  assert.doesNotMatch(src, /__dirname/);
  assert.doesNotMatch(src, /^exports\./m);
});

test('traces a solid red square into an SVG path', async () => {
  const wasmBytes = await readFile(join(vendor, 'vtracer_wasm_bg.wasm'));
  await initVTracer(wasmBytes.buffer.slice(wasmBytes.byteOffset, wasmBytes.byteOffset + wasmBytes.byteLength));

  const width = 32;
  const height = 32;
  const rgba = new Uint8Array(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const inSquare = x >= 8 && x < 24 && y >= 8 && y < 24;
      rgba[i] = inSquare ? 255 : 255;
      rgba[i + 1] = inSquare ? 0 : 255;
      rgba[i + 2] = inSquare ? 0 : 255;
      rgba[i + 3] = 255;
    }
  }

  const svg = vectorize_rgba(rgba, width, height, { mode: 'polygon', filterSpeckle: 0 });

  assert.match(svg, /<svg[^>]*width="32"[^>]*height="32"/);
  // Stacked output: a full-canvas background path plus the square on top.
  assert.equal(svg.match(/<path/g)?.length, 2);
  assert.match(svg, /fill="#FF0000"/);
});

test('initVTracer is idempotent', async () => {
  const wasmBytes = await readFile(join(vendor, 'vtracer_wasm_bg.wasm'));
  await initVTracer(wasmBytes.buffer.slice(wasmBytes.byteOffset, wasmBytes.byteOffset + wasmBytes.byteLength));
  const svg = vectorize_rgba(new Uint8Array(4 * 4 * 4).fill(255), 4, 4, {});
  assert.match(svg, /<svg/);
});
