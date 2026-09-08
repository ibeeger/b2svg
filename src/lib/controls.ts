import type { TraceOptions } from './types';

type Key = keyof TraceOptions;

interface BaseControl {
  key: Key;
  label: string;
  hint?: string;
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
  choices: { value: string; label: string }[];
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
    label: '分区方式',
    hint: '彩色聚类 / 二值阈值 / 分水岭',
    choices: [
      { value: 'color-cluster', label: '彩色聚类' },
      { value: 'bw', label: '二值（黑白）' },
      { value: 'watershed', label: '分水岭' },
    ],
  },
  {
    kind: 'select',
    key: 'mode',
    label: '路径拟合',
    hint: 'spline 平滑曲线 / polygon 折线 / pixel 逐像素硬边',
    choices: [
      { value: 'spline', label: '曲线 spline' },
      { value: 'polygon', label: '折线 polygon' },
      { value: 'pixel', label: '像素 pixel' },
    ],
  },
  {
    kind: 'select',
    key: 'hierarchical',
    label: '层叠方式',
    hint: 'stacked 色块互相遮挡；cutout 上层在下层挖洞（更好编辑）',
    when: isColor,
    choices: [
      { value: 'stacked', label: '堆叠 stacked' },
      { value: 'cutout', label: '挖空 cutout' },
    ],
  },
  {
    kind: 'range',
    key: 'filterSpeckle',
    label: '斑点过滤',
    hint: '丢弃小于该像素数的碎块。影响最大的单个参数：连续调图像上 0 与 16 可能相差十倍路径数。',
    min: 0,
    max: 64,
    step: 1,
  },
  {
    kind: 'range',
    key: 'colorPrecision',
    label: '颜色精度（bit）',
    hint: '每通道保留位数，越低颜色越少、路径越少。',
    when: isColor,
    min: 1,
    max: 8,
    step: 1,
  },
  {
    kind: 'range',
    key: 'layerDifference',
    label: '分层色差',
    hint: '相邻颜色差异小于此值就并作一层。实测 32 以下几乎无感，64 以上会急剧塌缩。',
    when: isColor,
    min: 0,
    max: 128,
    step: 1,
  },
  {
    kind: 'range',
    key: 'maxColors',
    label: '最大颜色数',
    hint: '0 表示不限制。限色是压体积最有效的手段。',
    when: isColor,
    min: 0,
    max: 64,
    step: 1,
  },
  {
    kind: 'range',
    key: 'binaryThreshold',
    label: '二值阈值',
    hint: '亮度低于该值算前景。',
    when: (o) => isBinary(o) && !o.adaptive,
    min: 0,
    max: 255,
    step: 1,
  },
  {
    kind: 'toggle',
    key: 'adaptive',
    label: '自适应阈值',
    hint: 'Bradley–Roth，适合光照不均的扫描件。',
    when: isBinary,
  },
  {
    kind: 'range',
    key: 'adaptiveT',
    label: '自适应灵敏度',
    hint: '低于局部均值的百分比。',
    when: (o) => isBinary(o) && !!o.adaptive,
    min: 1,
    max: 50,
    step: 1,
  },
  {
    kind: 'range',
    key: 'watershedDetail',
    label: '分水岭细节',
    hint: '越高分出的区域越多。',
    when: isWatershed,
    min: 8,
    max: 512,
    step: 8,
  },
  {
    kind: 'range',
    key: 'cornerThreshold',
    label: '角点阈值（度）',
    hint: '夹角小于此值判定为尖角，不做平滑。',
    when: isCurved,
    min: 0,
    max: 180,
    step: 1,
  },
  {
    kind: 'range',
    key: 'lengthThreshold',
    label: '最短线段',
    when: isCurved,
    min: 3.5,
    max: 10,
    step: 0.5,
  },
  {
    kind: 'range',
    key: 'spliceThreshold',
    label: '拼接阈值（度）',
    when: isCurved,
    min: 0,
    max: 180,
    step: 1,
  },
  {
    kind: 'range',
    key: 'simplify',
    label: '曲线简化容差(px)',
    hint: '0 关闭。1–2.5 通常能砍掉大量节点而肉眼无差。',
    min: 0,
    max: 5,
    step: 0.1,
  },
  {
    kind: 'range',
    key: 'pathPrecision',
    label: '坐标小数位',
    hint: '直接影响文件体积。',
    min: 0,
    max: 8,
    step: 1,
  },
  {
    kind: 'range',
    key: 'optimize',
    label: 'SVG 优化等级',
    hint: '0 关闭 · 1 量化+简化 · 2 再加缩写与分组',
    min: 0,
    max: 2,
    step: 1,
  },
];

/** Strip options the current clustering/mode combination ignores. */
export function activeControls(options: TraceOptions): Control[] {
  return CONTROLS.filter((c) => !c.when || c.when(options));
}
