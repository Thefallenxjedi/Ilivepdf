import { PDFDocument } from "pdf-lib";
import { parsePageRanges } from "../pageRanges";
import type { ProcessRequest, ProcessResult, Processor, SplitOptions } from "../types";

export const splitProcessor: Processor = {
  id: "split-pdf",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file to split.");
    }

    const options = request.options as SplitOptions;
    const sourceFile = request.files[0];
    const source = await PDFDocument.load(sourceFile.bytes, {
      ignoreEncryption: true,
    });
    const pageCount = source.getPageCount();

    if (options.mode === "every-page") {
      const files = [];

      for (let index = 0; index < pageCount; index += 1) {
        const doc = await PDFDocument.create();
        const [page] = await doc.copyPages(source, [index]);
        doc.addPage(page);
        const bytes = await doc.save({ useObjectStreams: true });
        files.push({
          name: `page-${index + 1}.pdf`,
          bytes,
          mimeType: "application/pdf",
        });
      }

      return {
        files,
        meta: {
          pageCount,
          outputCount: files.length,
        },
      };
    }

    const indices = parsePageRanges(options.ranges ?? "", pageCount);
    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(source, indices);
    pages.forEach((page) => doc.addPage(page));
    const bytes = await doc.save({ useObjectStreams: true });

    return {
      files: [
        {
          name: "split.pdf",
          bytes,
          mimeType: "application/pdf",
        },
      ],
      meta: {
        pageCount,
        extractedPages: indices.length,
      },
    };
  },
};
