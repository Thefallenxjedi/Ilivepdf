"use client";

import { useEffect, useState } from "react";
import {
  clearRememberedApiKey,
  GEMINI_KEY_URL,
  loadRememberedApiKey,
  saveRememberedApiKey,
} from "@/core/ai/geminiKey";

type AiApiKeyPanelProps = {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
};

export function AiApiKeyPanel({ apiKey, onApiKeyChange }: AiApiKeyPanelProps) {
  const [draft, setDraft] = useState(apiKey);
  const [remember, setRemember] = useState(false);
  const [saved, setSaved] = useState(Boolean(apiKey));

  useEffect(() => {
    const remembered = loadRememberedApiKey();
    if (remembered) {
      setDraft(remembered);
      onApiKeyChange(remembered);
      setRemember(true);
      setSaved(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hydrate once on mount
  }, []);

  useEffect(() => {
    setDraft(apiKey);
    setSaved(Boolean(apiKey));
  }, [apiKey]);

  return (
    <section className="ai-side-card">
      <div className="ai-side-card-head">
        <span className="ai-side-icon" aria-hidden>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
          </svg>
        </span>
        <div>
          <strong>API Key</strong>
          <p className={saved ? "ai-status is-set" : "ai-status"}>{saved ? "Ready" : "Not set"}</p>
        </div>
      </div>

      <label className="ai-field">
        <span className="visually-hidden">Gemini API key</span>
        <input
          type="password"
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setSaved(false);
          }}
          placeholder="Enter Gemini API key..."
          autoComplete="off"
          spellCheck={false}
        />
      </label>

      <label className="ai-check">
        <input
          type="checkbox"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
        />
        <span>Remember key</span>
      </label>

      <button
        type="button"
        className="ai-save-key"
        onClick={() => {
          const next = draft.trim();
          onApiKeyChange(next);
          setSaved(Boolean(next));
          if (remember && next) {
            saveRememberedApiKey(next);
          } else {
            clearRememberedApiKey();
          }
        }}
      >
        Save Key
      </button>

      <a className="ai-key-link" href={GEMINI_KEY_URL} target="_blank" rel="noreferrer">
        Get API key →
      </a>
      <p className="ai-key-note">Free Gemini key from Google AI Studio. Your key stays in this browser.</p>
    </section>
  );
}
