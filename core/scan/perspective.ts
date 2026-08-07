import type { Point, Quad } from "./types";

function solveLinearSystem(a: number[][], b: number[]) {
  const n = b.length;
  const m = a.map((row, i) => [...row, b[i]]);

  for (let col = 0; col < n; col += 1) {
    let pivot = col;
    for (let row = col + 1; row < n; row += 1) {
      if (Math.abs(m[row][col]) > Math.abs(m[pivot][col])) pivot = row;
    }
    [m[col], m[pivot]] = [m[pivot], m[col]];
    const div = m[col][col] || 1e-12;
    for (let j = col; j <= n; j += 1) m[col][j] /= div;
    for (let row = 0; row < n; row += 1) {
      if (row === col) continue;
      const factor = m[row][col];
      for (let j = col; j <= n; j += 1) m[row][j] -= factor * m[col][j];
    }
  }

  return m.map((row) => row[n]);
}

/** Homography mapping destination → source (for inverse sampling). */
export function getPerspectiveTransform(src: Quad, dst: Quad) {
  const a: number[][] = [];
  const b: number[] = [];

  for (let i = 0; i < 4; i += 1) {
    const { x: xs, y: ys } = src[i];
    const { x: xd, y: yd } = dst[i];
    a.push([xd, yd, 1, 0, 0, 0, -xs * xd, -xs * yd]);
    b.push(xs);
    a.push([0, 0, 0, xd, yd, 1, -ys * xd, -ys * yd]);
    b.push(ys);
  }

  const h = solveLinearSystem(a, b);
  return [h[0], h[1], h[2], h[3], h[4], h[5], h[6], h[7], 1] as const;
}

function applyHomography(
  h: readonly number[],
  x: number,
  y: number,
): Point {
  const w = h[6] * x + h[7] * y + h[8] || 1e-12;
  return {
    x: (h[0] * x + h[1] * y + h[2]) / w,
    y: (h[3] * x + h[4] * y + h[5]) / w,
  };
}

function sampleBilinear(data: Uint8ClampedArray, width: number, height: number, x: number, y: number) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(width - 1, x0 + 1);
  const y1 = Math.min(height - 1, y0 + 1);
  const fx = x - x0;
  const fy = y - y0;

  const idx = (ix: number, iy: number) => (iy * width + ix) * 4;
  const mix = (a: number, b: number, t: number) => a + (b - a) * t;

  const out = [0, 0, 0, 255];
  for (let c = 0; c < 3; c += 1) {
    const v00 = data[idx(x0, y0) + c];
    const v10 = data[idx(x1, y0) + c];
    const v01 = data[idx(x0, y1) + c];
    const v11 = data[idx(x1, y1) + c];
    out[c] = mix(mix(v00, v10, fx), mix(v01, v11, fx), fy);
  }
  return out;
}

function destinationSize(quad: Quad) {
  const [tl, tr, br, bl] = quad;
  const widthTop = Math.hypot(tr.x - tl.x, tr.y - tl.y);
  const widthBottom = Math.hypot(br.x - bl.x, br.y - bl.y);
  const heightLeft = Math.hypot(bl.x - tl.x, bl.y - tl.y);
  const heightRight = Math.hypot(br.x - tr.x, br.y - tr.y);
  const contentW = Math.max(widthTop, widthBottom);
  const contentH = Math.max(heightLeft, heightRight);

  // Target A4 aspect (portrait). Scale content to fit inside — never crop.
  const a4Ratio = 595.28 / 841.89;
  const contentRatio = contentW / Math.max(1, contentH);
  let width: number;
  let height: number;

  if (contentRatio > a4Ratio) {
    width = Math.max(400, Math.round(contentW));
    height = Math.round(width / a4Ratio);
  } else {
    height = Math.max(560, Math.round(contentH));
    width = Math.round(height * a4Ratio);
  }

  return { width, height, contentW, contentH };
}

/** Perspective fix / de-skew via homography warp into an A4-aspect canvas (fit, no crop). */
export function warpPerspective(source: ImageData, quad: Quad): ImageData {
  const size = destinationSize(quad);
  // Fit document into A4 canvas centered; letterbox with white if needed.
  const fitScale = Math.min(size.width / size.contentW, size.height / size.contentH);
  const drawW = size.contentW * fitScale;
  const drawH = size.contentH * fitScale;
  const offsetX = (size.width - drawW) / 2;
  const offsetY = (size.height - drawH) / 2;

  const dst: Quad = [
    { x: offsetX, y: offsetY },
    { x: offsetX + drawW - 1, y: offsetY },
    { x: offsetX + drawW - 1, y: offsetY + drawH - 1 },
    { x: offsetX, y: offsetY + drawH - 1 },
  ];
  const h = getPerspectiveTransform(quad, dst);
  const out = new ImageData(size.width, size.height);
  const src = source.data;

  for (let y = 0; y < size.height; y += 1) {
    for (let x = 0; x < size.width; x += 1) {
      const i = (y * size.width + x) * 4;
      const mapped = applyHomography(h, x, y);
      const sx = mapped.x;
      const sy = mapped.y;
      if (sx < 0 || sy < 0 || sx >= source.width - 1 || sy >= source.height - 1) {
        out.data[i] = 255;
        out.data[i + 1] = 255;
        out.data[i + 2] = 255;
        out.data[i + 3] = 255;
        continue;
      }
      const sample = sampleBilinear(src, source.width, source.height, sx, sy);
      out.data[i] = sample[0];
      out.data[i + 1] = sample[1];
      out.data[i + 2] = sample[2];
      out.data[i + 3] = 255;
    }
  }

  return out;
}

export function imageDataToDataUrl(imageData: ImageData, quality = 0.92) {
  const canvas = document.createElement("canvas");
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable.");
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/jpeg", quality);
}

export async function loadImageData(source: HTMLImageElement | HTMLVideoElement | HTMLCanvasElement) {
  const width =
    source instanceof HTMLVideoElement ? source.videoWidth : source.width;
  const height =
    source instanceof HTMLVideoElement ? source.videoHeight : source.height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("Canvas unavailable.");
  ctx.drawImage(source, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

export function downscaleImageData(imageData: ImageData, maxSide = 640): ImageData {
  const scale = Math.min(1, maxSide / Math.max(imageData.width, imageData.height));
  if (scale >= 0.99) return imageData;
  const width = Math.max(1, Math.round(imageData.width * scale));
  const height = Math.max(1, Math.round(imageData.height * scale));
  const src = document.createElement("canvas");
  src.width = imageData.width;
  src.height = imageData.height;
  src.getContext("2d")?.putImageData(imageData, 0, 0);
  const dst = document.createElement("canvas");
  dst.width = width;
  dst.height = height;
  const ctx = dst.getContext("2d");
  if (!ctx) return imageData;
  ctx.drawImage(src, 0, 0, width, height);
  return ctx.getImageData(0, 0, width, height);
}

export function scaleQuad(quad: Quad, fromW: number, fromH: number, toW: number, toH: number): Quad {
  const sx = toW / fromW;
  const sy = toH / fromH;
  return quad.map((point) => ({ x: point.x * sx, y: point.y * sy })) as Quad;
}
