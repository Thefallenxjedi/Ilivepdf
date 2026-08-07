import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { PageNumbersOptions, ProcessRequest, ProcessResult, Processor } from "../types";

function toRoman(value: number) {
  if (value <= 0) return String(value);
  const map: Array<[number, string]> = [
    [1000, "m"],
    [900, "cm"],
    [500, "d"],
    [400, "cd"],
    [100, "c"],
    [90, "xc"],
    [50, "l"],
    [40, "xl"],
    [10, "x"],
    [9, "ix"],
    [5, "v"],
    [4, "iv"],
    [1, "i"],
  ];
  let remaining = value;
  let out = "";
  for (const [num, glyph] of map) {
    while (remaining >= num) {
      out += glyph;
      remaining -= num;
    }
  }
  return out;
}

function toLetter(value: number) {
  if (value <= 0) return String(value);
  let n = value;
  let out = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    out = String.fromCharCode(65 + rem) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function formatPageLabel(
  format: PageNumbersOptions["format"],
  displayNumber: number,
  pageIndex: number,
  totalPages: number,
) {
  switch (format) {
    case "roman":
      return toRoman(displayNumber);
    case "letter":
      return toLetter(displayNumber);
    case "page-label":
      return `Page ${displayNumber}`;
    case "page-of":
      return `${displayNumber} / ${totalPages}`;
    case "numeric":
    default:
      return String(displayNumber);
  }
}

function parseColor(hex: string) {
  const cleaned = hex.replace("#", "").trim();
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((char) => char + char)
          .join("")
      : cleaned.padEnd(6, "0").slice(0, 6);
  const value = Number.parseInt(full, 16);
  if (Number.isNaN(value)) return rgb(0.2, 0.2, 0.2);
  return rgb(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}

function positionCoords(
  position: PageNumbersOptions["position"],
  width: number,
  height: number,
  textWidth: number,
  fontSize: number,
) {
  const margin = 24;
  let x = (width - textWidth) / 2;
  let y = margin;

  if (position.startsWith("top")) {
    y = height - margin - fontSize * 0.2;
  }

  if (position.endsWith("left")) {
    x = margin;
  } else if (position.endsWith("right")) {
    x = width - textWidth - margin;
  }

  return { x, y };
}

export const pageNumbersProcessor: Processor = {
  id: "page-numbers",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const options = request.options as PageNumbersOptions;
    const startFrom = Number.isInteger(options.startFrom) ? Math.max(1, options.startFrom) : 1;
    const position = options.position || "bottom-center";
    const format = options.format || "numeric";
    const fontSize = Math.min(72, Math.max(8, options.fontSize ?? 10));
    const skipFirst = Boolean(options.skipFirst);
    const bold = options.weight === "bold";
    const color = parseColor(options.color || "#333333");

    const doc = await PDFDocument.load(request.files[0].bytes, {
      ignoreEncryption: true,
    });
    const font = await doc.embedFont(bold ? StandardFonts.HelveticaBold : StandardFonts.Helvetica);
    const pages = doc.getPages();
    const totalPages = pages.length;

    pages.forEach((page, index) => {
      if (skipFirst && index === 0) return;

      const numberedIndex = skipFirst ? index - 1 : index;
      const displayNumber = startFrom + numberedIndex;
      const label = formatPageLabel(format, displayNumber, index, totalPages);
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(label, fontSize);
      const { x, y } = positionCoords(position, width, height, textWidth, fontSize);

      page.drawText(label, {
        x,
        y,
        size: fontSize,
        font,
        color,
      });
    });

    const bytes = await doc.save({ useObjectStreams: true });
    return {
      files: [{ name: "numbered.pdf", bytes, mimeType: "application/pdf" }],
      meta: { pageCount: totalPages, startFrom, format, position },
    };
  },
};
