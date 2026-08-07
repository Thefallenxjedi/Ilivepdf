"use client";

import { useRef, useState } from "react";
import { AiApiKeyPanel } from "@/components/ai/AiApiKeyPanel";
import { ToolIcon } from "@/components/ToolIcon";
import { extractPdfText } from "@/core/ai/extractPdfText";
import { chatWithDocuments, type ChatMessage } from "@/core/ai/gemini";
import type { ToolConfig } from "@/config/tools";

type UploadedPdf = {
  id: string;
  file: File;
  name: string;
  text: string;
  status: "loading" | "ready" | "error";
  error?: string;
};

type ChatPdfWorkspaceProps = {
  tool: ToolConfig;
};

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatPdfWorkspace({ tool }: ChatPdfWorkspaceProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [apiKey, setApiKey] = useState("");
  const [pdfs, setPdfs] = useState<UploadedPdf[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const readyDocs = pdfs.filter((pdf) => pdf.status === "ready");
  const canChat = Boolean(apiKey) && readyDocs.length > 0 && !busy;

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
                ? { ...pdf, text, status: text ? "ready" : "error", error: text ? undefined : "No text found in this PDF." }
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

  async function sendMessage() {
    const trimmed = question.trim();
    if (!trimmed || !canChat) return;

    setBusy(true);
    setError("");
    setQuestion("");
    const nextHistory = [...messages, { role: "user" as const, text: trimmed }];
    setMessages(nextHistory);

    try {
      const answer = await chatWithDocuments(
        apiKey,
        readyDocs.map((doc) => ({ name: doc.name, text: doc.text })),
        messages,
        trimmed,
      );
      setMessages([...nextHistory, { role: "model", text: answer }]);
    } catch (err) {
      setMessages(messages);
      setQuestion(trimmed);
      setError(err instanceof Error ? err.message : "Chat failed.");
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
          {messages.length === 0 ? (
            <div className="ai-empty-chat">
              <h2>Ready to chat</h2>
              <p>Add your Gemini key, upload PDFs, then ask anything about the content.</p>
            </div>
          ) : (
            <div className="ai-messages">
              {messages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={message.role === "user" ? "ai-bubble is-user" : "ai-bubble is-model"}
                >
                  <span>{message.role === "user" ? "You" : "iLivePDF"}</span>
                  <p>{message.text}</p>
                </div>
              ))}
              {busy ? <p className="ai-thinking">Thinking…</p> : null}
            </div>
          )}
        </div>

        {error ? <p className="tool-error ai-inline-error">{error}</p> : null}

        <form
          className="ai-composer"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage();
          }}
        >
          <input
            type="text"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask anything..."
            disabled={!apiKey || readyDocs.length === 0 || busy}
          />
          <button type="submit" disabled={!canChat || !question.trim()} aria-label="Send">
            Send
          </button>
        </form>
      </section>
    </div>
  );
}
