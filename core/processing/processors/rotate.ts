import { PDFDocument, degrees } from "pdf-lib";
import type { ProcessRequest, ProcessResult, Processor, RotateOptions } from "../types";

export const rotateProcessor: Processor = {
  id: "rotate-pdf",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file to rotate.");
    }

    const options = request.options as RotateOptions;
    const angle = options.degrees;
    if (angle !== 90 && angle !== 180 && angle !== 270) {
      throw new Error("Choose 90, 180, or 270 degrees.");
    }

    const source = await PDFDocument.load(request.files[0].bytes, {
      ignoreEncryption: true,
    });
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, source.getPageIndices());

    for (const page of pages) {
      page.setRotation(degrees((page.getRotation().angle + angle) % 360));
      output.addPage(page);
    }

    const bytes = await output.save({ useObjectStreams: true });
    return {
      files: [{ name: "rotated.pdf", bytes, mimeType: "application/pdf" }],
      meta: { degrees: angle, pageCount: output.getPageCount() },
    };
  },
};
