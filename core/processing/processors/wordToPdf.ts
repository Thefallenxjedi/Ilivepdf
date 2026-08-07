import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import mammoth from "mammoth";
import type { ProcessRequest, ProcessResult, Processor } from "../types";
import { convertWithLibreOffice } from "../officeConvert";

function wrapText(text: string, maxChars: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function wordToPdfFallback(bytes: Uint8Array): Promise<Uint8Array> {
  const result = await mammoth.extractRawText({ buffer: Buffer.from(bytes) });
  const text = result.value.trim();
  if (!text) {
    throw new Error("Could not read text from this Word file.");
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const lineHeight = 16;
  const margin = 48;
  const pageWidth = 595;
  const pageHeight = 842;
  const maxWidth = pageWidth - margin * 2;
  const maxChars = Math.floor(maxWidth / (fontSize * 0.52));

  const paragraphs = text.split(/\n+/);
  const lines = paragraphs.flatMap((paragraph) => {
    if (!paragraph.trim()) return [""];
    return wrapText(paragraph.trim(), maxChars);
  });

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  for (const line of lines) {
    if (y < margin + lineHeight) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    if (line) {
      page.drawText(line, {
        x: margin,
        y,
        size: fontSize,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
    }
    y -= lineHeight;
  }

  return doc.save({ useObjectStreams: true });
}

export const wordToPdfProcessor: Processor = {
  id: "word-to-pdf",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one Word file.");
    }

    const file = request.files[0];
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".doc") && !lower.endsWith(".docx")) {
      throw new Error("Upload a .doc or .docx file.");
    }

    let bytes: Uint8Array;
    try {
      bytes = await convertWithLibreOffice(file.name, file.bytes, "pdf");
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("LibreOffice")) {
        bytes = await wordToPdfFallback(file.bytes);
      } else {
        throw error;
      }
    }

    return {
      files: [{ name: "document.pdf", bytes, mimeType: "application/pdf" }],
    };
  },
};
