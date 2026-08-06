import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";
import type { ProcessRequest, ProcessResult, Processor, WatermarkOptions } from "../types";

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

    const opacity = Math.min(0.5, Math.max(0.08, options.opacity || 0.2));
    const doc = await PDFDocument.load(request.files[0].bytes, {
      ignoreEncryption: true,
    });
    const font = await doc.embedFont(StandardFonts.HelveticaBold);

    for (const page of doc.getPages()) {
      const { width, height } = page.getSize();
      const size = Math.min(width, height) * 0.08;
      const textWidth = font.widthOfTextAtSize(text, size);

      page.drawText(text, {
        x: (width - textWidth) / 2,
        y: height / 2,
        size,
        font,
        color: rgb(0.45, 0.45, 0.45),
        opacity,
        rotate: degrees(35),
      });
    }

    const bytes = await doc.save({ useObjectStreams: true });
    return {
      files: [{ name: "watermarked.pdf", bytes, mimeType: "application/pdf" }],
      meta: { pageCount: doc.getPageCount() },
    };
  },
};
