import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so a build can be served from any sub-path (or file://-like
  // static hosting) without rewriting asset URLs.
  base: './',
  worker: {
    format: 'es',
  },
  build: {
    target: 'es2022',
    // The vtracer wasm is ~650 KB; keep it as a real asset rather than letting
    // Vite inline it as base64, which would bloat the JS bundle by ~4/3.
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
  },
});
