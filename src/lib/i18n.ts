/**
 * Minimal two-locale i18n.
 *
 * Chrome strings live in the MESSAGES table and static HTML picks them up via
 * `data-i18n` attributes; data-driven strings (presets, controls, samples)
 * carry their own {zh, en} pairs and go through `tx()`. No library: two
 * locales and ~80 keys don't justify one.
 *
 * The locale is also addressable as `?lang=zh` / `?lang=en`, which is what
 * gives each language a distinct URL for hreflang (see src/lib/seo.ts).
 */

export type Locale = 'zh' | 'en';

/** An inline bilingual string, used by data tables (presets/controls/samples). */
export interface L10n {
  zh: string;
  en: string;
}

const STORAGE_KEY = 'b2v-locale';
const LANG_PARAM = 'lang';

function parse(value: string | null): Locale | null {
  return value === 'zh' || value === 'en' ? value : null;
}

function detect(): Locale {
  // A `?lang=` in the URL wins: shared links and the crawler's language
  // alternates have to land on the language they name, whatever is in storage.
  const fromUrl = parse(new URLSearchParams(location.search).get(LANG_PARAM));
  if (fromUrl) return fromUrl;

  try {
    const saved = parse(localStorage.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch {
    // storage unavailable (private mode etc.) — fall through to the default
  }
  // English by default; the toggle (persisted above) is the way to opt into zh.
  return 'en';
}

let locale: Locale = detect();

export function getLocale(): Locale {
  return locale;
}

/** Keep `?lang=` in sync without adding a history entry per toggle. */
function syncUrl(next: Locale): void {
  const url = new URL(location.href);
  if (url.searchParams.get(LANG_PARAM) === next) return;
  url.searchParams.set(LANG_PARAM, next);
  history.replaceState(null, '', url);
}

export function setLocale(next: Locale): void {
  locale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // non-fatal: the choice just won't survive a reload
  }
  syncUrl(next);
  document.documentElement.lang = htmlLang(next);
}

/** BCP 47 tag for <html lang>, matching the hreflang values in index.html. */
export function htmlLang(value: Locale = locale): string {
  return value === 'zh' ? 'zh-Hans' : 'en';
}

/** Resolve an inline bilingual string against the current locale. */
export const tx = (text: L10n): string => text[locale];

const zh = {
  docTitle: '位图转矢量 —— 免费在线图片转 SVG 工具',
  metaDescription:
    '在浏览器里把 PNG、JPEG、GIF、WebP 位图转换成干净的 SVG 矢量路径。基于 VTracer WebAssembly：图片不上传、免注册、无水印，参数实时可调。',

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
  aboutLink: '说明 & FAQ',
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

  // ------------------------------------------------------------ prose block
  seoH1: '位图转矢量 —— 免费在线图片转 SVG 工具',
  seoLead:
    '把 PNG、JPEG、GIF、WebP 或 SVG 位图转换成干净、可无限缩放的 SVG 矢量路径。整个过程由编译成 WebAssembly 的 VTracer 在浏览器内完成：图片不会被上传，不用安装任何东西，也没有账号、额度和水印。',

  seoFeaturesTitle: '为什么用这个矢量化工具',
  feat1T: '文件不离开你的设备',
  feat1B: '解码、追踪、导出全部在本地的 Web Worker 里完成。没有任何服务器看得到你的图片，页面加载完之后断网一样能用。',
  feat2T: '货真价实的 VTracer 引擎',
  feat2B: '和桌面版同一套 Rust 颜色聚类追踪算法，编译成 WebAssembly——是全彩追踪，而不是只做黑白二值化。',
  feat3T: '参数实时生效',
  feat3B: '斑点过滤、颜色精度、渐变步长、拐角阈值、曲线拟合，任何改动都会立刻重新追踪，可以看着效果调而不用猜。',
  feat4T: '按图片类型准备好的预设',
  feat4B: '扁平 Logo、线稿、色块插画、类照片各有预设，先选一个再微调。内置样本可以直接看出每类图的表现。',
  feat5T: '不粉饰的数据',
  feat5B: '路径数、SVG 体积、耗时，以及与同尺寸 PNG 的体积对比——好让你判断出哪些图根本不该矢量化。',
  feat6T: '免费且开源',
  feat6B: '不注册、不限量、无水印、无付费档。整站就是一个静态页面，可以随意阅读、fork、自部署。',

  seoHowTitle: '怎么把图片转成 SVG',
  step1: '把 PNG / JPEG / GIF / WebP / SVG 文件拖进左侧面板——或者直接点内置样本，不用自己准备图片也能试。',
  step2: '选一个和你的图最接近的预设，再微调参数。「最长边上限」是对速度和路径数影响最大的一项。',
  step3: '左右对比原图和矢量结果，打开「描边预览」看清追踪出来的几何形状，或者直接读生成的 SVG 代码。',
  step4: '下载 SVG，然后在 Illustrator、Figma、Inkscape 或任意浏览器里打开。',

  seoFaqTitle: '常见问题',
  faq1Q: '我的图片会被上传到服务器吗？',
  faq1A: '不会。解码、追踪和导出都通过 Web Worker 里的 WebAssembly 在浏览器内完成，文件不会离开你的设备，页面加载完之后断网也能用。',
  faq2Q: '支持哪些图片格式转 SVG？',
  faq2A: '浏览器能解码的都行：PNG、JPEG、GIF、WebP、BMP，甚至 SVG（会先栅格化再重新追踪）。输出始终是标准 SVG 文件。',
  faq3Q: '照片矢量化效果好吗？',
  faq3A: '通常不好。照片会产生成千上万条路径，得到的 SVG 往往比原来的 PNG / JPEG 更大、渲染更慢。矢量化真正划算的是 Logo、图标、线稿、扁平插画和扫描稿。',
  faq4Q: '为什么导出的 SVG 比原 PNG 还大？',
  faq4A: '每个颜色区域都会变成一条带完整坐标的路径。当图里有成千上万个小色块时，存这些坐标比像素压缩更费字节。可以调低「最长边上限」、调高斑点过滤，或者减少颜色数量。',
  faq5Q: 'VTracer 是什么？',
  faq5A: 'VTracer 是 VisionCortex 出品的开源位图转矢量工具，用 Rust 编写。它把像素聚类成颜色区域，再沿区域边界拟合曲线，所以能处理全彩图像，而不像传统自动描摹那样只能做黑白。',
  faq6Q: '结果能在 Illustrator / Figma / Inkscape 里编辑吗？',
  faq6A: '可以。输出就是普通 SVG，由标准 path 元素和纯色填充组成。如果想手工编辑得舒服，尽量把路径数控制在几百条以内。',
  faq7Q: '真的免费吗？',
  faq7A: '真的免费：不限量、无账号、无文件大小限制、无水印。转换跑在你自己的机器上，没有后端成本要摊。',

  footEngine: '矢量化引擎',
  footSource: 'GitHub 源码',
} satisfies Record<string, string>;

const en: Record<MessageKey, string> = {
  docTitle: 'Bitmap to Vector — Free Online Image to SVG Converter',
  metaDescription:
    'Convert PNG, JPEG, GIF and WebP images into clean SVG vector paths right in your browser. Powered by VTracer WebAssembly — no upload, no signup, no watermark.',

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
  aboutLink: 'About & FAQ',
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

  // ------------------------------------------------------------ prose block
  seoH1: 'Bitmap to Vector — a free online image to SVG converter',
  seoLead:
    'Turn PNG, JPEG, GIF, WebP or SVG bitmaps into clean, infinitely scalable SVG vector paths. The conversion runs entirely inside your browser with VTracer compiled to WebAssembly, so your images are never uploaded, there is nothing to install, and there is no account, quota or watermark.',

  seoFeaturesTitle: 'Why use this vectorizer',
  feat1T: 'Nothing leaves your device',
  feat1B:
    'Decoding, tracing and export all happen locally in a Web Worker. No server ever sees your file, which also means it keeps working offline.',
  feat2T: 'The real VTracer engine',
  feat2B:
    'The same Rust colour-clustering tracer used by the desktop tool, compiled to WebAssembly — full-colour tracing, not just black-and-white thresholding.',
  feat3T: 'Every parameter is live',
  feat3B:
    'Filter speckle, colour precision, gradient step, corner threshold and curve fitting all re-trace instantly, so you can tune by eye instead of guessing.',
  feat4T: 'Presets that match the artwork',
  feat4B:
    'Start from a preset for flat logos, line art, colour illustration or photo-like images, then adjust from there. Built-in samples show how each type behaves.',
  feat5T: 'Honest numbers',
  feat5B:
    'Path count, SVG size, trace time and a size comparison against the equivalent PNG — so you can tell when vectorizing an image is simply the wrong call.',
  feat6T: 'Free and open source',
  feat6B:
    'No sign-up, no upload limit, no watermark, no paid tier. The whole site is a static page you can read, fork and self-host.',

  seoHowTitle: 'How to convert an image to SVG',
  step1:
    'Drop a PNG, JPEG, GIF, WebP or SVG file onto the panel — or click a built-in sample to try it without a file of your own.',
  step2:
    'Pick the preset that matches your artwork, then fine-tune the parameters. Max edge is the setting that most affects both speed and path count.',
  step3:
    'Compare the source and the vector result side by side, switch on the outline preview to see the traced geometry, or read the generated SVG code directly.',
  step4: 'Download the SVG and open it in Illustrator, Figma, Inkscape or any browser.',

  seoFaqTitle: 'Frequently asked questions',
  faq1Q: 'Are my images uploaded to a server?',
  faq1A:
    'No. Decoding, tracing and export all happen inside your browser using WebAssembly in a Web Worker. The file never leaves your device, so the tool also works offline once the page has loaded.',
  faq2Q: 'Which image formats can I convert to SVG?',
  faq2A:
    'Anything your browser can decode: PNG, JPEG, GIF, WebP, BMP and even SVG, which is rasterized first and then re-traced. The output is always a standard SVG file.',
  faq3Q: 'Does vectorizing a photo work well?',
  faq3A:
    'Usually not. Photographs produce thousands of paths and an SVG that is often larger and slower to render than the original PNG or JPEG. Vectorization pays off for logos, icons, line art, flat illustrations and scanned drawings.',
  faq4Q: 'Why is my SVG larger than the source PNG?',
  faq4A:
    'Every colour region becomes a path with its own coordinates. When an image contains thousands of small regions, storing those coordinates costs more bytes than pixel compression. Lower the max edge, raise filter speckle, or reduce the colour count to bring the size down.',
  faq5Q: 'What is VTracer?',
  faq5A:
    'VTracer is an open-source raster-to-vector tracer from VisionCortex, written in Rust. It clusters pixels into colour regions and fits curves along their borders, so it handles full-colour artwork rather than only black-and-white images like a classic auto-trace.',
  faq6Q: 'Can I edit the result in Illustrator, Figma or Inkscape?',
  faq6A:
    'Yes. The output is a plain SVG made of standard path elements with solid fills. Keep the path count in the low hundreds if you want the file to stay comfortable to edit by hand.',
  faq7Q: 'Is it really free?',
  faq7A:
    'Yes — free and unlimited, with no account, no file-size quota and no watermark. There is no backend to pay for, because the conversion runs on your own machine.',

  footEngine: 'Vectorization by',
  footSource: 'Source on GitHub',
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
  document.documentElement.lang = htmlLang();
}
