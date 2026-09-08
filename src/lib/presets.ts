import type { TraceOptions } from './types';

export interface Preset {
  id: string;
  label: string;
  hint: string;
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
    label: 'Logo / 图标',
    hint: '扁平色块、锐利边缘。VTracer 最擅长的场景。',
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
    label: '线稿 / 黑白',
    hint: '二值化后只描一层黑。签名、扫描线稿、二维码。',
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
    label: '色块插画',
    hint: '多色平面插画。限色 + simplify 是压体积最有效的两个旋钮。',
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
    label: '连续调（对照用）',
    hint: '照片类图像会产生上千条路径、体积可能超过原图。放这里是让你看清边界。',
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
    label: '像素图',
    hint: '不做曲线拟合，逐像素边界输出，保持硬边。',
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
