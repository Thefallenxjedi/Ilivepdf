"use client";

import { PDFDocument } from "pdf-lib";
import { useEffect, useMemo, useRef, useState } from "react";
import { ToolIcon } from "@/components/ToolIcon";
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
  if (tool.id === "merge-pdf") return "Combine your PDFs";
  if (tool.id === "split-pdf") return "Divide a PDF";
  if (tool.id === "compress-pdf") return "Reduce PDF size";
  if (tool.id === "jpg-to-pdf") return "Images to PDF";
  if (tool.id === "pdf-to-jpg") return "PDF pages to images";
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
    "bottom-center" | "bottom-right" | "top-center"
  >("bottom-center");
  const [startFrom, setStartFrom] = useState(1);
  const [watermarkText, setWatermarkText] = useState("CONFIDENTIAL");
  const [password, setPassword] = useState("");
  const [jpgQuality, setJpgQuality] = useState<"balanced" | "high">("balanced");
  const [outputName, setOutputName] = useState("document");
  const [resultMeta, setResultMeta] = useState<string | null>(null);

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
        tool.id === "jpg-to-pdf"
          ? "Please choose JPG or PNG images only."
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
      }
      if (tool.id === "watermark-pdf") {
        formData.set("text", watermarkText);
        formData.set("opacity", "0.2");
      }
      if (tool.id === "protect-pdf" || tool.id === "unlock-pdf") {
        formData.set("password", password);
      }
      if (tool.id === "pdf-to-jpg") formData.set("quality", jpgQuality);

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
  const selectLabel = tool.id === "jpg-to-pdf" ? "Select image files" : "Select PDF files";
  const dropHint = tool.id === "jpg-to-pdf" ? "or drop images here" : "or drop PDFs here";

  return (
    <section className="tool-workspace">
      <div className="tool-hero">
        <ToolIcon
          className="tool-hero-icon"
          variant={tool.iconVariant}
          color={tool.iconColor}
          mark={tool.iconMark}
          title={tool.name}
        />
        <h1>{toolHeadline(tool)}</h1>
        <p>{tool.detail}</p>
      </div>

      {!hasFiles ? (
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
                <div className="file-thumb" aria-hidden="true">
                  {tool.id === "jpg-to-pdf" ? "IMG" : "PDF"}
                </div>
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
                  Extract pages
                </button>
                <button
                  type="button"
                  className={
                    splitMode === "every-page" ? "option-chip is-active" : "option-chip"
                  }
                  onClick={() => setSplitMode("every-page")}
                >
                  Every page
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
              <h3>{tool.id === "delete-pages" ? "Pages to delete" : "Pages to extract"}</h3>
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
              <h3>Page order</h3>
              <div className="file-list">
                {pageOrder.map((pageIndex, index) => (
                  <div className="file-row" key={`${pageIndex}-${index}`}>
                    <div className="file-meta">
                      <strong>Page {pageIndex + 1}</strong>
                      <span>Position {index + 1}</span>
                    </div>
                    <div className="file-actions">
                      <button type="button" onClick={() => movePage(index, -1)}>
                        Up
                      </button>
                      <button type="button" onClick={() => movePage(index, 1)}>
                        Down
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {tool.id === "page-numbers" ? (
            <div className="settings-block">
              <h3>Page numbers</h3>
              <div className="option-row">
                {(
                  [
                    ["bottom-center", "Bottom center"],
                    ["bottom-right", "Bottom right"],
                    ["top-center", "Top center"],
                  ] as const
                ).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    className={
                      pagePosition === value ? "option-chip is-active" : "option-chip"
                    }
                    onClick={() => setPagePosition(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="field">
                <span>Start from</span>
                <input
                  type="number"
                  min={1}
                  value={startFrom}
                  onChange={(event) => setStartFrom(Number(event.target.value) || 1)}
                />
              </label>
            </div>
          ) : null}

          {tool.id === "watermark-pdf" ? (
            <div className="settings-block">
              <h3>Watermark text</h3>
              <label className="field">
                <span>Text</span>
                <input
                  value={watermarkText}
                  onChange={(event) => setWatermarkText(event.target.value)}
                  placeholder="CONFIDENTIAL"
                />
              </label>
            </div>
          ) : null}

          {tool.id === "protect-pdf" || tool.id === "unlock-pdf" ? (
            <div className="settings-block">
              <h3>{tool.id === "protect-pdf" ? "Set password" : "PDF password"}</h3>
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

          {tool.id === "pdf-to-jpg" ? (
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

      {error && !hasFiles ? <p className="tool-error tool-error-center">{error}</p> : null}

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
