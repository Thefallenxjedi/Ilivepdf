import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import type { ProcessRequest, ProcessResult, Processor } from "../types";
import { convertWithLibreOffice } from "../officeConvert";

async function pptToPdfFallback(bytes: Uint8Array): Promise<Uint8Array> {
  const zip = await JSZip.loadAsync(bytes);
  const mediaFiles = Object.keys(zip.files)
    .filter((name) => name.startsWith("ppt/media/"))
    .sort();

  if (!mediaFiles.length) {
    throw new Error(
      "Could not convert this PowerPoint file without LibreOffice. Install LibreOffice for full PPT support.",
    );
  }

  const output = await PDFDocument.create();

  for (const path of mediaFiles) {
    const entry = zip.file(path);
    if (!entry) continue;
    const imageBytes = new Uint8Array(await entry.async("uint8array"));
    const lower = path.toLowerCase();

    let image;
    if (lower.endsWith(".png")) {
      image = await output.embedPng(imageBytes);
    } else if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) {
      image = await output.embedJpg(imageBytes);
    } else {
      continue;
    }

    const page = output.addPage([image.width, image.height]);
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: image.width,
      height: image.height,
    });
  }

  if (output.getPageCount() === 0) {
    throw new Error(
      "No convertible slide images found. Install LibreOffice for full PPT support.",
    );
  }

  return output.save({ useObjectStreams: true });
}

export const pptToPdfProcessor: Processor = {
  id: "ppt-to-pdf",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PowerPoint file.");
    }

    const file = request.files[0];
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".ppt") && !lower.endsWith(".pptx")) {
      throw new Error("Upload a .ppt or .pptx file.");
    }

    let bytes: Uint8Array;
    try {
      bytes = await convertWithLibreOffice(file.name, file.bytes, "pdf");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("LibreOffice")) {
        bytes = await pptToPdfFallback(file.bytes);
      } else {
        throw error;
      }
    }

    return {
      files: [{ name: "presentation.pdf", bytes, mimeType: "application/pdf" }],
    };
  },
};
