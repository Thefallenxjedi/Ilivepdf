import { PDFDocument } from "@cantoo/pdf-lib";
import type { ProcessRequest, ProcessResult, Processor, ProtectOptions } from "../types";

export const protectProcessor: Processor = {
  id: "protect-pdf",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const options = request.options as ProtectOptions;
    const password = (options.password || "").trim();
    if (password.length < 4) {
      throw new Error("Use a password with at least 4 characters.");
    }

    const doc = await PDFDocument.load(request.files[0].bytes, {
      ignoreEncryption: true,
    });

    doc.encrypt({
      userPassword: password,
      ownerPassword: password,
    });

    const bytes = await doc.save({ useObjectStreams: false });

    return {
      files: [{ name: "protected.pdf", bytes, mimeType: "application/pdf" }],
      meta: { pageCount: doc.getPageCount() },
    };
  },
};
