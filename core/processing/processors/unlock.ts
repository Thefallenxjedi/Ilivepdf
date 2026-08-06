import { PDFDocument } from "@cantoo/pdf-lib";
import type { ProcessRequest, ProcessResult, Processor, UnlockOptions } from "../types";

export const unlockProcessor: Processor = {
  id: "unlock-pdf",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const options = request.options as UnlockOptions;
    const password = (options.password || "").trim();
    if (!password) {
      throw new Error("Enter the PDF password.");
    }

    let doc: PDFDocument;
    try {
      doc = await PDFDocument.load(request.files[0].bytes, {
        password,
        ignoreEncryption: false,
      });
    } catch {
      throw new Error("Could not unlock this PDF. Check the password.");
    }

    const bytes = await doc.save({ useObjectStreams: true });
    return {
      files: [{ name: "unlocked.pdf", bytes, mimeType: "application/pdf" }],
      meta: { pageCount: doc.getPageCount() },
    };
  },
};
