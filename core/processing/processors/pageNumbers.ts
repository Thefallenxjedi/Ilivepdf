import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PageNumbersOptions, ProcessRequest, ProcessResult, Processor } from "../types";

export const pageNumbersProcessor: Processor = {
  id: "page-numbers",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const options = request.options as PageNumbersOptions;
    const startFrom = Number.isInteger(options.startFrom) ? options.startFrom : 1;
    const position = options.position || "bottom-center";

    const doc = await PDFDocument.load(request.files[0].bytes, {
      ignoreEncryption: true,
    });
    const font = await doc.embedFont(StandardFonts.Helvetica);

    doc.getPages().forEach((page, index) => {
      const label = String(startFrom + index);
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(label, 12);
      let x = (width - textWidth) / 2;
      let y = 24;

      if (position === "bottom-right") {
        x = width - textWidth - 24;
      }
      if (position === "top-center") {
        y = height - 28;
      }

      page.drawText(label, {
        x,
        y,
        size: 12,
        font,
        color: rgb(0.2, 0.2, 0.2),
      });
    });

    const bytes = await doc.save({ useObjectStreams: true });
    return {
      files: [{ name: "numbered.pdf", bytes, mimeType: "application/pdf" }],
      meta: { pageCount: doc.getPageCount(), startFrom },
    };
  },
};
