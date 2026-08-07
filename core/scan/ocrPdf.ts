import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { ScannedPage } from "./types";

/** A4 portrait in PDF points (1/72"). */
export const PDF_PAGE_WIDTH = 595.28;
export const PDF_PAGE_HEIGHT = 841.89;
const PAGE_MARGIN = 24;

function sanitizePdfText(input: string) {
  return input
    .replace(/\u0000/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/[^\x09\x0A\x0D\x20-\x7E]/g, " ");
}

async function dataUrlToBytes(dataUrl: string) {
  const response = await fetch(dataUrl);
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Scale image to fit inside the PDF page (contain). Never crops —
 * letterboxes with empty margin when aspect ratios differ.
 */
export function fitImageToPdfPage(
  imageWidth: number,
  imageHeight: number,
  pageWidth = PDF_PAGE_WIDTH,
  pageHeight = PDF_PAGE_HEIGHT,
  margin = PAGE_MARGIN,
) {
  const maxW = Math.max(1, pageWidth - margin * 2);
  const maxH = Math.max(1, pageHeight - margin * 2);
  const scale = Math.min(maxW / imageWidth, maxH / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    width,
    height,
    x: (pageWidth - width) / 2,
    y: (pageHeight - height) / 2,
    scale,
  };
}

export async function runOcr(dataUrl: string): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const result = await worker.recognize(dataUrl);
    return result.data.text.trim();
  } finally {
    await worker.terminate();
  }
}

/** Build a searchable OCR PDF from scanned page images. */
export async function buildSearchablePdf(pages: ScannedPage[], withOcr: boolean) {
  if (!pages.length) {
    throw new Error("Capture at least one page first.");
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);

  for (const page of pages) {
    let text = page.ocrText || "";
    if (withOcr && !text) {
      text = await runOcr(page.imageDataUrl);
    }

    const bytes = await dataUrlToBytes(page.imageDataUrl);
    const image = await doc.embedJpg(bytes);
    const pdfPage = doc.addPage([PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT]);

    // White PDF page; scan is scaled to fit — never cropped.
    pdfPage.drawRectangle({
      x: 0,
      y: 0,
      width: PDF_PAGE_WIDTH,
      height: PDF_PAGE_HEIGHT,
      color: rgb(1, 1, 1),
    });

    const fitted = fitImageToPdfPage(image.width, image.height);
    pdfPage.drawImage(image, {
      x: fitted.x,
      y: fitted.y,
      width: fitted.width,
      height: fitted.height,
    });

    if (text) {
      const lines = sanitizePdfText(text)
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean);
      const fontSize = Math.max(6, Math.min(10, fitted.width / 90));
      let y = fitted.y + fitted.height - fontSize * 1.4;
      for (const line of lines.slice(0, 400)) {
        try {
          pdfPage.drawText(line.slice(0, 180), {
            x: fitted.x + 8,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
            opacity: 0.01,
          });
        } catch {
          // skip lines with unsupported glyphs
        }
        y -= fontSize * 1.2;
        if (y < fitted.y + 8) break;
      }
    }
  }

  return doc.save({ useObjectStreams: true });
}
