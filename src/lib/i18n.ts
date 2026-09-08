/**
 * Minimal two-locale i18n.
 *
 * Chrome strings live in the MESSAGES table and static HTML picks them up via
 * `data-i18n` attributes; data-driven strings (presets, controls, samples)
 * carry their own {zh, en} pairs and go through `tx()`. No library: two
 * locales and ~40 keys don't justify one.
 */

export type Locale = 'zh' | 'en';

/** An inline bilingual string, used by data tables (presets/controls/samples). */
export interface L10n {
  zh: string;
  en: string;
}

const STORAGE_KEY = 'b2v-locale';

function detect(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'zh' || saved === 'en') return saved;
  } catch {
    // storage unavailable (private mode etc.) — fall through to language sniff
  }
  return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en';
}

let locale: Locale = detect();

export function getLocale(): Locale {
  return locale;
}

export function setLocale(next: Locale): void {
  locale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // non-fatal: the choice just won't survive a reload
  }
  document.documentElement.lang = next === 'zh' ? 'zh-CN' : 'en';
}

/** Resolve an inline bilingual string against the current locale. */
export const tx = (text: L10n): string => text[locale];

const zh = {
  docTitle: '位图转矢量 · VTracer WASM',
  inputSection: '输入',
  dropTitle: '拖入图片',
  dropSub: '或点击选择 · PNG / JPEG / GIF / WebP / SVG',
  dropAria: '选择或拖入图片',
  maxEdgePrefix: '最长边上限',
  maxEdgeSuffix: 'px',
  maxEdgeHint: '决定速度和路径数量的最重要参数。',
  flattenAlpha: '透明背景合成为白色',
  presetsSection: '预设',
  paramsSection: '参数',
  tabSplit: '对比',
  tabSource: '原图',
  tabResult: 'SVG',
  tabCode: '代码',
  outlines: '描边预览',
  download: '下载 SVG',
  paneSource: '原图（已缩放）',
  paneResult: '矢量结果',
  placeholder: '选择一张图片开始。',
  statSize: '尺寸',
  statTime: '耗时',
  statPaths: '路径数',
  statBytes: 'SVG 体积',
  statVsPng: '对比 PNG',
  vsSmaller: '小 {n}×',
  vsLarger: '大 {n}×',
  warnPaths: '路径数过多，这类图更适合保留位图',
  errorPrefix: '出错：',
} satisfies Record<string, string>;

const en: Record<MessageKey, string> = {
  docTitle: 'Bitmap to Vector · VTracer WASM',
  inputSection: 'Input',
  dropTitle: 'Drop an image',
  dropSub: 'or click to choose · PNG / JPEG / GIF / WebP / SVG',
  dropAria: 'Choose or drop an image',
  maxEdgePrefix: 'Max edge',
  maxEdgeSuffix: 'px',
  maxEdgeHint: 'The single most important setting for speed and path count.',
  flattenAlpha: 'Flatten transparency onto white',
  presetsSection: 'Presets',
  paramsSection: 'Parameters',
  tabSplit: 'Compare',
  tabSource: 'Source',
  tabResult: 'SVG',
  tabCode: 'Code',
  outlines: 'Outline preview',
  download: 'Download SVG',
  paneSource: 'Source (scaled)',
  paneResult: 'Vector result',
  placeholder: 'Pick an image to start.',
  statSize: 'Size',
  statTime: 'Time',
  statPaths: 'Paths',
  statBytes: 'SVG size',
  statVsPng: 'vs PNG',
  vsSmaller: '{n}× smaller',
  vsLarger: '{n}× larger',
  warnPaths: 'Too many paths — this image is better kept as a bitmap',
  errorPrefix: 'Error: ',
};

export type MessageKey = keyof typeof zh;

const MESSAGES: Record<Locale, Record<MessageKey, string>> = { zh, en };

export function t(key: MessageKey, vars?: Record<string, string | number>): string {
  let out = MESSAGES[locale][key];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      out = out.replace(`{${name}}`, String(value));
    }
  }
  return out;
}

/** Fill every element carrying data-i18n / data-i18n-aria from the table. */
export function applyStaticI18n(root: ParentNode = document): void {
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n]')) {
    el.textContent = t(el.dataset.i18n as MessageKey);
  }
  for (const el of root.querySelectorAll<HTMLElement>('[data-i18n-aria]')) {
    el.setAttribute('aria-label', t(el.dataset.i18nAria as MessageKey));
  }
  document.title = t('docTitle');
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
}
