const MAX_THUMB_WIDTH = 160;

function setupPdfjsWorker(pdfjs: { GlobalWorkerOptions: { workerSrc: string }; version?: string }) {
  if (typeof window === "undefined") return;
  const version = pdfjs.version || "5.4.296";
  pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/legacy/build/pdf.worker.min.mjs`;
}

async function renderPageToDataUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  page: any,
  maxWidth = MAX_THUMB_WIDTH,
) {
  const viewport = page.getViewport({ scale: 1 });
  const scale = maxWidth / viewport.width;
  const scaled = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(scaled.width);
  canvas.height = Math.ceil(scaled.height);
  const context = canvas.getContext("2d");
  if (!context) return null;

  await page.render({
    canvasContext: context,
    viewport: scaled,
    canvas,
  }).promise;

  return canvas.toDataURL("image/jpeg", 0.72);
}

/** First-page preview for a PDF file list thumb. */
export async function renderPdfCoverThumb(file: File): Promise<string | null> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    setupPdfjsWorker(pdfjs);
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    const page = await pdf.getPage(1);
    return renderPageToDataUrl(page, 120);
  } catch {
    return null;
  }
}

/** All page previews for organize / delete / extract tools. */
export async function renderPdfPageThumbs(
  file: File,
  maxPages = 60,
): Promise<string[]> {
  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    setupPdfjsWorker(pdfjs);
    const data = new Uint8Array(await file.arrayBuffer());
    const pdf = await pdfjs.getDocument({ data }).promise;
    const count = Math.min(pdf.numPages, maxPages);
    const thumbs: string[] = [];

    for (let pageNumber = 1; pageNumber <= count; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const url = await renderPageToDataUrl(page, MAX_THUMB_WIDTH);
      thumbs.push(url || "");
    }

    return thumbs;
  } catch {
    return [];
  }
}

export function createImagePreviewUrl(file: File): string | null {
  if (!file.type.startsWith("image/")) return null;
  return URL.createObjectURL(file);
}
