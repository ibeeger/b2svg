# 位图 → SVG（VTracer WASM，纯前端）

一个把位图矢量化成 SVG 的浏览器端 demo。图片不上传，解码、追踪、导出全部在本地完成。

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # 产出静态站点到 dist/
npm test         # 校验生成的 wasm glue
```

## 技术构成

| 部分 | 选择 | 说明 |
| --- | --- | --- |
| 矢量化引擎 | [`@visioncortex/vtracer`](https://www.npmjs.com/package/@visioncortex/vtracer) 1.0.0-alpha.4 | 官方 Rust 实现的 WASM 构建，653 KB（gzip 283 KB） |
| 运行位置 | Web Worker | 追踪是无让出点的纯 CPU 计算，放主线程会卡死界面 |
| 构建 | Vite + TypeScript | 无框架，产物 JS 约 17 KB |
| 图像解码 | Canvas 2D | 支持 PNG / JPEG / GIF / WebP / SVG |

### 关于 wasm glue

npm 上的官方包是用 `wasm-pack --target nodejs` 构建的：它用 CJS `exports` 导出，并通过
`require('fs').readFileSync` 加载 `.wasm`，浏览器里无法直接使用。

除此之外，那份 glue 全是标准 JS + WebAssembly + TextEncoder/TextDecoder。
`scripts/build-vtracer-web.mjs` 在 `npm install` / `dev` / `build` 前自动运行，
只重写这两处 Node 特有代码，生成浏览器 ESM 版到 `src/vendor/`（该目录已 gitignore）。

之所以做成脚本而不是手工改一份 vendor 文件：升级依赖时能自动重新生成，
而不会静默退回旧的手改版本。脚本对上游格式做了断言，上游一改结构就会直接报错而不是产出坏文件。

## 实测：VTracer 在不同图像上的表现

以下数字来自内置样本，均为 512×512 输入、各自默认预设，Chrome + M 系列 Mac。
「对比 PNG」是 SVG 相对同尺寸 PNG 的体积。

| 样本 | 路径数 | SVG 体积 | 对比 PNG | 耗时 |
| --- | --- | --- | --- | --- |
| 扁平 Logo | 7 | 2.8 KB | 小 8.5× | 59 ms |
| 线稿（二值） | 3 | 1.6 KB | 小 15.3× | 20 ms |
| 色块插画 | 445 | 163.2 KB | **大 2.0×** | 220 ms |
| 平滑渐变 | 3 | 1.0 KB | 小 44.9× | 43 ms |
| 连续调（类照片） | 199 | 134.7 KB | 小 4.3× | 472 ms |

### 三条值得记住的结论

**1. 平滑渐变不会变成色带，而是被压成纯色块。**

这一点和普遍印象相反。VTracer 的分层聚类依据的是**相邻像素的颜色边界**，
而平滑渐变处处没有边界，于是整片区域被合并成一个簇。

在一张 384×384、纵向 384 级的纯渐变图上实测：

| 参数 | 输出 |
| --- | --- |
| 默认 | 1 条路径，1 种颜色 |
| `filterSpeckle=0` | 1 条路径 |
| `colorPrecision` 4 / 6 / 8 | 均为 1 条路径 |
| `layerDifference` 0 / 1 / 64 | 均为 1 条路径 |
| `hierarchical=cutout` | 2 条路径 |

这不是本 alpha 版的回归——用经典稳定版（`wasm_vtracer` 0.2.0）测同一张图，结果同样是 1–2 条路径。
**需要保留渐变，就得用支持输出 SVG gradient 的方案**（商业 API，或自行做渐变检测后合成）。

**2. `filterSpeckle` 是影响最大的单个参数。**

连续调样本上，仅把它从 24 调到 0：

- 路径数 199 → **20367**
- 体积 134.7 KB → **2.05 MB**

**3. 矢量化不一定更小。** 色块插画样本的 SVG 是同尺寸 PNG 的 2 倍大。
真正省体积的是扁平图形，色块一多就会反过来。

### 参数有效性

面板里暴露的每个参数都实测确认有效，其中两个值得注意：

- `layerDifference`：0–32 区间几乎无感，64 以上急剧塌缩（445 → 4 条路径）。
- `optimize`：1 与 2 在多数图上输出一致，差异只在特定结构上出现。

## 最重要的一个参数不在 VTracer 里

是**输入尺寸上限**。VTracer 会忠实描摹给它的每一个像素边界，
所以一张 4000px 的照片会产出数万条路径、耗时数分钟。
先把长边限制在合理范围（面板顶部的滑块），比调任何追踪参数都有效。

## 适用边界

适合：Logo、图标、线稿、扫描签名、像素图、扁平插画。

不适合：照片、写实插画、需要保留渐变或半透明的图。
这类图矢量化后普遍体积大、路径碎、导入设计工具后难以编辑——
输出是一堆按绘制顺序堆叠的不透明色块，底层形状会延伸到被遮挡的区域，
和设计师手绘的结构完全不同。`hierarchical: 'cutout'` 会好一些，但仍有差距。

## 目录结构

```
scripts/build-vtracer-web.mjs   把官方 Node 版 glue 转成浏览器 ESM
src/tracer.worker.ts            Worker 内的追踪入口
src/lib/tracer-client.ts        Promise 封装，自动丢弃被取代的请求
src/lib/image.ts                解码 + 缩放 + 可选透明合成
src/lib/controls.ts             参数面板的声明式定义
src/lib/presets.ts              各类图像的起始参数
src/lib/samples.ts              内置样本（SVG 源码，浏览器内栅格化）
test/vtracer-glue.test.js       验证生成的 glue 不含 Node 依赖且能正常追踪
```
