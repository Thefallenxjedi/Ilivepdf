import { createCanvas } from "@napi-rs/canvas";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export type RenderQuality = "balanced" | "high";

export async function renderPdfPages(
  bytes: Uint8Array,
  quality: RenderQuality,
  format: "jpeg" | "png",
) {
  const scale = quality === "high" ? 2 : 1.4;
  const loadingTask = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const files: Array<{ name: string; bytes: Uint8Array; mimeType: string }> = [];

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

    if (format === "png") {
      const png = canvas.toBuffer("image/png");
      files.push({
        name: `page-${pageNumber}.png`,
        bytes: new Uint8Array(png),
        mimeType: "image/png",
      });
    } else {
      const jpeg = canvas.toBuffer("image/jpeg", 85);
      files.push({
        name: `page-${pageNumber}.jpg`,
        bytes: new Uint8Array(jpeg),
        mimeType: "image/jpeg",
      });
    }
  }

  return {
    files,
    pageCount: pdf.numPages,
  };
}
