"use client";

import { useRef, useState } from "react";
import { AiApiKeyPanel } from "@/components/ai/AiApiKeyPanel";
import { ToolIcon } from "@/components/ToolIcon";
import { extractPdfText } from "@/core/ai/extractPdfText";
import { summarizeDocuments } from "@/core/ai/gemini";
import type { ToolConfig } from "@/config/tools";

type UploadedPdf = {
  id: string;
  file: File;
  name: string;
  text: string;
  status: "loading" | "ready" | "error";
  error?: string;
};

type SummaryStyle = "brief" | "detailed" | "bullets";

type SummarizePdfWorkspaceProps = {
  tool: ToolConfig;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function SummarizePdfWorkspace({ tool }: SummarizePdfWorkspaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKey] = useState("");
  const [pdfs, setPdfs] = useState<UploadedPdf[]>([]);
  const [style, setStyle] = useState<SummaryStyle>("brief");
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const readyDocs = pdfs.filter((pdf) => pdf.status === "ready");
  const canRun = Boolean(apiKey) && readyDocs.length > 0 && !busy;

  async function addFiles(fileList: FileList | null) {
    if (!fileList?.length) return;
    setError("");

    const incoming = Array.from(fileList).filter(
      (file) =>
        file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf"),
    );

    const room = tool.maxFiles - pdfs.length;
    if (room <= 0) {
      setError(`You can upload up to ${tool.maxFiles} PDFs.`);
      return;
    }

    const selected = incoming.slice(0, room);
    const placeholders: UploadedPdf[] = selected.map((file) => ({
      id: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
      file,
      name: file.name,
      text: "",
      status: "loading",
    }));

    setPdfs((current) => [...current, ...placeholders]);

    await Promise.all(
      placeholders.map(async (item) => {
        try {
          const text = await extractPdfText(item.file);
          setPdfs((current) =>
            current.map((pdf) =>
              pdf.id === item.id
                ? {
                    ...pdf,
                    text,
                    status: text ? "ready" : "error",
                    error: text ? undefined : "No text found in this PDF.",
                  }
                : pdf,
            ),
          );
        } catch (err) {
          setPdfs((current) =>
            current.map((pdf) =>
              pdf.id === item.id
                ? {
                    ...pdf,
                    status: "error",
                    error: err instanceof Error ? err.message : "Could not read PDF.",
                  }
                : pdf,
            ),
          );
        }
      }),
    );
  }

  async function runSummary() {
    if (!canRun) return;
    setBusy(true);
    setError("");
    setSummary("");

    try {
      const result = await summarizeDocuments(
        apiKey,
        readyDocs.map((doc) => ({ name: doc.name, text: doc.text })),
        style,
      );
      setSummary(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Summary failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="ai-workspace">
      <aside className="ai-sidebar">
        <AiApiKeyPanel apiKey={apiKey} onApiKeyChange={setApiKey} />

        <section className="ai-side-card ai-pdfs-card">
          <div className="ai-side-card-head">
            <span className="ai-side-icon" aria-hidden>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <path d="M14 2v6h6" />
              </svg>
            </span>
            <div>
              <strong>PDFs</strong>
              <p className="ai-status">
                {pdfs.length}/{tool.maxFiles}
              </p>
            </div>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={tool.accept}
            multiple
            hidden
            onChange={(event) => {
              void addFiles(event.target.files);
              event.target.value = "";
            }}
          />

          <button
            type="button"
            className="ai-upload-btn"
            onClick={() => inputRef.current?.click()}
            disabled={pdfs.length >= tool.maxFiles}
          >
            Upload PDFs
          </button>

          <div className="ai-style-row" role="group" aria-label="Summary style">
            {(
              [
                ["brief", "Brief"],
                ["detailed", "Detailed"],
                ["bullets", "Bullets"],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                className={style === id ? "option-chip is-active" : "option-chip"}
                onClick={() => setStyle(id)}
              >
                {label}
              </button>
            ))}
          </div>

          <button type="button" className="ai-save-key" disabled={!canRun} onClick={() => void runSummary()}>
            {busy ? "Summarizing…" : "Summarize"}
          </button>

          {pdfs.length === 0 ? (
            <div className="ai-empty-pdfs">
              <p>No PDFs uploaded</p>
            </div>
          ) : (
            <ul className="ai-pdf-list">
              {pdfs.map((pdf) => (
                <li key={pdf.id}>
                  <div>
                    <strong>{pdf.name}</strong>
                    <span>
                      {pdf.status === "loading"
                        ? "Reading…"
                        : pdf.status === "error"
                          ? pdf.error || "Error"
                          : formatSize(pdf.file.size)}
                    </span>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${pdf.name}`}
                    onClick={() => setPdfs((current) => current.filter((item) => item.id !== pdf.id))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </aside>

      <section className="ai-main">
        <header className="ai-main-head">
          <ToolIcon toolId={tool.id} title={tool.name} size={40} />
          <div>
            <h1>{tool.name}</h1>
            <p>{readyDocs.length ? `${readyDocs.length} PDF ready` : "Upload PDFs to start"}</p>
          </div>
        </header>

        <div className="ai-chat-scroll">
          {!summary && !busy ? (
            <div className="ai-empty-chat">
              <h2>Ready to summarize</h2>
              <p>Add your free Gemini key, upload a PDF, choose a style, then run Summarize.</p>
            </div>
          ) : (
            <div className="ai-summary-panel">
              {busy ? <p className="ai-thinking">Summarizing…</p> : null}
              {summary ? (
                <>
                  <div className="ai-summary-actions">
                    <button
                      type="button"
                      className="option-chip"
                      onClick={() => void navigator.clipboard.writeText(summary)}
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      className="option-chip"
                      onClick={() => {
                        const blob = new Blob([summary], { type: "text/plain;charset=utf-8" });
                        const url = URL.createObjectURL(blob);
                        const anchor = document.createElement("a");
                        anchor.href = url;
                        anchor.download = "ilivepdf-summary.txt";
                        anchor.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download .txt
                    </button>
                  </div>
                  <pre className="ai-summary-text">{summary}</pre>
                </>
              ) : null}
            </div>
          )}
        </div>

        {error ? <p className="tool-error ai-inline-error">{error}</p> : null}
      </section>
    </div>
  );
}
