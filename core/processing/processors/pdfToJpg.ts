import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { ProcessRequest, ProcessResult, Processor, PdfToJpgOptions } from "../types";

export const pdfToJpgProcessor: Processor = {
  id: "pdf-to-jpg",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const options = request.options as PdfToJpgOptions;
    const scale = options.quality === "high" ? 2 : 1.4;
    const data = new Uint8Array(request.files[0].bytes);

    const loadingTask = getDocument({
      data,
      useSystemFonts: true,
    });
    const pdf = await loadingTask.promise;
    const files = [];

    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale });
      const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
      const context = canvas.getContext("2d");

      await page.render({
        canvas: canvas as unknown as HTMLCanvasElement,
        canvasContext: context as unknown as CanvasRenderingContext2D,
        viewport,
      }).promise;

      const jpeg = canvas.toBuffer("image/jpeg", 85);
      files.push({
        name: `page-${pageNumber}.jpg`,
        bytes: new Uint8Array(jpeg),
        mimeType: "image/jpeg",
      });
    }

    return {
      files,
      meta: { pageCount: pdf.numPages, outputCount: files.length },
    };
  },
};
