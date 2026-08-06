import { PDFDocument } from "pdf-lib";
import type { ProcessRequest, ProcessResult, Processor } from "../types";

function isJpeg(name: string, bytes: Uint8Array) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return true;
  return bytes[0] === 0xff && bytes[1] === 0xd8;
}

function isPng(name: string, bytes: Uint8Array) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return true;
  return (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  );
}

export const jpgToPdfProcessor: Processor = {
  id: "jpg-to-pdf",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (!request.files.length) {
      throw new Error("Upload one or more image files.");
    }

    const output = await PDFDocument.create();

    for (const file of request.files) {
      let image;
      if (isJpeg(file.name, file.bytes)) {
        image = await output.embedJpg(file.bytes);
      } else if (isPng(file.name, file.bytes)) {
        image = await output.embedPng(file.bytes);
      } else {
        throw new Error(`Unsupported image type: ${file.name}`);
      }

      const page = output.addPage([image.width, image.height]);
      page.drawImage(image, {
        x: 0,
        y: 0,
        width: image.width,
        height: image.height,
      });
    }

    const bytes = await output.save({ useObjectStreams: true });
    return {
      files: [{ name: "images.pdf", bytes, mimeType: "application/pdf" }],
      meta: { pageCount: output.getPageCount() },
    };
  },
};
