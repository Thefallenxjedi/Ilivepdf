import { PDFDocument } from "pdf-lib";
import type { CompressOptions, ProcessRequest, ProcessResult, Processor } from "../types";

export const compressProcessor: Processor = {
  id: "compress-pdf",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file to compress.");
    }

    const options = request.options as CompressOptions;
    const level = options.level ?? "balanced";
    const sourceFile = request.files[0];
    const originalSize = sourceFile.bytes.byteLength;

    const source = await PDFDocument.load(sourceFile.bytes, {
      ignoreEncryption: true,
      updateMetadata: false,
    });

    const output = await PDFDocument.create();
    output.setTitle("");
    output.setAuthor("");
    output.setSubject("");
    output.setKeywords([]);
    output.setProducer("iLivePDF");
    output.setCreator("iLivePDF");

    const pages = await output.copyPages(source, source.getPageIndices());
    pages.forEach((page) => output.addPage(page));

    // Level currently controls how aggressively we rewrite structure.
    // Balanced/high keep full page fidelity; strong forces a second pass cleanup.
    let finalBytes = await output.save({
      useObjectStreams: true,
      addDefaultPage: false,
      objectsPerTick: level === "high" ? 50 : 20,
    });

    if (level === "strong") {
      const second = await PDFDocument.load(finalBytes, {
        ignoreEncryption: true,
        updateMetadata: false,
      });
      second.setTitle("");
      second.setAuthor("");
      second.setSubject("");
      second.setKeywords([]);
      finalBytes = await second.save({
        useObjectStreams: true,
        addDefaultPage: false,
      });
    }

    return {
      files: [
        {
          name: "compressed.pdf",
          bytes: finalBytes,
          mimeType: "application/pdf",
        },
      ],
      meta: {
        originalBytes: originalSize,
        compressedBytes: finalBytes.byteLength,
        savedBytes: Math.max(0, originalSize - finalBytes.byteLength),
        level,
      },
    };
  },
};
