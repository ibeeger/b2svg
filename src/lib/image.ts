import type { RgbaImage } from './types';

export interface DecodeOptions {
  /** Longest edge, in pixels. Larger inputs are downscaled before tracing. */
  maxEdge: number;
  /** Composite transparency onto white instead of letting VTracer drop it. */
  flattenAlpha: boolean;
}

/**
 * Decode a file (or an SVG/raster blob) into RGBA pixels, downscaled to fit
 * `maxEdge`.
 *
 * Downscaling matters more than any tracer setting: VTracer traces every pixel
 * boundary it is given, so a 4000px photo yields tens of thousands of paths and
 * takes minutes. Capping the input is what keeps output usable.
 */
export async function decodeToRgba(source: Blob, options: DecodeOptions): Promise<RgbaImage> {
  const bitmap = await createImageBitmapCompat(source);
  const { width, height } = fitWithin(bitmap.width, bitmap.height, options.maxEdge);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) throw new Error('无法创建 2D canvas 上下文');

  if (options.flattenAlpha) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
  }

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const imageData = ctx.getImageData(0, 0, width, height);
  return { data: imageData.data, width, height };
}

/**
 * Safari historically refused SVG blobs in createImageBitmap, so fall back to
 * an <img> decode when it throws.
 */
async function createImageBitmapCompat(source: Blob): Promise<ImageBitmap> {
  try {
    return await createImageBitmap(source);
  } catch {
    const url = URL.createObjectURL(source);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return await createImageBitmap(img);
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}
