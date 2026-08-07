"use client";

import { PDFDocument } from "pdf-lib";
import { useEffect, useMemo, useRef, useState } from "react";
import { ToolIcon } from "@/components/ToolIcon";
import { FilePreviewThumb } from "@/components/FilePreviewThumb";
import { PdfPagesPreview } from "@/components/PdfPagesPreview";
import type { ToolConfig } from "@/config/tools";
import {
  defaultOutputBaseName,
  sanitizeBaseName,
} from "@/core/application/outputName";
import { downloadBlob } from "@/core/application/download";

type ToolWorkspaceProps = {
  tool: ToolConfig;
};

type LocalFile = {
  id: string;
  file: File;
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function toolHeadline(tool: ToolConfig) {
  if (tool.id === "merge-pdf") return "Merge PDF files online";
  if (tool.id === "split-pdf") return "Split a PDF online";
  if (tool.id === "compress-pdf") return "Compress a PDF online";
  if (tool.id === "rotate-pdf") return "Rotate a PDF online";
  if (tool.id === "reverse-pdf") return "Reverse PDF page order";
  if (tool.id === "delete-pages") return "Delete PDF pages online";
  if (tool.id === "extract-pages") return "Extract PDF pages online";
  if (tool.id === "organize-pdf") return "Organize PDF pages online";
  if (tool.id === "page-numbers") return "Add PDF page numbers";
  if (tool.id === "watermark-pdf") return "Watermark a PDF online";
  if (tool.id === "protect-pdf") return "Password protect a PDF";
  if (tool.id === "unlock-pdf") return "Unlock a PDF online";
  if (tool.id === "jpg-to-pdf") return "Convert JPG to PDF";
  if (tool.id === "png-to-pdf") return "Convert PNG to PDF";
  if (tool.id === "pdf-to-jpg") return "Convert PDF to JPG";
  if (tool.id === "pdf-to-png") return "Convert PDF to PNG";
  if (tool.id === "word-to-pdf") return "Convert Word to PDF";
  if (tool.id === "pdf-to-word") return "Convert PDF to Word";
  if (tool.id === "ppt-to-pdf") return "Convert PPT to PDF";
  if (tool.id === "pdf-to-ppt") return "Convert PDF to PPT";
  if (tool.id === "markdown-to-pdf") return "Convert Markdown to PDF";
  if (tool.id === "chat-pdf") return "Chat with PDF online";
  if (tool.id === "summarize-pdf") return "Summarize a PDF online";
  return tool.name;
}

function acceptsFile(tool: ToolConfig, file: File) {
  const name = file.name.toLowerCase();
  if (tool.id === "jpg-to-pdf") {
    return (
      file.type.startsWith("image/") ||
      name.endsWith(".jpg") ||
      name.endsWith(".jpeg") ||
      name.endsWith(".png")
    );
  }
  if (tool.id === "png-to-pdf") {
    return file.type === "image/png" || name.endsWith(".png");
  }
  if (tool.id === "word-to-pdf") {
    return (
      name.endsWith(".doc") ||
      name.endsWith(".docx") ||
      file.type.includes("word") ||
      file.type.includes("msword")
    );
  }
  if (tool.id === "ppt-to-pdf") {
    return (
      name.endsWith(".ppt") ||
      name.endsWith(".pptx") ||
      file.type.includes("presentation") ||
      file.type.includes("powerpoint")
    );
  }
  if (tool.id === "markdown-to-pdf") {
    return (
      name.endsWith(".md") ||
      name.endsWith(".markdown") ||
      name.endsWith(".txt") ||
      file.type.includes("markdown") ||
      file.type === "text/plain"
    );
  }
  return file.type === "application/pdf" || name.endsWith(".pdf");
}

export function ToolWorkspace({ tool }: ToolWorkspaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [splitMode, setSplitMode] = useState<"ranges" | "every-page">("ranges");
  const [ranges, setRanges] = useState("1-2");
  const [compressLevel, setCompressLevel] = useState<"strong" | "balanced" | "high">(
    "balanced",
  );
  const [degrees, setDegrees] = useState<90 | 180 | 270>(90);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [pagePosition, setPagePosition] = useState<
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right"
  >("bottom-center");
  const [startFrom, setStartFrom] = useState(1);
  const [pageNumberFormat, setPageNumberFormat] = useState<
    "numeric" | "roman" | "letter" | "page-label" | "page-of"
  >("numeric");
  const [pageNumberFontSize, setPageNumberFontSize] = useState(10);
  const [pageNumberSkipFirst, setPageNumberSkipFirst] = useState(false);
  const [pageNumberColor, setPageNumberColor] = useState("#333333");
  const [pageNumberCustomColor, setPageNumberCustomColor] = useState("#333333");
  const [pageNumberWeight, setPageNumberWeight] = useState<"regular" | "bold">("regular");
  const pageNumberColors = [
    "#333333",
    "#111111",
    "#e11d48",
    "#2563eb",
    "#16a34a",
    "#7c3aed",
    "#ea580c",
  ] as const;
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [watermarkPattern, setWatermarkPattern] = useState<"single" | "diagonal" | "grid">(
    "diagonal",
  );
  const [watermarkOpacity, setWatermarkOpacity] = useState(15);
  const [watermarkFontSize, setWatermarkFontSize] = useState(48);
  const [watermarkGapX, setWatermarkGapX] = useState(200);
  const [watermarkGapY, setWatermarkGapY] = useState(200);
  const [watermarkColor, setWatermarkColor] = useState("#8a8a8a");
  const [watermarkCustomColor, setWatermarkCustomColor] = useState("#8a8a8a");
  const watermarkPresets = ["CONFIDENTIAL", "DRAFT", "COPY", "© 2025"] as const;
  const watermarkColors = [
    "#8a8a8a",
    "#111111",
    "#e11d48",
    "#2563eb",
    "#16a34a",
    "#7c3aed",
    "#ea580c",
  ] as const;
  const [password, setPassword] = useState("");
  const [jpgQuality, setJpgQuality] = useState<"balanced" | "high">("balanced");
  const [outputName, setOutputName] = useState("document");
  const [resultMeta, setResultMeta] = useState<string | null>(null);
  const [markdownPaste, setMarkdownPaste] = useState("");
  const isMarkdownTool = tool.id === "markdown-to-pdf";

  useEffect(() => {
    let cancelled = false;

    async function loadPageOrder() {
      if (tool.id !== "organize-pdf" || files.length !== 1) {
        setPageOrder([]);
        return;
      }

      try {
        const bytes = new Uint8Array(await files[0].file.arrayBuffer());
        const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
        if (!cancelled) {
          setPageOrder(doc.getPageIndices());
        }
      } catch {
        if (!cancelled) {
          setError("Could not read page order from this PDF.");
          setPageOrder([]);
        }
      }
    }

    void loadPageOrder();
    return () => {
      cancelled = true;
    };
  }, [files, tool.id]);

  const canProcess = useMemo(() => {
    if (isMarkdownTool) {
      const pasteCount = markdownPaste.trim() ? 1 : 0;
      const total = files.length + pasteCount;
      if (total < 1 || total > tool.maxFiles) return false;
      if (!sanitizeBaseName(outputName)) return false;
      return true;
    }

    if (files.length < tool.minFiles || files.length > tool.maxFiles) return false;
    if (tool.id === "split-pdf" && splitMode === "ranges" && !ranges.trim()) return false;
    if (
      (tool.id === "delete-pages" || tool.id === "extract-pages") &&
      !ranges.trim()
    ) {
      return false;
    }
    if (tool.id === "organize-pdf" && pageOrder.length === 0) return false;
    if (tool.id === "watermark-pdf" && !watermarkText.trim()) return false;
    if ((tool.id === "protect-pdf" || tool.id === "unlock-pdf") && password.trim().length < 1) {
      return false;
    }
    if (tool.id === "protect-pdf" && password.trim().length < 4) return false;
    if (!sanitizeBaseName(outputName)) return false;
    return true;
  }, [
    files.length,
    isMarkdownTool,
    markdownPaste,
    outputName,
    pageOrder.length,
    password,
    ranges,
    splitMode,
    tool.id,
    tool.maxFiles,
    tool.minFiles,
    watermarkText,
  ]);

  function addFiles(list: FileList | null) {
    if (!list?.length) return;

    const next = Array.from(list)
      .filter((file) => acceptsFile(tool, file))
      .map((file) => ({
        id: `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`,
        file,
      }));

    if (!next.length) {
      setError(
        tool.id === "jpg-to-pdf" || tool.id === "png-to-pdf"
          ? "Please choose supported image files only."
          : tool.id === "word-to-pdf"
            ? "Please choose a Word (.doc or .docx) file."
            : tool.id === "ppt-to-pdf"
              ? "Please choose a PowerPoint (.ppt or .pptx) file."
              : tool.id === "markdown-to-pdf"
                ? "Please choose Markdown (.md) or text files."
                : "Please choose PDF files only.",
      );
      return;
    }

    setError(null);
    setResultMeta(null);
    setFiles((current) => {
      const combined = tool.maxFiles === 1 ? next.slice(0, 1) : [...current, ...next];
      const limited = combined.slice(0, tool.maxFiles);
      setOutputName(
        defaultOutputBaseName(
          tool.id,
          limited.map((item) => item.file),
        ),
      );
      return limited;
    });
  }

  function moveFile(id: string, direction: -1 | 1) {
    setFiles((current) => {
      const index = current.findIndex((item) => item.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }

  function movePage(index: number, direction: -1 | 1) {
    setPageOrder((current) => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const copy = [...current];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      return copy;
    });
  }

  function removeFile(id: string) {
    setFiles((current) => {
      const next = current.filter((item) => item.id !== id);
      if (next.length === 0) {
        setOutputName("document");
      } else {
        setOutputName(
          defaultOutputBaseName(
            tool.id,
            next.map((item) => item.file),
          ),
        );
      }
      return next;
    });
  }

  async function processFiles() {
    if (!canProcess || busy) return;

    setBusy(true);
    setError(null);
    setResultMeta(null);

    try {
      const formData = new FormData();
      formData.set("toolId", tool.id);
      files.forEach((item) => formData.append("files", item.file));

      if (isMarkdownTool && markdownPaste.trim()) {
        const pasteFile = new File([markdownPaste], `${sanitizeBaseName(outputName, "pasted")}.md`, {
          type: "text/markdown",
        });
        formData.append("files", pasteFile);
      }

      if (tool.id === "merge-pdf") {
        formData.set(
          "order",
          files.map((_, index) => index).join(","),
        );
      }
      if (tool.id === "split-pdf") {
        formData.set("mode", splitMode);
        formData.set("ranges", ranges);
      }
      if (tool.id === "compress-pdf") formData.set("level", compressLevel);
      if (tool.id === "rotate-pdf") formData.set("degrees", String(degrees));
      if (tool.id === "delete-pages" || tool.id === "extract-pages") {
        formData.set("ranges", ranges);
      }
      if (tool.id === "organize-pdf") formData.set("order", pageOrder.join(","));
      if (tool.id === "page-numbers") {
        formData.set("position", pagePosition);
        formData.set("startFrom", String(startFrom));
        formData.set("format", pageNumberFormat);
        formData.set("fontSize", String(pageNumberFontSize));
        formData.set("skipFirst", String(pageNumberSkipFirst));
        formData.set("color", pageNumberColor);
        formData.set("weight", pageNumberWeight);
      }
      if (tool.id === "watermark-pdf") {
        formData.set("text", watermarkText);
        formData.set("pattern", watermarkPattern);
        formData.set("opacity", String(watermarkOpacity));
        formData.set("fontSize", String(watermarkFontSize));
        formData.set("gapX", String(watermarkGapX));
        formData.set("gapY", String(watermarkGapY));
        formData.set("color", watermarkColor);
      }
      if (tool.id === "protect-pdf" || tool.id === "unlock-pdf") {
        formData.set("password", password);
      }
      if (tool.id === "pdf-to-jpg" || tool.id === "pdf-to-png") {
        formData.set("quality", jpgQuality);
      }

      const response = await fetch("/api/process", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(payload?.error || "Processing failed.");
      }

      const blob = await response.blob();
      const disposition = response.headers.get("Content-Disposition") || "";
      const matched = disposition.match(/filename="([^"]+)"/);
      const serverFilename = matched?.[1] || `${tool.id}-output`;
      const savedAs = downloadBlob(blob, outputName, serverFilename);
      const metaHeader = response.headers.get("X-iLivePDF-Meta");

      if (metaHeader) {
        try {
          const meta = JSON.parse(metaHeader) as Record<string, string | number>;
          if (tool.id === "compress-pdf") {
            setResultMeta(
              `Saved as ${savedAs} · Original ${formatBytes(
                Number(meta.originalBytes || 0),
              )} → ${formatBytes(Number(meta.compressedBytes || 0))}`,
            );
          } else if (meta.outputCount) {
            setResultMeta(`Saved as ${savedAs} · ${meta.outputCount} file(s)`);
          } else if (meta.pageCount) {
            setResultMeta(`Saved as ${savedAs} · ${meta.pageCount} page(s)`);
          } else {
            setResultMeta(`Saved as ${savedAs}`);
          }
        } catch {
          setResultMeta(`Saved as ${savedAs}`);
        }
      } else {
        setResultMeta(`Saved as ${savedAs}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Processing failed.");
    } finally {
      setBusy(false);
    }
  }

  const hasFiles = files.length > 0;
  const selectLabel =
    tool.id === "jpg-to-pdf" || tool.id === "png-to-pdf"
      ? "Select image files"
      : tool.id === "word-to-pdf"
        ? "Select Word file"
        : tool.id === "ppt-to-pdf"
          ? "Select PowerPoint file"
          : tool.id === "markdown-to-pdf"
            ? "Select Markdown files"
            : "Select PDF files";
  const dropHint =
    tool.id === "jpg-to-pdf" || tool.id === "png-to-pdf"
      ? "or drop images here"
      : tool.id === "word-to-pdf"
        ? "or drop a Word file here"
        : tool.id === "ppt-to-pdf"
          ? "or drop a PowerPoint file here"
          : tool.id === "markdown-to-pdf"
            ? "or drop Markdown files here"
            : "or drop PDFs here";
  const thumbLabel =
    tool.id === "jpg-to-pdf" || tool.id === "png-to-pdf"
      ? "IMG"
      : tool.id === "word-to-pdf"
        ? "DOC"
        : tool.id === "ppt-to-pdf"
          ? "PPT"
          : tool.id === "markdown-to-pdf"
            ? "MD"
            : "PDF";

  return (
    <section className="tool-workspace">
      <div className="tool-hero">
        <ToolIcon
          className="tool-hero-icon"
          toolId={tool.id}
          title={tool.name}
          size={64}
        />
        <h1>{toolHeadline(tool)}</h1>
        <p>{tool.detail}</p>
      </div>

      {isMarkdownTool ? (
        <div className="tool-panel">
          <div className="settings-block">
            <h3>Paste Markdown</h3>
            <p className="settings-help">
              Paste your Markdown here, upload a .md file, or use both. Then download as PDF.
            </p>
            <label className="field">
              <span className="visually-hidden">Markdown content</span>
              <textarea
                className="markdown-paste"
                value={markdownPaste}
                onChange={(event) => {
                  setMarkdownPaste(event.target.value);
                  setError(null);
                  setResultMeta(null);
                  if (!files.length && event.target.value.trim() && outputName === "document") {
                    setOutputName("pasted");
                  }
                }}
                placeholder={"# Title\n\nPaste Markdown here..."}
                rows={12}
                spellCheck={false}
              />
            </label>
          </div>

          <div className="panel-top">
            <div>
              <h2>Or upload Markdown files</h2>
              <p>Optional .md / .markdown / .txt files (up to {tool.maxFiles}).</p>
            </div>
            <button
              type="button"
              className="add-more-btn"
              onClick={() => inputRef.current?.click()}
            >
              {hasFiles ? "Add more" : "Select files"}
            </button>
          </div>

          {hasFiles ? (
            <div className="file-list">
              {files.map((item, index) => (
                <div className="file-row" key={item.id}>
                  <FilePreviewThumb file={item.file} fallbackLabel="MD" />
                  <div className="file-meta">
                    <strong>
                      {index + 1}. {item.file.name}
                    </strong>
                    <span>{formatBytes(item.file.size)}</span>
                  </div>
                  <div className="file-actions">
                    <button type="button" onClick={() => moveFile(item.id, -1)}>
                      Up
                    </button>
                    <button type="button" onClick={() => moveFile(item.id, 1)}>
                      Down
                    </button>
                    <button type="button" onClick={() => removeFile(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className={dragging ? "action-stage is-dragging markdown-drop" : "action-stage markdown-drop"}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragOver={(event) => event.preventDefault()}
              onDragLeave={(event) => {
                event.preventDefault();
                if (event.currentTarget === event.target) setDragging(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                addFiles(event.dataTransfer.files);
              }}
            >
              <p className="drop-hint">Drop Markdown files here</p>
            </div>
          )}

          {error ? <p className="tool-error">{error}</p> : null}
          {resultMeta ? <p className="tool-success">{resultMeta}</p> : null}

          <div className="settings-block download-name-block">
            <h3>Download name</h3>
            <label className="field">
              <span>File name</span>
              <input
                value={outputName}
                onChange={(event) => setOutputName(event.target.value)}
                placeholder="Enter a file name"
                aria-label="Download file name"
              />
            </label>
            <p className="settings-help">
              Name it here, then press download. The file is saved automatically with this
              name.
            </p>
          </div>

          <button
            type="button"
            className="process-btn"
            disabled={!canProcess || busy}
            onClick={processFiles}
          >
            {busy ? "Downloading..." : "Download PDF"}
          </button>
        </div>
      ) : !hasFiles ? (
        <div
          className={dragging ? "action-stage is-dragging" : "action-stage"}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => {
            event.preventDefault();
            if (event.currentTarget === event.target) setDragging(false);
          }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            addFiles(event.dataTransfer.files);
          }}
        >
          <button
            type="button"
            className="select-files-btn"
            onClick={() => inputRef.current?.click()}
          >
            {selectLabel}
          </button>
          <p className="drop-hint">{dropHint}</p>
        </div>
      ) : (
        <div className="tool-panel">
          <div className="panel-top">
            <div>
              <h2>Selected files</h2>
              <p>
                {tool.maxFiles === 1
                  ? "Review your file, then continue."
                  : "Reorder files if needed, then continue."}
              </p>
            </div>
            <button
              type="button"
              className="add-more-btn"
              onClick={() => inputRef.current?.click()}
            >
              {tool.maxFiles === 1 ? "Replace file" : "Add more"}
            </button>
          </div>

          <div className="file-list">
            {files.map((item, index) => (
              <div className="file-row" key={item.id}>
                <FilePreviewThumb file={item.file} fallbackLabel={thumbLabel} />
                <div className="file-meta">
                  <strong>
                    {index + 1}. {item.file.name}
                  </strong>
                  <span>{formatBytes(item.file.size)}</span>
                </div>
                <div className="file-actions">
                  {tool.maxFiles > 1 ? (
                    <>
                      <button type="button" onClick={() => moveFile(item.id, -1)}>
                        Up
                      </button>
                      <button type="button" onClick={() => moveFile(item.id, 1)}>
                        Down
                      </button>
                    </>
                  ) : null}
                  <button type="button" onClick={() => removeFile(item.id)}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {tool.id === "split-pdf" ? (
            <div className="settings-block">
              <h3>Split options</h3>
              <div className="option-row">
                <button
                  type="button"
                  className={splitMode === "ranges" ? "option-chip is-active" : "option-chip"}
                  onClick={() => setSplitMode("ranges")}
                >
                  Extract PDF pages
                </button>
                <button
                  type="button"
                  className={
                    splitMode === "every-page" ? "option-chip is-active" : "option-chip"
                  }
                  onClick={() => setSplitMode("every-page")}
                >
                  Every PDF page
                </button>
              </div>
              {splitMode === "ranges" ? (
                <label className="field">
                  <span>Pages</span>
                  <input
                    value={ranges}
                    onChange={(event) => setRanges(event.target.value)}
                    placeholder="1-3, 5"
                  />
                </label>
              ) : (
                <p className="settings-help">Creates one PDF for each page.</p>
              )}
            </div>
          ) : null}

          {tool.id === "compress-pdf" ? (
            <div className="settings-block">
              <h3>Compression level</h3>
              <div className="option-row">
                {(
                  [
                    ["strong", "Strong"],
                    ["balanced", "Balanced"],
                    ["high", "High quality"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      compressLevel === value ? "option-chip is-active" : "option-chip"
                    }
                    onClick={() => setCompressLevel(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {tool.id === "rotate-pdf" ? (
            <div className="settings-block">
              <h3>Rotation</h3>
              <div className="option-row">
                {([90, 180, 270] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={degrees === value ? "option-chip is-active" : "option-chip"}
                    onClick={() => setDegrees(value)}
                  >
                    {value}°
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {tool.id === "delete-pages" || tool.id === "extract-pages" ? (
            <div className="settings-block">
              <h3>{tool.id === "delete-pages" ? "PDF pages to delete" : "PDF pages to extract"}</h3>
              <p className="settings-help">
                Tap page previews to select them, or type ranges such as 1-3, 5.
              </p>
              <PdfPagesPreview
                file={files[0]?.file ?? null}
                selectable
                selectedPages={new Set(
                  ranges
                    .split(",")
                    .flatMap((part) => {
                      const trimmed = part.trim();
                      if (!trimmed) return [];
                      if (trimmed.includes("-")) {
                        const [startRaw, endRaw] = trimmed.split("-");
                        const start = Number(startRaw);
                        const end = Number(endRaw);
                        if (!Number.isInteger(start) || !Number.isInteger(end)) return [];
                        const from = Math.min(start, end);
                        const to = Math.max(start, end);
                        return Array.from({ length: to - from + 1 }, (_, i) => from + i - 1);
                      }
                      const page = Number(trimmed);
                      return Number.isInteger(page) ? [page - 1] : [];
                    }),
                )}
                onTogglePage={(pageIndex) => {
                  const pageNumber = pageIndex + 1;
                  const selected = new Set(
                    ranges
                      .split(",")
                      .flatMap((part) => {
                        const trimmed = part.trim();
                        if (!trimmed) return [] as number[];
                        if (trimmed.includes("-")) {
                          const [startRaw, endRaw] = trimmed.split("-");
                          const start = Number(startRaw);
                          const end = Number(endRaw);
                          if (!Number.isInteger(start) || !Number.isInteger(end)) return [];
                          const from = Math.min(start, end);
                          const to = Math.max(start, end);
                          return Array.from({ length: to - from + 1 }, (_, i) => from + i);
                        }
                        const page = Number(trimmed);
                        return Number.isInteger(page) ? [page] : [];
                      }),
                  );
                  if (selected.has(pageNumber)) selected.delete(pageNumber);
                  else selected.add(pageNumber);
                  setRanges(
                    [...selected]
                      .sort((a, b) => a - b)
                      .join(","),
                  );
                }}
              />
              <label className="field">
                <span>Pages</span>
                <input
                  value={ranges}
                  onChange={(event) => setRanges(event.target.value)}
                  placeholder="1-3, 5"
                />
              </label>
            </div>
          ) : null}

          {tool.id === "organize-pdf" ? (
            <div className="settings-block">
              <h3>PDF page order</h3>
              <p className="settings-help">
                Preview each PDF page, then move them up or down to set the final order.
              </p>
              <PdfPagesPreview
                file={files[0]?.file ?? null}
                order={pageOrder}
                onMove={movePage}
              />
            </div>
          ) : null}

          {tool.id === "split-pdf" ? (
            <div className="settings-block">
              <h3>PDF page preview</h3>
              <PdfPagesPreview file={files[0]?.file ?? null} />
            </div>
          ) : null}

          {(tool.id === "rotate-pdf" ||
            tool.id === "compress-pdf" ||
            tool.id === "reverse-pdf" ||
            tool.id === "page-numbers" ||
            tool.id === "watermark-pdf" ||
            tool.id === "protect-pdf" ||
            tool.id === "unlock-pdf" ||
            tool.id === "pdf-to-jpg" ||
            tool.id === "pdf-to-png" ||
            tool.id === "pdf-to-word" ||
            tool.id === "pdf-to-ppt") &&
          files[0] ? (
            <div className="settings-block">
              <h3>PDF page preview</h3>
              <PdfPagesPreview file={files[0].file} />
            </div>
          ) : null}

          {tool.id === "page-numbers" ? (
            <div className="settings-block pn-panel">
              <h3>Add PDF page numbers</h3>

              <div className="wm-section">
                <span className="wm-label">Number format</span>
                <div className="option-row">
                  {(
                    [
                      ["numeric", "1, 2, 3"],
                      ["roman", "i, ii, iii"],
                      ["letter", "A, B, C"],
                      ["page-label", "Page 1"],
                      ["page-of", "1 / 10"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      className={
                        pageNumberFormat === id ? "option-chip is-active" : "option-chip"
                      }
                      onClick={() => setPageNumberFormat(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wm-section">
                <span className="wm-label">Position</span>
                <div className="pn-position-board" aria-label="Page number position">
                  <div className="pn-position-row is-top">
                    {(
                      [
                        ["top-left", "Top left"],
                        ["top-center", "Top center"],
                        ["top-right", "Top right"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className={pagePosition === id ? "pn-anchor is-active" : "pn-anchor"}
                        aria-label={label}
                        onClick={() => setPagePosition(id)}
                      />
                    ))}
                  </div>
                  <p className="pn-position-label">
                    {pagePosition.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                  </p>
                  <div className="pn-position-row is-bottom">
                    {(
                      [
                        ["bottom-left", "Bottom left"],
                        ["bottom-center", "Bottom center"],
                        ["bottom-right", "Bottom right"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        className={pagePosition === id ? "pn-anchor is-active" : "pn-anchor"}
                        aria-label={label}
                        onClick={() => setPagePosition(id)}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="wm-spacing-row">
                <label className="field">
                  <span>Start at</span>
                  <input
                    type="number"
                    min={1}
                    value={startFrom}
                    onChange={(event) => setStartFrom(Number(event.target.value) || 1)}
                  />
                </label>
                <label className="field">
                  <span>Font size (pt)</span>
                  <input
                    type="number"
                    min={8}
                    max={72}
                    value={pageNumberFontSize}
                    onChange={(event) =>
                      setPageNumberFontSize(Number(event.target.value) || 10)
                    }
                  />
                </label>
              </div>

              <label className="ai-check">
                <input
                  type="checkbox"
                  checked={pageNumberSkipFirst}
                  onChange={(event) => setPageNumberSkipFirst(event.target.checked)}
                />
                <span>Skip first page (cover)</span>
              </label>

              <div className="wm-section">
                <span className="wm-label">Colour</span>
                <div className="wm-colors">
                  {pageNumberColors.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      className={
                        pageNumberColor.toLowerCase() === swatch
                          ? "wm-swatch is-active"
                          : "wm-swatch"
                      }
                      style={{ background: swatch }}
                      aria-label={`Colour ${swatch}`}
                      onClick={() => setPageNumberColor(swatch)}
                    />
                  ))}
                  <label
                    className={
                      !pageNumberColors.includes(
                        pageNumberColor.toLowerCase() as (typeof pageNumberColors)[number],
                      )
                        ? "wm-swatch wm-swatch-custom is-active"
                        : "wm-swatch wm-swatch-custom"
                    }
                    title="Custom colour"
                  >
                    <input
                      type="color"
                      value={pageNumberCustomColor}
                      onChange={(event) => {
                        setPageNumberCustomColor(event.target.value);
                        setPageNumberColor(event.target.value);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="wm-section">
                <span className="wm-label">Font weight</span>
                <div className="wm-pattern-row pn-weight-row">
                  <button
                    type="button"
                    className={
                      pageNumberWeight === "regular" ? "wm-pattern is-active" : "wm-pattern"
                    }
                    onClick={() => setPageNumberWeight("regular")}
                  >
                    <strong>Regular</strong>
                  </button>
                  <button
                    type="button"
                    className={
                      pageNumberWeight === "bold" ? "wm-pattern is-active" : "wm-pattern"
                    }
                    onClick={() => setPageNumberWeight("bold")}
                  >
                    <strong>Bold</strong>
                  </button>
                </div>
              </div>

              <div className="wm-section">
                <span className="wm-label">Font size — {pageNumberFontSize}pt</span>
                <input
                  type="range"
                  min={8}
                  max={72}
                  value={pageNumberFontSize}
                  onChange={(event) => setPageNumberFontSize(Number(event.target.value))}
                />
                <div className="wm-range-marks">
                  <span>8pt</span>
                  <span>40pt</span>
                  <span>72pt</span>
                </div>
              </div>
            </div>
          ) : null}

          {tool.id === "watermark-pdf" ? (
            <div className="settings-block watermark-panel">
              <h3>Watermark PDF</h3>
              <p className="settings-help">100% local processing for your PDF watermark settings.</p>

              <div className="wm-section">
                <span className="wm-label">Watermark text</span>
                <label className="field">
                  <span className="visually-hidden">Watermark text</span>
                  <input
                    value={watermarkText}
                    onChange={(event) => setWatermarkText(event.target.value)}
                    placeholder="CONFIDENTIAL"
                  />
                </label>
                <div className="option-row">
                  {watermarkPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      className={
                        watermarkText === preset ? "option-chip is-active" : "option-chip"
                      }
                      onClick={() => setWatermarkText(preset)}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="wm-section">
                <span className="wm-label">Pattern</span>
                <div className="wm-pattern-row">
                  {(
                    [
                      ["single", "Single", "Centre"],
                      ["diagonal", "Diagonal", "Tiled"],
                      ["grid", "Grid", "Aligned"],
                    ] as const
                  ).map(([id, title, subtitle]) => (
                    <button
                      key={id}
                      type="button"
                      className={
                        watermarkPattern === id ? "wm-pattern is-active" : "wm-pattern"
                      }
                      onClick={() => setWatermarkPattern(id)}
                    >
                      <strong>{title}</strong>
                      <span>{subtitle}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="wm-section">
                <span className="wm-label">Opacity — {watermarkOpacity}%</span>
                <input
                  type="range"
                  min={3}
                  max={100}
                  value={watermarkOpacity}
                  onChange={(event) => setWatermarkOpacity(Number(event.target.value))}
                />
                <div className="wm-range-marks">
                  <span>3%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {watermarkPattern !== "single" ? (
                <div className="wm-section">
                  <span className="wm-label">Tile spacing</span>
                  <div className="wm-spacing-row">
                    <label className="field">
                      <span>Horizontal — {watermarkGapX}px</span>
                      <input
                        type="range"
                        min={80}
                        max={400}
                        value={watermarkGapX}
                        onChange={(event) => setWatermarkGapX(Number(event.target.value))}
                      />
                    </label>
                    <label className="field">
                      <span>Vertical — {watermarkGapY}px</span>
                      <input
                        type="range"
                        min={80}
                        max={400}
                        value={watermarkGapY}
                        onChange={(event) => setWatermarkGapY(Number(event.target.value))}
                      />
                    </label>
                  </div>
                </div>
              ) : null}

              <div className="wm-section">
                <span className="wm-label">Colour</span>
                <div className="wm-colors">
                  {watermarkColors.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      className={
                        watermarkColor.toLowerCase() === swatch
                          ? "wm-swatch is-active"
                          : "wm-swatch"
                      }
                      style={{ background: swatch }}
                      aria-label={`Colour ${swatch}`}
                      onClick={() => setWatermarkColor(swatch)}
                    />
                  ))}
                  <label
                    className={
                      !watermarkColors.includes(
                        watermarkColor.toLowerCase() as (typeof watermarkColors)[number],
                      )
                        ? "wm-swatch wm-swatch-custom is-active"
                        : "wm-swatch wm-swatch-custom"
                    }
                    title="Custom colour"
                  >
                    <input
                      type="color"
                      value={watermarkCustomColor}
                      onChange={(event) => {
                        setWatermarkCustomColor(event.target.value);
                        setWatermarkColor(event.target.value);
                      }}
                    />
                  </label>
                </div>
              </div>

              <div className="wm-section">
                <span className="wm-label">Font size — {watermarkFontSize}pt</span>
                <input
                  type="range"
                  min={12}
                  max={120}
                  value={watermarkFontSize}
                  onChange={(event) => setWatermarkFontSize(Number(event.target.value))}
                />
                <div className="wm-range-marks">
                  <span>12pt</span>
                  <span>66pt</span>
                  <span>120pt</span>
                </div>
              </div>
            </div>
          ) : null}

          {tool.id === "protect-pdf" || tool.id === "unlock-pdf" ? (
            <div className="settings-block">
              <h3>{tool.id === "protect-pdf" ? "Set PDF password" : "PDF password"}</h3>
              <label className="field">
                <span>Password</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={
                    tool.id === "protect-pdf" ? "At least 4 characters" : "Enter password"
                  }
                />
              </label>
            </div>
          ) : null}

          {tool.id === "pdf-to-jpg" || tool.id === "pdf-to-png" ? (
            <div className="settings-block">
              <h3>Image quality</h3>
              <div className="option-row">
                {(
                  [
                    ["balanced", "Balanced"],
                    ["high", "High"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={jpgQuality === value ? "option-chip is-active" : "option-chip"}
                    onClick={() => setJpgQuality(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {error ? <p className="tool-error">{error}</p> : null}
          {resultMeta ? <p className="tool-success">{resultMeta}</p> : null}

          <div className="settings-block download-name-block">
            <h3>Download name</h3>
            <label className="field">
              <span>File name</span>
              <input
                value={outputName}
                onChange={(event) => setOutputName(event.target.value)}
                placeholder="Enter a file name"
                aria-label="Download file name"
              />
            </label>
            <p className="settings-help">
              Name it here, then press download. The file is saved automatically with this
              name. No need to rename it again on your computer.
            </p>
          </div>

          <button
            type="button"
            className="process-btn"
            disabled={!canProcess || busy}
            onClick={processFiles}
          >
            {busy ? "Downloading..." : "Download"}
          </button>
        </div>
      )}

      {error && !hasFiles && !isMarkdownTool ? (
        <p className="tool-error tool-error-center">{error}</p>
      ) : null}

      <input
        ref={inputRef}
        type="file"
        accept={tool.accept}
        multiple={tool.maxFiles > 1}
        hidden
        onChange={(event) => {
          addFiles(event.target.files);
          event.currentTarget.value = "";
        }}
      />
    </section>
  );
}
