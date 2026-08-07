import Image from "next/image";
import type { ToolCategory, ToolId } from "@/config/tools";
import { getTool } from "@/config/tools";

const CATEGORY_ICONS: Record<ToolCategory, string> = {
  organize: "/icons/arrange.jpg",
  optimize: "/icons/optimize.jpg",
  edit: "/icons/markup.jpg",
  security: "/icons/secure.jpg",
  convert: "/icons/convert.jpg",
  scan: "/icons/tool-scan-to-pdf.jpg",
  ai: "/icons/tool-chat-pdf.jpg",
};

/** Per-tool icons; missing ids fall back to category art. */
const TOOL_ICONS: Partial<Record<ToolId, string>> = {
  "merge-pdf": "/icons/tool-merge-pdf.jpg",
  "split-pdf": "/icons/tool-split-pdf.jpg",
  "rotate-pdf": "/icons/tool-rotate-pdf.jpg",
  "reverse-pdf": "/icons/tool-reverse-pdf.jpg",
  "delete-pages": "/icons/tool-delete-pages.jpg",
  "extract-pages": "/icons/tool-extract-pages.jpg",
  "organize-pdf": "/icons/tool-organize-pdf.jpg",
  "compress-pdf": "/icons/tool-compress-pdf.jpg",
  "page-numbers": "/icons/tool-page-numbers.jpg",
  "watermark-pdf": "/icons/tool-watermark-pdf.jpg",
  "protect-pdf": "/icons/tool-protect-pdf.jpg",
  "unlock-pdf": "/icons/tool-unlock-pdf.jpg",
  "jpg-to-pdf": "/icons/tool-jpg-to-pdf.jpg",
  "png-to-pdf": "/icons/tool-png-to-pdf.jpg",
  "pdf-to-jpg": "/icons/tool-pdf-to-jpg.jpg",
  "pdf-to-png": "/icons/tool-pdf-to-png.jpg",
  "word-to-pdf": "/icons/tool-word-to-pdf.jpg",
  "pdf-to-word": "/icons/tool-pdf-to-word.jpg",
  "ppt-to-pdf": "/icons/tool-ppt-to-pdf.jpg",
  "pdf-to-ppt": "/icons/tool-pdf-to-ppt.jpg",
  "markdown-to-pdf": "/icons/tool-markdown-to-pdf.jpg",
  "scan-to-pdf": "/icons/tool-scan-to-pdf.jpg",
  "chat-pdf": "/icons/tool-chat-pdf.jpg",
  "summarize-pdf": "/icons/tool-summarize-pdf.jpg",
};

type ToolIconProps = {
  toolId?: ToolId;
  category?: ToolCategory;
  title?: string;
  className?: string;
  size?: number;
};

export function ToolIcon({
  toolId,
  category,
  title,
  className,
  size = 56,
}: ToolIconProps) {
  const resolvedCategory =
    category || (toolId ? getTool(toolId)?.category : undefined) || "organize";
  const src =
    (toolId && TOOL_ICONS[toolId]) || CATEGORY_ICONS[resolvedCategory];
  const radius = Math.round(size * 0.22);

  return (
    <span
      className={className ? `tool-icon-wrap ${className}` : "tool-icon-wrap"}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={title || ""}
        width={192}
        height={192}
        sizes={`${size}px`}
        className="tool-icon-image"
        style={{ width: size, height: size, borderRadius: radius }}
        loading="lazy"
      />
    </span>
  );
}
