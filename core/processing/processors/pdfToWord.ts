import { Document, Packer, Paragraph, TextRun } from "docx";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import type { ProcessRequest, ProcessResult, Processor } from "../types";
import { convertWithLibreOffice } from "../officeConvert";

async function pdfToWordFallback(bytes: Uint8Array): Promise<Uint8Array> {
  const loadingTask = getDocument({
    data: new Uint8Array(bytes),
    useSystemFonts: true,
  });
  const pdf = await loadingTask.promise;
  const paragraphs: Paragraph[] = [];

  for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
    const page = await pdf.getPage(pageNumber);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({
            text: text || `[Page ${pageNumber}]`,
            size: 22,
          }),
        ],
        spacing: { after: 240 },
      }),
    );
  }

  const doc = new Document({
    sections: [{ children: paragraphs }],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

export const pdfToWordProcessor: Processor = {
  id: "pdf-to-word",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const file = request.files[0];
    let bytes: Uint8Array;

    try {
      bytes = await convertWithLibreOffice(file.name.endsWith(".pdf") ? file.name : "input.pdf", file.bytes, "docx");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("LibreOffice")) {
        bytes = await pdfToWordFallback(file.bytes);
      } else {
        throw error;
      }
    }

    return {
      files: [
        {
          name: "document.docx",
          bytes,
          mimeType:
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        },
      ],
    };
  },
};
