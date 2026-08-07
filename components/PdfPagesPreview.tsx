"use client";

import { useEffect, useState } from "react";
import { renderPdfPageThumbs } from "@/core/preview/pdfThumbnails";

type PdfPagesPreviewProps = {
  file: File | null;
  /** Zero-based page indices in display order. If omitted, uses natural order. */
  order?: number[];
  onMove?: (index: number, direction: -1 | 1) => void;
  selectable?: boolean;
  selectedPages?: Set<number>;
  onTogglePage?: (pageIndexZeroBased: number) => void;
  emptyLabel?: string;
};

export function PdfPagesPreview({
  file,
  order,
  onMove,
  selectable,
  selectedPages,
  onTogglePage,
  emptyLabel = "Upload a PDF to preview pages.",
}: PdfPagesPreviewProps) {
  const [thumbs, setThumbs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!file) {
        setThumbs([]);
        return;
      }
      setLoading(true);
      const next = await renderPdfPageThumbs(file);
      if (!cancelled) {
        setThumbs(next);
        setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [file]);

  if (!file) {
    return <p className="preview-empty">{emptyLabel}</p>;
  }

  if (loading && !thumbs.length) {
    return <p className="preview-empty">Loading page previews…</p>;
  }

  if (!thumbs.length) {
    return <p className="preview-empty">Could not render page previews for this PDF.</p>;
  }

  const displayOrder = order?.length ? order : thumbs.map((_, index) => index);

  return (
    <div className="page-preview-grid">
      {displayOrder.map((pageIndex, position) => {
        const src = thumbs[pageIndex];
        const pageNumber = pageIndex + 1;
        const selected = selectedPages?.has(pageIndex) ?? false;

        return (
          <div
            key={`${pageIndex}-${position}`}
            className={selected ? "page-preview-card is-selected" : "page-preview-card"}
          >
            <button
              type="button"
              className="page-preview-hit"
              disabled={!selectable}
              onClick={() => onTogglePage?.(pageIndex)}
              aria-pressed={selectable ? selected : undefined}
              aria-label={`PDF page ${pageNumber}`}
            >
              {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={`PDF page ${pageNumber}`} />
              ) : (
                <span className="page-preview-fallback">Page {pageNumber}</span>
              )}
              <span className="page-preview-label">Page {pageNumber}</span>
            </button>
            {onMove ? (
              <div className="page-preview-actions">
                <button type="button" onClick={() => onMove(position, -1)}>
                  Up
                </button>
                <button type="button" onClick={() => onMove(position, 1)}>
                  Down
                </button>
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
