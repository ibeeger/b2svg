import './style.css';
import { decodeToRgba, formatBytes } from './lib/image';
import { activeControls, type Control } from './lib/controls';
import { PRESETS, presetById } from './lib/presets';
import { SAMPLES, sampleToBlob, type Sample } from './lib/samples';
import { TraceAbortedError, TracerClient } from './lib/tracer-client';
import type { RgbaImage, TraceOptions, TraceResult } from './lib/types';

const $ = <T extends HTMLElement>(id: string): T => {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing element #${id}`);
  return el as T;
};

const els = {
  dropzone: $<HTMLDivElement>('dropzone'),
  file: $<HTMLInputElement>('file'),
  samples: $<HTMLDivElement>('samples'),
  maxEdge: $<HTMLInputElement>('maxEdge'),
  maxEdgeValue: $<HTMLElement>('maxEdgeValue'),
  flattenAlpha: $<HTMLInputElement>('flattenAlpha'),
  presets: $<HTMLDivElement>('presets'),
  presetHint: $<HTMLParagraphElement>('presetHint'),
  controls: $<HTMLDivElement>('controls'),
  viewTabs: $<HTMLDivElement>('viewTabs'),
  showOutlines: $<HTMLInputElement>('showOutlines'),
  download: $<HTMLButtonElement>('download'),
  viewer: $<HTMLDivElement>('viewer'),
  sourceCanvas: $<HTMLCanvasElement>('sourceCanvas'),
  svgHost: $<HTMLDivElement>('svgHost'),
  svgCode: $<HTMLElement>('svgCode'),
  stats: $<HTMLDivElement>('stats'),
};

interface State {
  sourceBlob: Blob | null;
  /** Set when the source is a built-in sample, so it can re-rasterize on size changes. */
  sourceSample: Sample | null;
  sourceName: string;
  image: RgbaImage | null;
  /** Bytes of the decoded-and-downscaled source, for a fair size comparison. */
  sourcePngBytes: number;
  presetId: string;
  options: TraceOptions;
  result: TraceResult | null;
  busy: boolean;
}

const state: State = {
  sourceBlob: null,
  sourceSample: null,
  sourceName: 'image',
  image: null,
  sourcePngBytes: 0,
  presetId: PRESETS[0].id,
  options: { ...PRESETS[0].options },
  result: null,
  busy: false,
};

const tracer = new TracerClient();

// ---------------------------------------------------------------- rendering

function renderPresets() {
  els.presets.replaceChildren(
    ...PRESETS.map((preset) => {
      const button = document.createElement('button');
      button.textContent = preset.label;
      button.className = preset.id === state.presetId ? 'chip active' : 'chip';
      button.onclick = () => {
        state.presetId = preset.id;
        state.options = { ...preset.options };
        renderPresets();
        renderControls();
        void retrace();
      };
      return button;
    }),
  );
  els.presetHint.textContent = presetById(state.presetId).hint;
}

function renderSamples() {
  els.samples.replaceChildren(
    ...SAMPLES.map((sample) => {
      const button = document.createElement('button');
      button.className = 'chip ghost';
      button.textContent = sample.label;
      button.title = sample.note;
      button.onclick = () => {
        state.presetId = sample.preset;
        state.options = { ...presetById(sample.preset).options };
        renderPresets();
        renderControls();
        state.sourceSample = sample;
        void loadSource(null, `sample-${sample.id}`, sample.note);
      };
      return button;
    }),
  );
}

function controlRow(control: Control): HTMLElement {
  const row = document.createElement('label');
  row.className = 'field';

  const head = document.createElement('span');
  head.textContent = control.label;
  row.append(head);

  if (control.kind === 'range') {
    const value = (state.options[control.key] as number | undefined) ?? control.min;
    const readout = document.createElement('b');
    readout.textContent = String(value);
    head.append(' ', readout);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(control.min);
    input.max = String(control.max);
    input.step = String(control.step);
    input.value = String(value);
    input.oninput = () => {
      const parsed = Number(input.value);
      readout.textContent = String(parsed);
      (state.options[control.key] as number) = parsed;
      void retrace();
    };
    row.append(input);
  } else if (control.kind === 'select') {
    const select = document.createElement('select');
    select.replaceChildren(
      ...control.choices.map((choice) => {
        const option = document.createElement('option');
        option.value = choice.value;
        option.textContent = choice.label;
        return option;
      }),
    );
    select.value = String(state.options[control.key] ?? control.choices[0].value);
    select.onchange = () => {
      (state.options[control.key] as string) = select.value;
      // Switching clustering or mode changes which controls apply.
      renderControls();
      void retrace();
    };
    row.append(select);
  } else {
    row.classList.replace('field', 'check');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = Boolean(state.options[control.key]);
    input.onchange = () => {
      (state.options[control.key] as boolean) = input.checked;
      renderControls();
      void retrace();
    };
    row.prepend(input);
  }

  if (control.hint) {
    const hint = document.createElement('em');
    hint.textContent = control.hint;
    row.append(hint);
  }
  return row;
}

function renderControls() {
  els.controls.replaceChildren(...activeControls(state.options).map(controlRow));
}

function renderStats(note?: string) {
  const { image, result, sourcePngBytes } = state;
  if (!image) {
    els.stats.replaceChildren(Object.assign(document.createElement('span'), {
      className: 'placeholder',
      textContent: '选择一张图片开始。',
    }));
    return;
  }

  const items: [string, string][] = [['尺寸', `${image.width} × ${image.height}`]];

  if (result) {
    items.push(
      ['耗时', `${result.durationMs.toFixed(0)} ms`],
      ['路径数', String(result.pathCount)],
      ['SVG 体积', formatBytes(result.bytes)],
    );
    if (sourcePngBytes > 0) {
      const ratio = result.bytes / sourcePngBytes;
      items.push(['对比 PNG', `${ratio < 1 ? '小' : '大'} ${ratio < 1 ? (1 / ratio).toFixed(1) : ratio.toFixed(1)}×`]);
    }
  }

  const nodes: HTMLElement[] = items.map(([label, value]) => {
    const item = document.createElement('span');
    item.className = 'stat';
    item.innerHTML = `<i>${label}</i><b></b>`;
    item.querySelector('b')!.textContent = value;
    return item;
  });

  // Past a few thousand paths the SVG stops being editable in any real tool.
  if (result && result.pathCount > 2000) {
    const warn = document.createElement('span');
    warn.className = 'stat warn';
    warn.textContent = '路径数过多，这类图更适合保留位图';
    nodes.push(warn);
  }

  if (note) {
    const hint = document.createElement('span');
    hint.className = 'stat note';
    hint.textContent = note;
    nodes.push(hint);
  }
  els.stats.replaceChildren(...nodes);
}

function paintSource(image: RgbaImage) {
  const canvas = els.sourceCanvas;
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.putImageData(new ImageData(image.data, image.width, image.height), 0, 0);
}

function paintResult(result: TraceResult) {
  els.svgHost.innerHTML = result.svg;
  const svg = els.svgHost.querySelector('svg');
  if (svg) {
    svg.removeAttribute('width');
    svg.removeAttribute('height');
    svg.setAttribute('viewBox', `0 0 ${result.width} ${result.height}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  }
  els.svgCode.textContent = result.svg;
}

// ------------------------------------------------------------------- actions

/** `blob === null` means the source is the built-in sample in `state.sourceSample`. */
async function loadSource(blob: Blob | null, name: string, note?: string) {
  state.sourceBlob = blob;
  if (blob) state.sourceSample = null;
  state.sourceName = name.replace(/\.[^.]+$/, '') || 'image';
  els.dropzone.classList.add('loaded');
  await redecode(note);
}

/** Re-decode from the original source — needed whenever maxEdge or matting changes. */
async function redecode(note?: string) {
  const maxEdge = Number(els.maxEdge.value);

  // Samples are vector sources, so re-rasterize them at the target size instead
  // of upscaling a stale bitmap.
  const source = state.sourceSample ? sampleToBlob(state.sourceSample, maxEdge) : state.sourceBlob;
  if (!source) return;

  try {
    state.image = await decodeToRgba(source, {
      maxEdge,
      flattenAlpha: els.flattenAlpha.checked,
    });
  } catch (err) {
    showError(err);
    return;
  }

  paintSource(state.image);
  state.sourcePngBytes = await measurePngBytes(els.sourceCanvas);
  renderStats(note);
  await retrace(note);
}

/** Size of the downscaled source re-encoded as PNG, so the size stat compares like with like. */
function measurePngBytes(canvas: HTMLCanvasElement): Promise<number> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob?.size ?? 0), 'image/png');
  });
}

let retraceTimer: number | undefined;

function retrace(note?: string): Promise<void> {
  // Slider drags fire per pixel; coalesce them into one trace.
  window.clearTimeout(retraceTimer);
  return new Promise((resolve) => {
    retraceTimer = window.setTimeout(() => void runTrace(note).then(resolve), 120);
  });
}

async function runTrace(note?: string) {
  if (!state.image) return;

  state.busy = true;
  document.body.classList.add('busy');

  try {
    const result = await tracer.trace(state.image, normalize(state.options));
    state.result = result;
    paintResult(result);
    els.download.disabled = false;
    renderStats(note);
  } catch (err) {
    if (err instanceof TraceAbortedError) return; // a newer trace is already running
    showError(err);
  } finally {
    state.busy = false;
    document.body.classList.remove('busy');
  }
}

/** Drop values VTracer treats as "unset" rather than "zero". */
function normalize(options: TraceOptions): TraceOptions {
  const out: TraceOptions = { ...options };
  if (!out.maxColors) delete out.maxColors;
  if (!out.simplify) delete out.simplify;
  return out;
}

function showError(err: unknown) {
  const message = err instanceof Error ? err.message : String(err);
  const box = document.createElement('span');
  box.className = 'stat error';
  box.textContent = `出错：${message}`;
  els.stats.replaceChildren(box);
}

function download() {
  if (!state.result) return;
  const blob = new Blob([state.result.svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${state.sourceName}.svg`;
  link.click();
  // Revoke on the next tick so the click has already started the download.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

// ------------------------------------------------------------------- wiring

els.dropzone.onclick = () => els.file.click();
els.dropzone.onkeydown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    els.file.click();
  }
};

els.file.onchange = () => {
  const file = els.file.files?.[0];
  if (file) void loadSource(file, file.name);
};

for (const type of ['dragenter', 'dragover'] as const) {
  els.dropzone.addEventListener(type, (event) => {
    event.preventDefault();
    els.dropzone.classList.add('hover');
  });
}
for (const type of ['dragleave', 'drop'] as const) {
  els.dropzone.addEventListener(type, () => els.dropzone.classList.remove('hover'));
}
els.dropzone.addEventListener('drop', (event) => {
  event.preventDefault();
  const file = event.dataTransfer?.files?.[0];
  if (file) void loadSource(file, file.name);
});

els.maxEdge.oninput = () => {
  els.maxEdgeValue.textContent = els.maxEdge.value;
};
els.maxEdge.onchange = () => void redecode();
els.flattenAlpha.onchange = () => void redecode();

els.showOutlines.onchange = () => {
  els.viewer.classList.toggle('outlines', els.showOutlines.checked);
};

els.viewTabs.onclick = (event) => {
  const button = (event.target as HTMLElement).closest('button');
  if (!button) return;
  for (const tab of els.viewTabs.querySelectorAll('button')) tab.classList.remove('active');
  button.classList.add('active');
  els.viewer.dataset.view = button.dataset.view ?? 'split';
};

els.download.onclick = download;

renderPresets();
renderSamples();
renderControls();
els.viewer.dataset.view = 'split';

// Warm the wasm module so the first real trace isn't paying instantiation cost.
void tracer.ready().catch(showError);
