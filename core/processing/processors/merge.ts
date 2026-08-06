import { PDFDocument } from "pdf-lib";
import type { MergeOptions, ProcessRequest, ProcessResult, Processor } from "../types";

export const mergeProcessor: Processor = {
  id: "merge-pdf",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length < 2) {
      throw new Error("Upload at least two PDF files to merge.");
    }

    const options = request.options as MergeOptions;
    const order =
      options.order && options.order.length === request.files.length
        ? options.order
        : request.files.map((_, index) => index);

    const merged = await PDFDocument.create();

    for (const index of order) {
      const file = request.files[index];
      if (!file) {
        throw new Error("Invalid merge order.");
      }

      const source = await PDFDocument.load(file.bytes, {
        ignoreEncryption: true,
      });
      const pages = await merged.copyPages(source, source.getPageIndices());
      pages.forEach((page) => merged.addPage(page));
    }

    const bytes = await merged.save({ useObjectStreams: true });

    return {
      files: [
        {
          name: "merged.pdf",
          bytes,
          mimeType: "application/pdf",
        },
      ],
      meta: {
        inputCount: request.files.length,
        pageCount: merged.getPageCount(),
      },
    };
  },
};
