import { renderPdfPages } from "../renderPdfPages";
import type { PdfToJpgOptions, ProcessRequest, ProcessResult, Processor } from "../types";

export const pdfToJpgProcessor: Processor = {
  id: "pdf-to-jpg",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const options = request.options as PdfToJpgOptions;
    const quality = options.quality ?? "balanced";
    const rendered = await renderPdfPages(request.files[0].bytes, quality, "jpeg");

    return {
      files: rendered.files,
      meta: {
        pageCount: rendered.pageCount,
        outputCount: rendered.files.length,
      },
    };
  },
};

export const pdfToPngProcessor: Processor = {
  id: "pdf-to-png",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const options = request.options as PdfToJpgOptions;
    const quality = options.quality ?? "balanced";
    const rendered = await renderPdfPages(request.files[0].bytes, quality, "png");

    return {
      files: rendered.files,
      meta: {
        pageCount: rendered.pageCount,
        outputCount: rendered.files.length,
      },
    };
  },
};
