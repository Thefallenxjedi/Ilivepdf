import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import type { ProcessRequest, ProcessResult, Processor, WatermarkOptions } from "../types";

function parseColor(hex: string) {
  const cleaned = hex.replace("#", "").trim();
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((char) => char + char)
          .join("")
      : cleaned.padEnd(6, "0").slice(0, 6);
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return rgb(0.45, 0.45, 0.45);
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

function drawWatermarkText(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  font: any,
  text: string,
  x: number,
  y: number,
  size: number,
  color: ReturnType<typeof rgb>,
  opacity: number,
  angle: number,
) {
  const textWidth = font.widthOfTextAtSize(text, size);
  page.drawText(text, {
    x: x - textWidth / 2,
    y: y - size / 3,
    size,
    font,
    color,
    opacity,
    rotate: degrees(angle),
  });
}

export const watermarkProcessor: Processor = {
  id: "watermark-pdf",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const options = request.options as WatermarkOptions;
    const text = (options.text || "").trim();
    if (!text) {
      throw new Error("Enter watermark text.");
    }

    const pattern = options.pattern || "diagonal";
    const opacity = Math.min(1, Math.max(0.03, options.opacity ?? 0.15));
    const fontSize = Math.min(120, Math.max(12, options.fontSize ?? 48));
    const gapX = Math.min(480, Math.max(80, options.gapX ?? 200));
    const gapY = Math.min(480, Math.max(80, options.gapY ?? 200));
    const color = parseColor(options.color || "#8a8a8a");
    const angle = pattern === "diagonal" ? 35 : 0;

    const doc = await PDFDocument.load(request.files[0].bytes, {
      ignoreEncryption: true,
    });
    const font = await doc.embedFont(StandardFonts.HelveticaBold);

    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();

      if (pattern === "single") {
        drawWatermarkText(page, font, text, width / 2, height / 2, fontSize, color, opacity, 0);
        continue;
      }

      // Diagonal tiled or aligned grid — scale full page without cropping content.
      const startX = pattern === "diagonal" ? -gapX : gapX / 2;
      const startY = pattern === "diagonal" ? -gapY : gapY / 2;
      const endX = width + gapX;
      const endY = height + gapY;
      let row = 0;

      for (let y = startY; y <= endY; y += gapY, row += 1) {
        const offsetX = pattern === "diagonal" && row % 2 === 1 ? gapX / 2 : 0;
        for (let x = startX + offsetX; x <= endX; x += gapX) {
          drawWatermarkText(page, font, text, x, y, fontSize, color, opacity, angle);
        }
      }
    }

    const bytes = await doc.save({ useObjectStreams: true });
    return {
      files: [{ name: "watermarked.pdf", bytes, mimeType: "application/pdf" }],
      meta: { pageCount: doc.getPageCount(), pattern },
    };
  },
};
