import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ProcessRequest, ProcessResult, Processor } from "../types";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 48;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

type TextStyle = "normal" | "bold" | "italic" | "boldItalic" | "code";

type InlineRun = {
  text: string;
  style: TextStyle;
};

type Block =
  | { type: "heading"; level: 1 | 2 | 3; runs: InlineRun[] }
  | { type: "paragraph"; runs: InlineRun[] }
  | { type: "listItem"; ordered: boolean; index: number; runs: InlineRun[] }
  | { type: "code"; lines: string[] }
  | { type: "quote"; runs: InlineRun[] }
  | { type: "hr" }
  | { type: "blank" };

function sanitizePdfText(input: string) {
  return input
    .replace(/\u0000/g, "")
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/\u2013|\u2014/g, "-")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, "?");
}

function parseInline(text: string): InlineRun[] {
  const runs: InlineRun[] = [];
  const pattern =
    /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text))) {
    if (match.index > last) {
      runs.push({ text: text.slice(last, match.index), style: "normal" });
    }

    if (match[2]) {
      runs.push({ text: match[2], style: "boldItalic" });
    } else if (match[3]) {
      runs.push({ text: match[3], style: "bold" });
    } else if (match[4]) {
      runs.push({ text: match[4], style: "italic" });
    } else if (match[5]) {
      runs.push({ text: match[5], style: "code" });
    } else if (match[6]) {
      runs.push({ text: `${match[6]} (${match[7]})`, style: "normal" });
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) {
    runs.push({ text: text.slice(last), style: "normal" });
  }

  return runs.length ? runs : [{ text, style: "normal" }];
}

function parseMarkdown(source: string): Block[] {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: Block[] = [];
  let i = 0;
  let orderedIndex = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      blocks.push({ type: "blank" });
      orderedIndex = 0;
      i += 1;
      continue;
    }

    if (/^```/.test(trimmed)) {
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i]);
        i += 1;
      }
      i += 1;
      blocks.push({ type: "code", lines: codeLines });
      orderedIndex = 0;
      continue;
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: "hr" });
      orderedIndex = 0;
      i += 1;
      continue;
    }

    const heading = /^(#{1,3})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = Math.min(3, heading[1].length) as 1 | 2 | 3;
      blocks.push({ type: "heading", level, runs: parseInline(heading[2].trim()) });
      orderedIndex = 0;
      i += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      blocks.push({
        type: "quote",
        runs: parseInline(trimmed.replace(/^>\s?/, "")),
      });
      orderedIndex = 0;
      i += 1;
      continue;
    }

    const unordered = /^[-*+]\s+(.*)$/.exec(trimmed);
    if (unordered) {
      blocks.push({
        type: "listItem",
        ordered: false,
        index: 0,
        runs: parseInline(unordered[1]),
      });
      orderedIndex = 0;
      i += 1;
      continue;
    }

    const ordered = /^(\d+)\.\s+(.*)$/.exec(trimmed);
    if (ordered) {
      orderedIndex += 1;
      blocks.push({
        type: "listItem",
        ordered: true,
        index: orderedIndex,
        runs: parseInline(ordered[2]),
      });
      i += 1;
      continue;
    }

    const paragraphLines = [trimmed];
    i += 1;
    while (i < lines.length) {
      const next = lines[i].trim();
      if (
        !next ||
        /^```/.test(next) ||
        /^(-{3,}|\*{3,}|_{3,})$/.test(next) ||
        /^#{1,3}\s+/.test(next) ||
        /^>\s?/.test(next) ||
        /^[-*+]\s+/.test(next) ||
        /^\d+\.\s+/.test(next)
      ) {
        break;
      }
      paragraphLines.push(next);
      i += 1;
    }

    blocks.push({ type: "paragraph", runs: parseInline(paragraphLines.join(" ")) });
    orderedIndex = 0;
  }

  return blocks;
}

function wrapRuns(
  runs: InlineRun[],
  fonts: Record<TextStyle, PDFFont>,
  size: number,
  maxWidth: number,
): InlineRun[][] {
  const lines: InlineRun[][] = [];
  let current: InlineRun[] = [];
  let currentWidth = 0;

  const pushLine = () => {
    if (current.length) lines.push(current);
    current = [];
    currentWidth = 0;
  };

  for (const run of runs) {
    const words = sanitizePdfText(run.text).split(/(\s+)/);
    for (const word of words) {
      if (!word) continue;
      const font = fonts[run.style] || fonts.normal;
      const width = font.widthOfTextAtSize(word, size);

      if (currentWidth + width > maxWidth && currentWidth > 0) {
        pushLine();
      }

      if (width > maxWidth && word.length > 1) {
        let chunk = "";
        for (const char of word) {
          const next = chunk + char;
          const nextWidth = font.widthOfTextAtSize(next, size);
          if (nextWidth > maxWidth && chunk) {
            current.push({ text: chunk, style: run.style });
            pushLine();
            chunk = char;
          } else {
            chunk = next;
          }
        }
        if (chunk) {
          current.push({ text: chunk, style: run.style });
          currentWidth = font.widthOfTextAtSize(chunk, size);
        }
        continue;
      }

      current.push({ text: word, style: run.style });
      currentWidth += width;
    }
  }

  pushLine();
  return lines.length ? lines : [[{ text: "", style: "normal" }]];
}

async function markdownToPdfBytes(markdown: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonts: Record<TextStyle, PDFFont> = {
    normal: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
    italic: await doc.embedFont(StandardFonts.HelveticaOblique),
    boldItalic: await doc.embedFont(StandardFonts.HelveticaBoldOblique),
    code: await doc.embedFont(StandardFonts.Courier),
  };

  let page: PDFPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - MARGIN;
  const color = rgb(0.15, 0.15, 0.18);
  const muted = rgb(0.35, 0.35, 0.4);

  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN) {
      page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - MARGIN;
    }
  };

  const drawRunsLine = (lineRuns: InlineRun[], size: number, xStart: number, textColor = color) => {
    let x = xStart;
    for (const run of lineRuns) {
      const font = fonts[run.style] || fonts.normal;
      page.drawText(run.text, {
        x,
        y,
        size,
        font,
        color: run.style === "code" ? muted : textColor,
      });
      x += font.widthOfTextAtSize(run.text, size);
    }
  };

  for (const block of parseMarkdown(markdown)) {
    if (block.type === "blank") {
      y -= 10;
      continue;
    }

    if (block.type === "hr") {
      ensureSpace(18);
      y -= 8;
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: PAGE_WIDTH - MARGIN, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.84),
      });
      y -= 14;
      continue;
    }

    if (block.type === "code") {
      const size = 10;
      const lineHeight = 14;
      const padding = 10;
      const blockHeight = block.lines.length * lineHeight + padding * 2;
      ensureSpace(blockHeight + 8);
      y -= 4;
      page.drawRectangle({
        x: MARGIN,
        y: y - blockHeight + lineHeight,
        width: CONTENT_WIDTH,
        height: blockHeight,
        color: rgb(0.95, 0.96, 0.98),
      });
      y -= padding;
      for (const codeLine of block.lines) {
        ensureSpace(lineHeight);
        page.drawText(sanitizePdfText(codeLine) || " ", {
          x: MARGIN + padding,
          y,
          size,
          font: fonts.code,
          color: muted,
        });
        y -= lineHeight;
      }
      y -= padding + 6;
      continue;
    }

    const size =
      block.type === "heading"
        ? block.level === 1
          ? 22
          : block.level === 2
            ? 17
            : 14
        : 11.5;
    const lineHeight = size * 1.35;
    const indent =
      block.type === "listItem" ? 18 : block.type === "quote" ? 16 : 0;
    const prefix =
      block.type === "listItem"
        ? block.ordered
          ? `${block.index}. `
          : "• "
        : "";

    const maxWidth = CONTENT_WIDTH - indent - (prefix ? fonts.normal.widthOfTextAtSize(prefix, size) : 0);
    const wrapped = wrapRuns(block.runs, fonts, size, maxWidth);

    if (block.type === "heading") y -= 6;
    if (block.type === "quote") {
      ensureSpace(wrapped.length * lineHeight + 8);
      page.drawRectangle({
        x: MARGIN,
        y: y - wrapped.length * lineHeight + lineHeight - 4,
        width: 3,
        height: wrapped.length * lineHeight + 4,
        color: rgb(0.12, 0.44, 0.92),
      });
    }

    for (let lineIndex = 0; lineIndex < wrapped.length; lineIndex += 1) {
      ensureSpace(lineHeight);
      const x = MARGIN + indent;
      if (lineIndex === 0 && prefix) {
        page.drawText(prefix, {
          x,
          y,
          size,
          font: fonts.normal,
          color,
        });
        drawRunsLine(
          wrapped[lineIndex],
          size,
          x + fonts.normal.widthOfTextAtSize(prefix, size),
          block.type === "quote" ? muted : color,
        );
      } else {
        drawRunsLine(wrapped[lineIndex], size, x, block.type === "quote" ? muted : color);
      }
      y -= lineHeight;
    }

    y -= block.type === "heading" ? 8 : 6;
  }

  if (doc.getPageCount() === 0) {
    doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  }

  return doc.save({ useObjectStreams: true });
}

export const markdownToPdfProcessor: Processor = {
  id: "markdown-to-pdf",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (!request.files.length) {
      throw new Error("Upload at least one Markdown file.");
    }

    const outputs = [];

    for (const file of request.files) {
      const lower = file.name.toLowerCase();
      if (!lower.endsWith(".md") && !lower.endsWith(".markdown") && !lower.endsWith(".txt")) {
        throw new Error(`"${file.name}" is not a Markdown file.`);
      }

      const markdown = new TextDecoder("utf-8").decode(file.bytes).trim();
      if (!markdown) {
        throw new Error(`"${file.name}" is empty.`);
      }

      const bytes = await markdownToPdfBytes(markdown);
      const base = file.name.replace(/\.[^/.]+$/, "") || "document";
      outputs.push({
        name: `${base}.pdf`,
        bytes,
        mimeType: "application/pdf",
      });
    }

    return {
      files: outputs,
      meta: { converted: outputs.length },
    };
  },
};
