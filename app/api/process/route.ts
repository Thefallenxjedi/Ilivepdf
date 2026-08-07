import JSZip from "jszip";
import { enabledTools, getTool, type ToolId } from "@/config/tools";
import { runProcessing } from "@/core/processing/pipeline";
import type {
  CompressLevel,
  PageNumbersOptions,
  PdfToJpgOptions,
  ProcessOptions,
  RotateOptions,
  SplitMode,
} from "@/core/processing/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const ENABLED_IDS = new Set(enabledTools.map((tool) => tool.id));

function asToolId(value: FormDataEntryValue | null): ToolId {
  const id = String(value || "");
  if (!ENABLED_IDS.has(id as ToolId)) {
    throw new Error("Unsupported tool.");
  }
  return id as ToolId;
}

function parseOptions(toolId: ToolId, formData: FormData): ProcessOptions {
  switch (toolId) {
    case "merge-pdf": {
      const orderRaw = String(formData.get("order") ?? "");
      const order = orderRaw
        ? orderRaw
            .split(",")
            .map((value) => Number(value.trim()))
            .filter((value) => Number.isInteger(value))
        : undefined;
      return { order };
    }
    case "split-pdf": {
      const mode = String(formData.get("mode") ?? "ranges") as SplitMode;
      if (mode !== "ranges" && mode !== "every-page") {
        throw new Error("Choose a valid split mode.");
      }
      return { mode, ranges: String(formData.get("ranges") ?? "") };
    }
    case "compress-pdf": {
      const level = String(formData.get("level") ?? "balanced") as CompressLevel;
      if (level !== "strong" && level !== "balanced" && level !== "high") {
        throw new Error("Choose a valid compression level.");
      }
      return { level };
    }
    case "rotate-pdf": {
      const degrees = Number(formData.get("degrees") ?? 90) as RotateOptions["degrees"];
      if (degrees !== 90 && degrees !== 180 && degrees !== 270) {
        throw new Error("Choose 90, 180, or 270 degrees.");
      }
      return { degrees };
    }
    case "delete-pages":
    case "extract-pages":
      return { ranges: String(formData.get("ranges") ?? "") };
    case "organize-pdf": {
      const order = String(formData.get("order") ?? "")
        .split(",")
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isInteger(value));
      return { order };
    }
    case "page-numbers": {
      const position = String(
        formData.get("position") ?? "bottom-center",
      ) as PageNumbersOptions["position"];
      const allowedPositions = new Set([
        "top-left",
        "top-center",
        "top-right",
        "bottom-left",
        "bottom-center",
        "bottom-right",
      ]);
      if (!allowedPositions.has(position)) {
        throw new Error("Choose a valid page number position.");
      }

      const format = String(formData.get("format") ?? "numeric") as PageNumbersOptions["format"];
      const allowedFormats = new Set([
        "numeric",
        "roman",
        "letter",
        "page-label",
        "page-of",
      ]);
      if (!allowedFormats.has(format)) {
        throw new Error("Choose a valid number format.");
      }

      const weight = String(formData.get("weight") ?? "regular");
      if (weight !== "regular" && weight !== "bold") {
        throw new Error("Choose regular or bold.");
      }

      const color = String(formData.get("color") ?? "#333333");
      return {
        position,
        startFrom: Number(formData.get("startFrom") ?? 1),
        format,
        fontSize: Number(formData.get("fontSize") ?? 10),
        skipFirst: String(formData.get("skipFirst") ?? "false") === "true",
        color: /^#?[0-9a-fA-F]{3,8}$/.test(color)
          ? color.startsWith("#")
            ? color
            : `#${color}`
          : "#333333",
        weight,
      };
    }
    case "watermark-pdf": {
      const pattern = String(formData.get("pattern") ?? "diagonal");
      if (pattern !== "single" && pattern !== "diagonal" && pattern !== "grid") {
        throw new Error("Choose a valid watermark pattern.");
      }
      const opacityPct = Number(formData.get("opacity") ?? 15);
      const fontSize = Number(formData.get("fontSize") ?? 48);
      const gapX = Number(formData.get("gapX") ?? 200);
      const gapY = Number(formData.get("gapY") ?? 200);
      const color = String(formData.get("color") ?? "#8a8a8a");
      return {
        text: String(formData.get("text") ?? ""),
        opacity: Math.min(1, Math.max(0.03, opacityPct / 100)),
        pattern,
        fontSize: Math.min(120, Math.max(12, fontSize)),
        gapX: Math.min(480, Math.max(80, gapX)),
        gapY: Math.min(480, Math.max(80, gapY)),
        color: /^#?[0-9a-fA-F]{3,8}$/.test(color) ? (color.startsWith("#") ? color : `#${color}`) : "#8a8a8a",
      };
    }
    case "protect-pdf":
    case "unlock-pdf":
      return { password: String(formData.get("password") ?? "") };
    case "jpg-to-pdf":
    case "png-to-pdf":
    case "reverse-pdf":
    case "word-to-pdf":
    case "pdf-to-word":
    case "ppt-to-pdf":
    case "pdf-to-ppt":
    case "markdown-to-pdf":
      return {};
    case "pdf-to-jpg":
    case "pdf-to-png": {
      const quality = String(formData.get("quality") ?? "balanced") as PdfToJpgOptions["quality"];
      if (quality !== "balanced" && quality !== "high") {
        throw new Error("Choose a valid image quality.");
      }
      return { quality };
    }
    default:
      throw new Error("Unsupported tool options.");
  }
}

function isAllowedFile(toolAccept: string, file: File) {
  const name = file.name.toLowerCase();
  const acceptParts = toolAccept.split(",").map((part) => part.trim().toLowerCase());

  if (acceptParts.some((part) => part.startsWith(".") && name.endsWith(part))) {
    return true;
  }

  if (!file.type) {
    if (acceptParts.some((part) => part.includes("pdf")) && name.endsWith(".pdf")) return true;
    if (
      acceptParts.some((part) => part.includes("jpeg") || part.includes("jpg")) &&
      (name.endsWith(".jpg") || name.endsWith(".jpeg"))
    ) {
      return true;
    }
    if (acceptParts.some((part) => part.includes("png")) && name.endsWith(".png")) return true;
    if (
      acceptParts.some((part) => part.includes("word") || part.includes("msword")) &&
      (name.endsWith(".doc") || name.endsWith(".docx"))
    ) {
      return true;
    }
    if (
      acceptParts.some((part) => part.includes("presentation") || part.includes("powerpoint")) &&
      (name.endsWith(".ppt") || name.endsWith(".pptx"))
    ) {
      return true;
    }
    if (
      acceptParts.some(
        (part) =>
          part.includes("markdown") ||
          part === ".md" ||
          part === ".markdown" ||
          part === ".txt" ||
          part.includes("text/plain"),
      ) &&
      (name.endsWith(".md") || name.endsWith(".markdown") || name.endsWith(".txt"))
    ) {
      return true;
    }
    return false;
  }

  return acceptParts.some(
    (type) =>
      file.type === type ||
      (type === "image/jpg" && file.type === "image/jpeg") ||
      (type.includes("word") &&
        (file.type.includes("word") || file.type.includes("msword"))) ||
      (type.includes("presentation") && file.type.includes("presentation")) ||
      ((type.includes("markdown") || type === "text/plain") &&
        (file.type.includes("markdown") ||
          file.type === "text/plain" ||
          file.type === "text/x-markdown")),
  );
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const toolId = asToolId(formData.get("toolId"));
    const tool = getTool(toolId);

    if (!tool || !tool.enabled) {
      return Response.json({ error: "Tool not found." }, { status: 404 });
    }

    const uploaded = formData.getAll("files").filter((entry) => entry instanceof File);

    if (uploaded.length < tool.minFiles || uploaded.length > tool.maxFiles) {
      return Response.json(
        {
          error: `Upload between ${tool.minFiles} and ${tool.maxFiles} file(s).`,
        },
        { status: 400 },
      );
    }

    const files = [];

    for (const file of uploaded) {
      if (!isAllowedFile(tool.accept, file)) {
        return Response.json(
          { error: `"${file.name}" is not a supported file type for this tool.` },
          { status: 400 },
        );
      }

      if (file.size > MAX_FILE_BYTES) {
        return Response.json(
          { error: `"${file.name}" exceeds the 25MB limit.` },
          { status: 400 },
        );
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      files.push({
        name: file.name || "document",
        bytes: new Uint8Array(buffer),
      });
    }

    const result = await runProcessing({
      toolId,
      files,
      options: parseOptions(toolId, formData),
    });

    if (result.files.length === 1) {
      const output = result.files[0];
      return new Response(Buffer.from(output.bytes), {
        headers: {
          "Content-Type": output.mimeType,
          "Content-Disposition": `attachment; filename="${output.name}"`,
          "X-iLivePDF-Meta": JSON.stringify(result.meta ?? {}),
        },
      });
    }

    const zip = new JSZip();
    for (const file of result.files) {
      zip.file(file.name, file.bytes);
    }
    const zipBytes = await zip.generateAsync({ type: "uint8array" });

    return new Response(Buffer.from(zipBytes), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${toolId}-files.zip"`,
        "X-iLivePDF-Meta": JSON.stringify(result.meta ?? {}),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Processing failed.";
    return Response.json({ error: message }, { status: 400 });
  }
}
