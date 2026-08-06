import { PDFDocument } from "pdf-lib";
import type { OrganizeOptions, ProcessRequest, ProcessResult, Processor } from "../types";

export const organizeProcessor: Processor = {
  id: "organize-pdf",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const options = request.options as OrganizeOptions;
    const source = await PDFDocument.load(request.files[0].bytes, {
      ignoreEncryption: true,
    });
    const pageCount = source.getPageCount();
    const order = options.order;

    if (!order?.length || order.length !== pageCount) {
      throw new Error("Provide a full page order for every page.");
    }

    const unique = new Set(order);
    if (unique.size !== pageCount || order.some((index) => index < 0 || index >= pageCount)) {
      throw new Error("Page order is invalid.");
    }

    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, order);
    pages.forEach((page) => output.addPage(page));

    const bytes = await output.save({ useObjectStreams: true });
    return {
      files: [{ name: "organized.pdf", bytes, mimeType: "application/pdf" }],
      meta: { pageCount },
    };
  },
};
