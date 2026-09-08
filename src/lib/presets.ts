import type { L10n } from './i18n';
import type { TraceOptions } from './types';

export interface Preset {
  id: string;
  label: L10n;
  hint: L10n;
  options: TraceOptions;
}

/**
 * Starting points, not final answers — the parameter panel stays editable after
 * picking one. Values follow VTracer's own presets, with `simplify`/`optimize`
 * turned on because the demo cares about output size as much as fidelity.
 */
export const PRESETS: Preset[] = [
  {
    id: 'logo',
    label: { zh: 'Logo / 图标', en: 'Logo / Icon' },
    hint: {
      zh: '扁平色块、锐利边缘。VTracer 最擅长的场景。',
      en: 'Flat fills and crisp edges — the case VTracer handles best.',
    },
    options: {
      clustering: 'color-cluster',
      hierarchical: 'stacked',
      mode: 'spline',
      filterSpeckle: 4,
      colorPrecision: 8,
      layerDifference: 16,
      cornerThreshold: 60,
      lengthThreshold: 4,
      spliceThreshold: 45,
      simplify: 1,
      pathPrecision: 2,
      optimize: 2,
    },
  },
  {
    id: 'lineart',
    label: { zh: '线稿 / 黑白', en: 'Line art / B&W' },
    hint: {
      zh: '二值化后只描一层黑。签名、扫描线稿、二维码。',
      en: 'Thresholds to binary and traces a single black layer. Signatures, scans, QR codes.',
    },
    options: {
      clustering: 'bw',
      mode: 'spline',
      filterSpeckle: 4,
      binaryThreshold: 128,
      adaptive: false,
      adaptiveT: 15,
      cornerThreshold: 60,
      lengthThreshold: 4,
      spliceThreshold: 45,
      simplify: 1,
      pathPrecision: 2,
      optimize: 2,
    },
  },
  {
    id: 'poster',
    label: { zh: '色块插画', en: 'Poster art' },
    hint: {
      zh: '多色平面插画。限色 + simplify 是压体积最有效的两个旋钮。',
      en: 'Multi-colour flat illustration. Colour capping + simplify are the two best size levers.',
    },
    options: {
      clustering: 'color-cluster',
      hierarchical: 'stacked',
      mode: 'spline',
      filterSpeckle: 8,
      colorPrecision: 6,
      layerDifference: 16,
      cornerThreshold: 60,
      lengthThreshold: 4,
      spliceThreshold: 45,
      maxColors: 24,
      simplify: 1.5,
      pathPrecision: 2,
      optimize: 1,
    },
  },
  {
    id: 'photo',
    label: { zh: '连续调（对照用）', en: 'Continuous tone (reference)' },
    hint: {
      zh: '照片类图像会产生上千条路径、体积可能超过原图。放这里是让你看清边界。',
      en: 'Photo-like images yield thousands of paths and can exceed the original in size. Included to show the limits.',
    },
    options: {
      clustering: 'color-cluster',
      hierarchical: 'stacked',
      mode: 'spline',
      filterSpeckle: 24,
      colorPrecision: 6,
      layerDifference: 16,
      cornerThreshold: 60,
      lengthThreshold: 4,
      spliceThreshold: 45,
      maxColors: 16,
      simplify: 2.5,
      pathPrecision: 1,
      optimize: 1,
    },
  },
  {
    id: 'pixel',
    label: { zh: '像素图', en: 'Pixel art' },
    hint: {
      zh: '不做曲线拟合，逐像素边界输出，保持硬边。',
      en: 'No curve fitting — pixel-exact boundaries, hard edges preserved.',
    },
    options: {
      clustering: 'color-cluster',
      hierarchical: 'stacked',
      mode: 'pixel',
      filterSpeckle: 0,
      colorPrecision: 8,
      layerDifference: 0,
      pathPrecision: 1,
      optimize: 1,
    },
  },
];

export function presetById(id: string): Preset {
  const found = PRESETS.find((p) => p.id === id);
  if (!found) throw new Error(`unknown preset: ${id}`);
  return found;
}
