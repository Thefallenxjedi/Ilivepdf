import Image from "next/image";
import type { ToolCategory, ToolId } from "@/config/tools";
import { getTool } from "@/config/tools";

const CATEGORY_ICONS: Record<ToolCategory, string> = {
  organize: "/icons/arrange.png",
  optimize: "/icons/optimize.png",
  edit: "/icons/markup.png",
  security: "/icons/secure.png",
  convert: "/icons/convert.png",
  scan: "/icons/tool-scan-to-pdf.png",
  ai: "/icons/tool-chat-pdf.png",
};

/** Per-tool icons; missing ids fall back to category art. */
const TOOL_ICONS: Partial<Record<ToolId, string>> = {
  "merge-pdf": "/icons/tool-merge-pdf.png",
  "split-pdf": "/icons/tool-split-pdf.png",
  "rotate-pdf": "/icons/tool-rotate-pdf.png",
  "reverse-pdf": "/icons/tool-reverse-pdf.png",
  "delete-pages": "/icons/tool-delete-pages.png",
  "extract-pages": "/icons/tool-extract-pages.png",
  "organize-pdf": "/icons/tool-organize-pdf.png",
  "compress-pdf": "/icons/tool-compress-pdf.png",
  "page-numbers": "/icons/tool-page-numbers.png",
  "watermark-pdf": "/icons/tool-watermark-pdf.png",
  "protect-pdf": "/icons/tool-protect-pdf.png",
  "unlock-pdf": "/icons/tool-unlock-pdf.png",
  "jpg-to-pdf": "/icons/tool-jpg-to-pdf.png",
  "png-to-pdf": "/icons/tool-png-to-pdf.png",
  "pdf-to-jpg": "/icons/tool-pdf-to-jpg.png",
  "pdf-to-png": "/icons/tool-pdf-to-png.png",
  "word-to-pdf": "/icons/tool-word-to-pdf.png",
  "pdf-to-word": "/icons/tool-pdf-to-word.png",
  "ppt-to-pdf": "/icons/tool-ppt-to-pdf.png",
  "pdf-to-ppt": "/icons/tool-pdf-to-ppt.png",
  "markdown-to-pdf": "/icons/tool-markdown-to-pdf.png",
  "scan-to-pdf": "/icons/tool-scan-to-pdf.png",
  "chat-pdf": "/icons/tool-chat-pdf.png",
  "summarize-pdf": "/icons/tool-summarize-pdf.png",
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
        width={size}
        height={size}
        className="tool-icon-image"
        style={{ width: size, height: size, borderRadius: radius }}
        unoptimized
        priority={false}
      />
    </span>
  );
}
