import type { Point, Quad } from "./types";

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

/** Sobel edge magnitude (0–255) for grayscale ImageData. */
export function sobelMagnitude(gray: Uint8ClampedArray, width: number, height: number) {
  const out = new Float32Array(width * height);
  const at = (x: number, y: number) => gray[y * width + x] || 0;

  for (let y = 1; y < height - 1; y += 1) {
    for (let x = 1; x < width - 1; x += 1) {
      const gx =
        -at(x - 1, y - 1) +
        at(x + 1, y - 1) -
        2 * at(x - 1, y) +
        2 * at(x + 1, y) -
        at(x - 1, y + 1) +
        at(x + 1, y + 1);
      const gy =
        -at(x - 1, y - 1) -
        2 * at(x, y - 1) -
        at(x + 1, y - 1) +
        at(x - 1, y + 1) +
        2 * at(x, y + 1) +
        at(x + 1, y + 1);
      out[y * width + x] = Math.hypot(gx, gy);
    }
  }
  return out;
}

export function toGrayscale(imageData: ImageData) {
  const { data, width, height } = imageData;
  const gray = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; i < data.length; i += 4, p += 1) {
    gray[p] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) | 0;
  }
  return gray;
}

function orderCorners(points: Point[]): Quad {
  const sorted = [...points].sort((a, b) => a.y - b.y || a.x - b.x);
  const top = sorted.slice(0, 2).sort((a, b) => a.x - b.x);
  const bottom = sorted.slice(2, 4).sort((a, b) => a.x - b.x);
  return [top[0], top[1], bottom[1], bottom[0]];
}

function defaultQuad(width: number, height: number): Quad {
  const insetX = width * 0.12;
  const insetY = height * 0.12;
  return [
    { x: insetX, y: insetY },
    { x: width - insetX, y: insetY },
    { x: width - insetX, y: height - insetY },
    { x: insetX, y: height - insetY },
  ];
}

/**
 * Approximate document corners using Sobel edges + corner scoring.
 * Falls back to an inset rectangle when detection is weak.
 */
export function detectDocumentCorners(imageData: ImageData): Quad {
  const { width, height } = imageData;
  if (width < 32 || height < 32) return defaultQuad(width, height);

  const gray = toGrayscale(imageData);
  const mag = sobelMagnitude(gray, width, height);

  let max = 0;
  for (let i = 0; i < mag.length; i += 1) max = Math.max(max, mag[i]);
  const threshold = max * 0.35;

  const regions = [
    { x0: 0, y0: 0, x1: width / 2, y1: height / 2 },
    { x0: width / 2, y0: 0, x1: width, y1: height / 2 },
    { x0: width / 2, y0: height / 2, x1: width, y1: height },
    { x0: 0, y0: height / 2, x1: width / 2, y1: height },
  ];

  const points: Point[] = [];

  for (const region of regions) {
    let best = { x: (region.x0 + region.x1) / 2, y: (region.y0 + region.y1) / 2, score: -1 };
    const step = Math.max(2, Math.floor(Math.min(width, height) / 180));

    for (let y = Math.floor(region.y0); y < Math.floor(region.y1); y += step) {
      for (let x = Math.floor(region.x0); x < Math.floor(region.x1); x += step) {
        const edge = mag[y * width + x];
        if (edge < threshold) continue;
        const dx = x - width / 2;
        const dy = y - height / 2;
        const cornerBias = Math.hypot(dx, dy);
        const score = edge + cornerBias * 0.08;
        if (score > best.score) {
          best = { x, y, score };
        }
      }
    }
    points.push({
      x: clamp(best.x, 4, width - 4),
      y: clamp(best.y, 4, height - 4),
    });
  }

  if (points.length !== 4) return defaultQuad(width, height);
  return orderCorners(points);
}

export function quadArea(quad: Quad) {
  const [a, b, c, d] = quad;
  return (
    Math.abs(
      a.x * b.y +
        b.x * c.y +
        c.x * d.y +
        d.x * a.y -
        (a.y * b.x + b.y * c.x + c.y * d.x + d.y * a.x),
    ) / 2
  );
}

export function quadStable(a: Quad, b: Quad, tolerance: number) {
  return a.every((point, index) => {
    const other = b[index];
    return Math.hypot(point.x - other.x, point.y - other.y) <= tolerance;
  });
}
