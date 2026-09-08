/**
 * Built-in test images.
 *
 * They ship as SVG source and get rasterized in the browser, so the repo stays
 * binary-free and every sample re-renders at whatever resolution the size
 * slider asks for.
 *
 * The set is chosen to cover VTracer's whole behaviour range, measured at
 * 512px (see README): flat art traces almost perfectly, posterized art traces
 * usefully but needs tuning, smooth gradients collapse to a single flat fill,
 * and continuous-tone images explode into thousands of paths.
 */

export interface Sample {
  id: string;
  label: string;
  /** Preset that suits this image. */
  preset: string;
  /** What to look for in the output. */
  note: string;
  svg: string;
}

const flatLogo = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#f5f2ea"/>
  <circle cx="200" cy="200" r="140" fill="#1f6feb"/>
  <path d="M200 90 L286 330 L200 268 L114 330 Z" fill="#ffd400"/>
  <circle cx="200" cy="176" r="42" fill="#e5484d"/>
  <rect x="150" y="300" width="100" height="26" rx="13" fill="#12263a"/>
</svg>`;

const lineArt = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <rect width="400" height="400" fill="#ffffff"/>
  <g fill="none" stroke="#111111" stroke-width="7" stroke-linecap="round" stroke-linejoin="round">
    <path d="M80 300 C 80 190, 150 120, 200 120 C 250 120, 320 190, 320 300"/>
    <path d="M120 300 L120 220 Q200 160 280 220 L280 300"/>
    <circle cx="200" cy="232" r="26"/>
    <path d="M60 300 L340 300"/>
    <path d="M150 90 L200 50 L250 90"/>
  </g>
</svg>`;

/**
 * Posterized colour field: many flat regions with hard edges between them.
 * The discrete transfer function is what makes it traceable — without it this
 * is the "smooth" case below.
 */
const posterized = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <filter id="poster">
      <feTurbulence type="fractalNoise" baseFrequency="0.009" numOctaves="5" seed="11"/>
      <feColorMatrix type="matrix"
        values="1.1 0.2 0 0 0  0.1 0.9 0.3 0 0  0.2 0.1 1.0 0 0  0 0 0 0 1"/>
      <feComponentTransfer>
        <feFuncR type="discrete" tableValues="0 .15 .3 .45 .6 .75 .9 1"/>
        <feFuncG type="discrete" tableValues="0 .15 .3 .45 .6 .75 .9 1"/>
        <feFuncB type="discrete" tableValues="0 .15 .3 .45 .6 .75 .9 1"/>
      </feComponentTransfer>
    </filter>
  </defs>
  <rect width="400" height="400" filter="url(#poster)"/>
</svg>`;

/** Pure smooth gradient: no colour edges anywhere for the clusterer to find. */
const smoothGradient = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0b1d51"/>
      <stop offset="45%" stop-color="#c2427a"/>
      <stop offset="75%" stop-color="#ff9a3c"/>
      <stop offset="100%" stop-color="#ffd79a"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0%" stop-color="#fff6d8"/>
      <stop offset="100%" stop-color="#ff7b3c"/>
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(#sky)"/>
  <circle cx="200" cy="250" r="70" fill="url(#sun)"/>
  <path d="M0 300 L110 215 L190 290 L260 235 L400 330 L400 400 L0 400 Z" fill="#1b1033"/>
</svg>`;

/** Continuous tone with texture at every scale — the photograph stand-in. */
const continuousTone = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
  <defs>
    <filter id="tone">
      <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves="3" seed="5"/>
      <feColorMatrix type="matrix"
        values="0.8 0.4 0.1 0 0  0.2 0.9 0.2 0 0  0.1 0.3 0.8 0 0  0 0 0 0 1"/>
    </filter>
  </defs>
  <rect width="400" height="400" filter="url(#tone)"/>
</svg>`;

export const SAMPLES: Sample[] = [
  {
    id: 'logo',
    label: '扁平 Logo',
    preset: 'logo',
    note: '理想情况：约 8 条路径就还原全部形状，SVG 比 PNG 小一个数量级。',
    svg: flatLogo,
  },
  {
    id: 'lineart',
    label: '线稿',
    preset: 'lineart',
    note: '二值模式只描一层黑。调阈值看细线在哪里开始断开。',
    svg: lineArt,
  },
  {
    id: 'poster',
    label: '色块插画',
    preset: 'poster',
    note: '几百条路径，参数在这里最有价值：限色和 simplify 能把体积砍掉一半以上。',
    svg: posterized,
  },
  {
    id: 'gradient',
    label: '平滑渐变',
    preset: 'poster',
    note: '注意：渐变没有被切成色带，而是被整个压成几块纯色 —— 这是 VTracer 的硬限制。',
    svg: smoothGradient,
  },
  {
    id: 'tone',
    label: '连续调（类照片）',
    preset: 'photo',
    note: '路径数上千、体积可超过 1 MB。把斑点过滤调到 0 看它彻底失控。',
    svg: continuousTone,
  },
];

/**
 * Turn a sample into a rasterizable blob at `size` px square.
 *
 * The sources carry only a viewBox; without explicit width/height an SVG blob
 * rasterizes at the 300x150 CSS default in several browsers, so the size is
 * injected here rather than hard-coded per sample.
 */
export function sampleToBlob(sample: Sample, size = 512): Blob {
  const sized = sample.svg.replace(/<svg\b/, `<svg width="${size}" height="${size}"`);
  return new Blob([sized], { type: 'image/svg+xml' });
}
