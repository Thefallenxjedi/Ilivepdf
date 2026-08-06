import { PDFDocument } from "pdf-lib";
import { parsePageRanges } from "../pageRanges";
import type { DeletePagesOptions, ProcessRequest, ProcessResult, Processor } from "../types";

export const deletePagesProcessor: Processor = {
  id: "delete-pages",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const options = request.options as DeletePagesOptions;
    const source = await PDFDocument.load(request.files[0].bytes, {
      ignoreEncryption: true,
    });
    const pageCount = source.getPageCount();
    const remove = new Set(parsePageRanges(options.ranges, pageCount));

    if (remove.size >= pageCount) {
      throw new Error("You cannot delete every page.");
    }

    const keep = source.getPageIndices().filter((index) => !remove.has(index));
    const output = await PDFDocument.create();
    const pages = await output.copyPages(source, keep);
    pages.forEach((page) => output.addPage(page));

    const bytes = await output.save({ useObjectStreams: true });
    return {
      files: [{ name: "pages-removed.pdf", bytes, mimeType: "application/pdf" }],
      meta: { removed: remove.size, pageCount: output.getPageCount() },
    };
  },
};
