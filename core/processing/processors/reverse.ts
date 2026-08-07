import { PDFDocument } from "pdf-lib";
import type { ProcessRequest, ProcessResult, Processor } from "../types";

export const reverseProcessor: Processor = {
  id: "reverse-pdf",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const source = await PDFDocument.load(request.files[0].bytes, {
      ignoreEncryption: true,
    });
    const pageCount = source.getPageCount();
    if (pageCount < 2) {
      throw new Error("This PDF needs at least 2 pages to reverse.");
    }

    const order = source.getPageIndices().reverse();
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, order);
    pages.forEach((page) => output.addPage(page));

    const bytes = await output.save({ useObjectStreams: true });
    return {
      files: [{ name: "reversed.pdf", bytes, mimeType: "application/pdf" }],
      meta: { pageCount },
    };
  },
};
