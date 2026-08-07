const MAX_CHARS_PER_DOC = 120_000;

export async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

  if (typeof window !== "undefined") {
    const version = pdfjs.version || "5.4.296";
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${version}/legacy/build/pdf.worker.min.mjs`;
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = pdfjs.getDocument({ data });
  const pdf = await loadingTask.promise;
  const parts: string[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? String(item.str) : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    if (pageText) {
      parts.push(`Page ${pageNumber}: ${pageText}`);
    }

    if (parts.join("\n").length >= MAX_CHARS_PER_DOC) {
      break;
    }
  }

  const text = parts.join("\n\n").trim();
  if (text.length > MAX_CHARS_PER_DOC) {
    return `${text.slice(0, MAX_CHARS_PER_DOC)}\n\n[Document truncated for length.]`;
  }
  return text;
}
