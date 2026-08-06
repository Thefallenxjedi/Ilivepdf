import { PDFDocument } from "pdf-lib";
import { parsePageRanges } from "../pageRanges";
import type { ExtractPagesOptions, ProcessRequest, ProcessResult, Processor } from "../types";

export const extractPagesProcessor: Processor = {
  id: "extract-pages",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const options = request.options as ExtractPagesOptions;
    const source = await PDFDocument.load(request.files[0].bytes, {
      ignoreEncryption: true,
    });
    const indices = parsePageRanges(options.ranges, source.getPageCount());
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, indices);
    pages.forEach((page) => output.addPage(page));

    const bytes = await output.save({ useObjectStreams: true });
    return {
      files: [{ name: "extracted.pdf", bytes, mimeType: "application/pdf" }],
      meta: { extractedPages: indices.length },
    };
  },
};
