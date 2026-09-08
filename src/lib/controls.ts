import type { L10n } from './i18n';
import type { TraceOptions } from './types';

type Key = keyof TraceOptions;

interface BaseControl {
  key: Key;
  label: L10n;
  hint?: L10n;
  /** Only render when the current options satisfy this. */
  when?: (o: TraceOptions) => boolean;
}

export interface RangeControl extends BaseControl {
  kind: 'range';
  min: number;
  max: number;
  step: number;
}

export interface SelectControl extends BaseControl {
  kind: 'select';
  choices: { value: string; label: L10n }[];
}

export interface ToggleControl extends BaseControl {
  kind: 'toggle';
}

export type Control = RangeControl | SelectControl | ToggleControl;

const isColor = (o: TraceOptions) => (o.clustering ?? 'color-cluster') === 'color-cluster';
const isBinary = (o: TraceOptions) => o.clustering === 'bw';
const isWatershed = (o: TraceOptions) => o.clustering === 'watershed';
const isCurved = (o: TraceOptions) => (o.mode ?? 'spline') === 'spline';

export const CONTROLS: Control[] = [
  {
    kind: 'select',
    key: 'clustering',
    label: { zh: '分区方式', en: 'Clustering' },
    hint: {
      zh: '彩色聚类 / 二值阈值 / 分水岭',
      en: 'Colour clustering / binary threshold / watershed',
    },
    choices: [
      { value: 'color-cluster', label: { zh: '彩色聚类', en: 'Colour cluster' } },
      { value: 'bw', label: { zh: '二值（黑白）', en: 'Binary (B&W)' } },
      { value: 'watershed', label: { zh: '分水岭', en: 'Watershed' } },
    ],
  },
  {
    kind: 'select',
    key: 'mode',
    label: { zh: '路径拟合', en: 'Path fitting' },
    hint: {
      zh: 'spline 平滑曲线 / polygon 折线 / pixel 逐像素硬边',
      en: 'spline smooth curves / polygon straight lines / pixel exact edges',
    },
    choices: [
      { value: 'spline', label: { zh: '曲线 spline', en: 'Spline' } },
      { value: 'polygon', label: { zh: '折线 polygon', en: 'Polygon' } },
      { value: 'pixel', label: { zh: '像素 pixel', en: 'Pixel' } },
    ],
  },
  {
    kind: 'select',
    key: 'hierarchical',
    label: { zh: '层叠方式', en: 'Layering' },
    hint: {
      zh: 'stacked 色块互相遮挡；cutout 上层在下层挖洞（更好编辑）',
      en: 'stacked: shapes overlap; cutout: upper shapes punch holes (easier to edit)',
    },
    when: isColor,
    choices: [
      { value: 'stacked', label: { zh: '堆叠 stacked', en: 'Stacked' } },
      { value: 'cutout', label: { zh: '挖空 cutout', en: 'Cutout' } },
    ],
  },
  {
    kind: 'range',
    key: 'filterSpeckle',
    label: { zh: '斑点过滤', en: 'Speckle filter' },
    hint: {
      zh: '丢弃小于该像素数的碎块。影响最大的单个参数：连续调图像上 0 与 16 可能相差十倍路径数。',
      en: 'Drops fragments below this pixel count. The most impactful knob: on continuous tone, 0 vs 16 can be a 10× path-count difference.',
    },
    min: 0,
    max: 64,
    step: 1,
  },
  {
    kind: 'range',
    key: 'colorPrecision',
    label: { zh: '颜色精度（bit）', en: 'Colour precision (bits)' },
    hint: {
      zh: '每通道保留位数，越低颜色越少、路径越少。',
      en: 'Bits kept per channel — lower means fewer colours and fewer paths.',
    },
    when: isColor,
    min: 1,
    max: 8,
    step: 1,
  },
  {
    kind: 'range',
    key: 'layerDifference',
    label: { zh: '分层色差', en: 'Layer difference' },
    hint: {
      zh: '相邻颜色差异小于此值就并作一层。实测 32 以下几乎无感，64 以上会急剧塌缩。',
      en: 'Merges adjacent colours closer than this into one layer. Measured: barely visible below 32, collapses sharply above 64.',
    },
    when: isColor,
    min: 0,
    max: 128,
    step: 1,
  },
  {
    kind: 'range',
    key: 'maxColors',
    label: { zh: '最大颜色数', en: 'Max colours' },
    hint: {
      zh: '0 表示不限制。限色是压体积最有效的手段。',
      en: '0 = unlimited. Capping colours is the most effective size lever.',
    },
    when: isColor,
    min: 0,
    max: 64,
    step: 1,
  },
  {
    kind: 'range',
    key: 'binaryThreshold',
    label: { zh: '二值阈值', en: 'Binary threshold' },
    hint: {
      zh: '亮度低于该值算前景。',
      en: 'Pixels darker than this count as foreground.',
    },
    when: (o) => isBinary(o) && !o.adaptive,
    min: 0,
    max: 255,
    step: 1,
  },
  {
    kind: 'toggle',
    key: 'adaptive',
    label: { zh: '自适应阈值', en: 'Adaptive threshold' },
    hint: {
      zh: 'Bradley–Roth，适合光照不均的扫描件。',
      en: 'Bradley–Roth — good for unevenly lit scans.',
    },
    when: isBinary,
  },
  {
    kind: 'range',
    key: 'adaptiveT',
    label: { zh: '自适应灵敏度', en: 'Adaptive sensitivity' },
    hint: {
      zh: '低于局部均值的百分比。',
      en: 'Percent below the local mean.',
    },
    when: (o) => isBinary(o) && !!o.adaptive,
    min: 1,
    max: 50,
    step: 1,
  },
  {
    kind: 'range',
    key: 'watershedDetail',
    label: { zh: '分水岭细节', en: 'Watershed detail' },
    hint: {
      zh: '越高分出的区域越多。',
      en: 'Higher yields more regions.',
    },
    when: isWatershed,
    min: 8,
    max: 512,
    step: 8,
  },
  {
    kind: 'range',
    key: 'cornerThreshold',
    label: { zh: '角点阈值（度）', en: 'Corner threshold (deg)' },
    hint: {
      zh: '夹角小于此值判定为尖角，不做平滑。',
      en: 'Angles sharper than this stay as corners instead of being smoothed.',
    },
    when: isCurved,
    min: 0,
    max: 180,
    step: 1,
  },
  {
    kind: 'range',
    key: 'lengthThreshold',
    label: { zh: '最短线段', en: 'Min segment length' },
    when: isCurved,
    min: 3.5,
    max: 10,
    step: 0.5,
  },
  {
    kind: 'range',
    key: 'spliceThreshold',
    label: { zh: '拼接阈值（度）', en: 'Splice threshold (deg)' },
    when: isCurved,
    min: 0,
    max: 180,
    step: 1,
  },
  {
    kind: 'range',
    key: 'simplify',
    label: { zh: '曲线简化容差(px)', en: 'Simplify tolerance (px)' },
    hint: {
      zh: '0 关闭。1–2.5 通常能砍掉大量节点而肉眼无差。',
      en: '0 = off. 1–2.5 usually removes many nodes with no visible change.',
    },
    min: 0,
    max: 5,
    step: 0.1,
  },
  {
    kind: 'range',
    key: 'pathPrecision',
    label: { zh: '坐标小数位', en: 'Coordinate decimals' },
    hint: {
      zh: '直接影响文件体积。',
      en: 'Directly affects file size.',
    },
    min: 0,
    max: 8,
    step: 1,
  },
  {
    kind: 'range',
    key: 'optimize',
    label: { zh: 'SVG 优化等级', en: 'SVG optimize level' },
    hint: {
      zh: '0 关闭 · 1 量化+简化 · 2 再加缩写与分组',
      en: '0 off · 1 quantize + simplify · 2 adds shorthands and grouping',
    },
    min: 0,
    max: 2,
    step: 1,
  },
];

/** Strip options the current clustering/mode combination ignores. */
export function activeControls(options: TraceOptions): Control[] {
  return CONTROLS.filter((c) => !c.when || c.when(options));
}
