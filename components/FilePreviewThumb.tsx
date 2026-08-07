"use client";

import { useEffect, useState } from "react";
import {
  createImagePreviewUrl,
  renderPdfCoverThumb,
} from "@/core/preview/pdfThumbnails";

type FilePreviewThumbProps = {
  file: File;
  fallbackLabel: string;
  className?: string;
};

export function FilePreviewThumb({
  file,
  fallbackLabel,
  className,
}: FilePreviewThumbProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    async function load() {
      const imageUrl = createImagePreviewUrl(file);
      if (imageUrl) {
        objectUrl = imageUrl;
        if (!cancelled) setSrc(imageUrl);
        return;
      }

      const name = file.name.toLowerCase();
      if (file.type === "application/pdf" || name.endsWith(".pdf")) {
        const thumb = await renderPdfCoverThumb(file);
        if (!cancelled) setSrc(thumb);
        return;
      }

      if (!cancelled) setSrc(null);
    }

    void load();

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [file]);

  if (src) {
    return (
      <span className={className ? `file-thumb is-preview ${className}` : "file-thumb is-preview"}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" />
      </span>
    );
  }

  return (
    <span className={className ? `file-thumb ${className}` : "file-thumb"} aria-hidden="true">
      {fallbackLabel}
    </span>
  );
}
