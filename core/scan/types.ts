export type Point = { x: number; y: number };

export type Quad = [Point, Point, Point, Point];

export type ScannedPage = {
  id: string;
  previewUrl: string;
  imageDataUrl: string;
  ocrText?: string;
};
