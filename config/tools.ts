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
  | "pdf-to-jpg";

export type ToolCategory = "organize" | "optimize" | "edit" | "security" | "convert";

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
    detail: "Stack files in your preferred order and export one clean document.",
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
    detail: "Break a document into page ranges or save every page on its own.",
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
    detail: "Shrink a heavy file while keeping the content readable and useful.",
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
    detail: "Turn pages to the right orientation before you share or archive them.",
    category: "organize",
    iconVariant: "pair-in",
    iconColor: "blue",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
  {
    id: "delete-pages",
    name: "Delete pages",
    href: "/tools/delete-pages",
    detail: "Drop the pages you do not need and keep only what matters.",
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
    name: "Extract pages",
    href: "/tools/extract-pages",
    detail: "Lift selected pages into a new file without touching the original set.",
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
    detail: "Rearrange page order until the document reads the way you need.",
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
    name: "Add page numbers",
    href: "/tools/page-numbers",
    detail: "Place numbered markers with simple position controls.",
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
    detail: "Overlay a short label so shared copies stay clearly marked.",
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
    detail: "Lock a file behind a password before you send it out.",
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
    detail: "Open a protected file when you already have the password.",
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
    detail: "Turn photos or scans into a single PDF ready to store or send.",
    category: "convert",
    iconVariant: "stack",
    iconColor: "teal",
    iconMark: "J",
    minFiles: 1,
    maxFiles: 20,
    accept: "image/jpeg,image/png,image/jpg",
    enabled: true,
  },
  {
    id: "pdf-to-jpg",
    name: "PDF to JPG",
    href: "/tools/pdf-to-jpg",
    detail: "Export each page as an image for previews, posts, or markup.",
    category: "convert",
    iconVariant: "stack",
    iconColor: "magenta",
    iconMark: "I",
    minFiles: 1,
    maxFiles: 1,
    accept: "application/pdf",
    enabled: true,
  },
];

export const enabledTools = tools.filter((tool) => tool.enabled);

export function getTool(id: string): ToolConfig | undefined {
  return tools.find((tool) => tool.id === id);
}
