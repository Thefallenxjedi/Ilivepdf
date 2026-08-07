export type ToolId =
  | "merge-pdf"
  | "split-pdf"
  | "compress-pdf"
  | "rotate-pdf"
  | "delete-pages"
  | "extract-pages"
  | "organize-pdf"
  | "page-numbers"
  | "watermark-pdf"
  | "protect-pdf"
  | "unlock-pdf"
  | "jpg-to-pdf"
  | "png-to-pdf"
  | "pdf-to-jpg"
  | "pdf-to-png"
  | "reverse-pdf"
  | "word-to-pdf"
  | "pdf-to-word"
  | "ppt-to-pdf"
  | "pdf-to-ppt"
  | "markdown-to-pdf"
  | "scan-to-pdf"
  | "chat-pdf"
  | "summarize-pdf";

export type ToolCategory =
  | "organize"
  | "optimize"
  | "edit"
  | "security"
  | "convert"
  | "scan"
  | "ai";

export type IconVariant = "pair-in" | "pair-out" | "cluster" | "stack";

export type IconColor =
  | "coral"
  | "teal"
  | "green"
  | "blue"
  | "rose"
  | "indigo"
  | "amber"
  | "slate"
  | "violet"
  | "navy"
  | "sky"
  | "magenta";

export type ToolConfig = {
  id: ToolId;
  name: string;
  href: string;
  detail: string;
  category: ToolCategory;
  iconVariant: IconVariant;
  iconColor: IconColor;
  iconMark?: string;
  minFiles: number;
  maxFiles: number;
  accept: string;
  enabled: boolean;
};

export const tools: ToolConfig[] = [
  {
    id: "merge-pdf",
    name: "Merge PDF",
    href: "/tools/merge-pdf",
    detail: "Combine multiple PDF files into one clean PDF in the order you choose.",
    category: "organize",
    iconVariant: "pair-in",
    iconColor: "coral",
    minFiles: 2,
    maxFiles: 20,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "split-pdf",
    name: "Split PDF",
    href: "/tools/split-pdf",
    detail: "Split one PDF into PDF page ranges or save every PDF page as its own file.",
    category: "organize",
    iconVariant: "pair-out",
    iconColor: "coral",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "compress-pdf",
    name: "Compress PDF",
    href: "/tools/compress-pdf",
    detail: "Compress a large PDF to a smaller PDF while keeping the content readable.",
    category: "optimize",
    iconVariant: "cluster",
    iconColor: "green",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "rotate-pdf",
    name: "Rotate PDF",
    href: "/tools/rotate-pdf",
    detail: "Rotate a PDF to the correct orientation before you share or archive the PDF.",
    category: "organize",
    iconVariant: "pair-in",
    iconColor: "blue",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "reverse-pdf",
    name: "Reverse PDF",
    href: "/tools/reverse-pdf",
    detail: "Reverse PDF page order from last to first in one download.",
    category: "organize",
    iconVariant: "pair-out",
    iconColor: "indigo",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "delete-pages",
    name: "Delete PDF pages",
    href: "/tools/delete-pages",
    detail: "Delete unwanted PDF pages and download a PDF that keeps only what you need.",
    category: "organize",
    iconVariant: "pair-out",
    iconColor: "rose",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "extract-pages",
    name: "Extract PDF pages",
    href: "/tools/extract-pages",
    detail: "Extract selected PDF pages into a new PDF without changing the original set.",
    category: "organize",
    iconVariant: "pair-out",
    iconColor: "indigo",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "organize-pdf",
    name: "Organize PDF",
    href: "/tools/organize-pdf",
    detail: "Reorder PDF pages until the PDF reads the way you need, then download.",
    category: "organize",
    iconVariant: "pair-in",
    iconColor: "amber",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "page-numbers",
    name: "Add PDF page numbers",
    href: "/tools/page-numbers",
    detail: "Add page numbers to a PDF with simple position controls, then download.",
    category: "edit",
    iconVariant: "stack",
    iconColor: "slate",
    iconMark: "#",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "watermark-pdf",
    name: "Watermark PDF",
    href: "/tools/watermark-pdf",
    detail: "Add a text watermark to a PDF so shared PDF copies stay clearly marked.",
    category: "edit",
    iconVariant: "stack",
    iconColor: "violet",
    iconMark: "W",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "protect-pdf",
    name: "Protect PDF",
    href: "/tools/protect-pdf",
    detail: "Password protect a PDF before you send the PDF file out.",
    category: "security",
    iconVariant: "stack",
    iconColor: "navy",
    iconMark: "P",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "unlock-pdf",
    name: "Unlock PDF",
    href: "/tools/unlock-pdf",
    detail: "Unlock a password-protected PDF when you already have the PDF password.",
    category: "security",
    iconVariant: "stack",
    iconColor: "sky",
    iconMark: "U",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "jpg-to-pdf",
    name: "JPG to PDF",
    href: "/tools/jpg-to-pdf",
    detail: "Convert JPG photos or scans into a single PDF ready to store or send.",
    category: "convert",
    iconVariant: "stack",
    iconColor: "teal",
    iconMark: "J",
    minFiles: 1,
    maxFiles: 20,
    accept: "image/jpeg,image/jpg,image/png",
    enabled: true,
  },
  {
    id: "png-to-pdf",
    name: "PNG to PDF",
    href: "/tools/png-to-pdf",
    detail: "Convert PNG images into one PDF you can store or send.",
    category: "convert",
    iconVariant: "stack",
    iconColor: "teal",
    iconMark: "P",
    minFiles: 1,
    maxFiles: 20,
    accept: "image/png",
    enabled: true,
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    href: "/tools/pdf-to-jpg",
    detail: "Convert each PDF page to a JPG for previews, posts, or markup.",
    category: "convert",
    iconVariant: "stack",
    iconColor: "magenta",
    iconMark: "I",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "pdf-to-png",
    name: "PDF to PNG",
    href: "/tools/pdf-to-png",
    detail: "Convert each PDF page to a PNG for design work and sharp previews.",
    category: "convert",
    iconVariant: "stack",
    iconColor: "magenta",
    iconMark: "N",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "word-to-pdf",
    name: "Word to PDF",
    href: "/tools/word-to-pdf",
    detail: "Convert a Word file into a stable PDF for sharing and archiving.",
    category: "convert",
    iconVariant: "stack",
    iconColor: "blue",
    iconMark: "W",
    minFiles: 1,
    maxFiles: 1,
    accept:
      "application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.doc,.docx",
    enabled: true,
  },
  {
    id: "pdf-to-word",
    name: "PDF to Word",
    href: "/tools/pdf-to-word",
    detail: "Convert a PDF into an editable Word document.",
    category: "convert",
    iconVariant: "stack",
    iconColor: "blue",
    iconMark: "D",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "ppt-to-pdf",
    name: "PPT to PDF",
    href: "/tools/ppt-to-pdf",
    detail: "Convert PowerPoint slides into a shareable PDF.",
    category: "convert",
    iconVariant: "stack",
    iconColor: "coral",
    iconMark: "S",
    minFiles: 1,
    maxFiles: 1,
    accept:
      "application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,.ppt,.pptx",
    enabled: true,
  },
  {
    id: "pdf-to-ppt",
    name: "PDF to PPT",
    href: "/tools/pdf-to-ppt",
    detail: "Convert PDF pages into editable PowerPoint slides.",
    category: "convert",
    iconVariant: "stack",
    iconColor: "coral",
    iconMark: "T",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "markdown-to-pdf",
    name: "Markdown to PDF",
    href: "/tools/markdown-to-pdf",
    detail: "Paste Markdown or upload a .md file, then download a clean PDF.",
    category: "convert",
    iconVariant: "stack",
    iconColor: "teal",
    iconMark: "M",
    minFiles: 1,
    maxFiles: 10,
    accept: "text/markdown,text/plain,.md,.markdown,.txt",
    enabled: true,
  },
  {
    id: "scan-to-pdf",
    name: "Scan to PDF",
    href: "/tools/scan-to-pdf",
    detail:
      "DocScan on-device: live edge tracking, auto-capture, perspective fix, multi-page OCR to searchable PDF — no upload.",
    category: "scan",
    iconVariant: "stack",
    iconColor: "blue",
    iconMark: "S",
    minFiles: 0,
    maxFiles: 50,
    accept: "image/*",
    enabled: true,
  },
  {
    id: "chat-pdf",
    name: "Chat with PDF",
    href: "/tools/chat-pdf",
    detail: "Ask questions about your PDF files using your own free Gemini API key.",
    category: "ai",
    iconVariant: "stack",
    iconColor: "blue",
    iconMark: "C",
    minFiles: 1,
    maxFiles: 10,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "summarize-pdf",
    name: "Summarize PDF",
    href: "/tools/summarize-pdf",
    detail: "Summarize a PDF online with your own free Gemini API key.",
    category: "ai",
    iconVariant: "stack",
    iconColor: "teal",
    iconMark: "S",
    minFiles: 1,
    maxFiles: 5,
    accept: "application/pdf",
    enabled: true,
  },
];

export const enabledTools = tools.filter((tool) => tool.enabled);

export function getTool(id: string): ToolConfig | undefined {
  return tools.find((tool) => tool.id === id);
}
