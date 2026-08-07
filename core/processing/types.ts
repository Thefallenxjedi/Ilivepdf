import type { ToolId } from "@/config/tools";

export type ProcessInputFile = {
  name: string;
  bytes: Uint8Array;
};

export type MergeOptions = { order?: number[] };
export type SplitMode = "ranges" | "every-page";
export type SplitOptions = { mode: SplitMode; ranges?: string };
export type CompressLevel = "strong" | "balanced" | "high";
export type CompressOptions = { level: CompressLevel };
export type RotateOptions = { degrees: 90 | 180 | 270 };
export type DeletePagesOptions = { ranges: string };
export type ExtractPagesOptions = { ranges: string };
export type OrganizeOptions = { order: number[] };
export type PageNumbersOptions = {
  position:
    | "top-left"
    | "top-center"
    | "top-right"
    | "bottom-left"
    | "bottom-center"
    | "bottom-right";
  startFrom: number;
  format: "numeric" | "roman" | "letter" | "page-label" | "page-of";
  fontSize: number;
  skipFirst: boolean;
  color: string;
  weight: "regular" | "bold";
};
export type WatermarkOptions = {
  text: string;
  opacity: number;
  pattern: "single" | "diagonal" | "grid";
  fontSize: number;
  gapX: number;
  gapY: number;
  color: string;
};
export type ProtectOptions = {
  password: string;
};
export type UnlockOptions = {
  password: string;
};
export type JpgToPdfOptions = Record<string, never>;
export type PngToPdfOptions = Record<string, never>;
export type PdfToJpgOptions = {
  quality: "balanced" | "high";
};
export type PdfToPngOptions = {
  quality: "balanced" | "high";
};
export type ReverseOptions = Record<string, never>;
export type WordToPdfOptions = Record<string, never>;
export type PdfToWordOptions = Record<string, never>;
export type PptToPdfOptions = Record<string, never>;
export type PdfToPptOptions = Record<string, never>;
export type MarkdownToPdfOptions = Record<string, never>;

export type ProcessOptions =
  | MergeOptions
  | SplitOptions
  | CompressOptions
  | RotateOptions
  | DeletePagesOptions
  | ExtractPagesOptions
  | OrganizeOptions
  | PageNumbersOptions
  | WatermarkOptions
  | ProtectOptions
  | UnlockOptions
  | JpgToPdfOptions
  | PngToPdfOptions
  | PdfToJpgOptions
  | PdfToPngOptions
  | ReverseOptions
  | WordToPdfOptions
  | PdfToWordOptions
  | PptToPdfOptions
  | PdfToPptOptions
  | MarkdownToPdfOptions;

export type ProcessRequest = {
  toolId: ToolId;
  files: ProcessInputFile[];
  options: ProcessOptions;
};

export type ProcessOutputFile = {
  name: string;
  bytes: Uint8Array;
  mimeType: string;
};

export type ProcessResult = {
  files: ProcessOutputFile[];
  meta?: Record<string, string | number>;
};

export type Processor = {
  id: ToolId;
  process: (request: ProcessRequest) => Promise<ProcessResult>;
};
