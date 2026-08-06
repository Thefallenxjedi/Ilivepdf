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
      if (
        position !== "bottom-center" &&
        position !== "bottom-right" &&
        position !== "top-center"
      ) {
        throw new Error("Choose a valid page number position.");
      }
      return {
        position,
        startFrom: Number(formData.get("startFrom") ?? 1),
      };
    }
    case "watermark-pdf":
      return {
        text: String(formData.get("text") ?? ""),
        opacity: Number(formData.get("opacity") ?? 0.2),
      };
    case "protect-pdf":
    case "unlock-pdf":
      return { password: String(formData.get("password") ?? "") };
    case "jpg-to-pdf":
      return {};
    case "pdf-to-jpg": {
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
  if (!file.type) {
    const name = file.name.toLowerCase();
    if (toolAccept.includes("pdf") && name.endsWith(".pdf")) return true;
    if (toolAccept.includes("jpeg") && (name.endsWith(".jpg") || name.endsWith(".jpeg"))) {
      return true;
    }
    if (toolAccept.includes("png") && name.endsWith(".png")) return true;
    return false;
  }

  return toolAccept
    .split(",")
    .map((part) => part.trim())
    .some((type) => file.type === type || (type === "image/jpg" && file.type === "image/jpeg"));
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
