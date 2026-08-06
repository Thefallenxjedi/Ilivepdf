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
  position: "bottom-center" | "bottom-right" | "top-center";
  startFrom: number;
};
export type WatermarkOptions = {
  text: string;
  opacity: number;
};
export type ProtectOptions = {
  password: string;
};
export type UnlockOptions = {
  password: string;
};
export type JpgToPdfOptions = Record<string, never>;
export type PdfToJpgOptions = {
  quality: "balanced" | "high";
};

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
  | PdfToJpgOptions;

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
