const INVALID_NAME_CHARS = /[<>:"/\\|?*\u0000-\u001f]/g;

export function stripExtension(filename: string) {
  return filename.replace(/\.[^/.]+$/, "");
}

export function sanitizeBaseName(value: string, fallback = "document") {
  const cleaned = value
    .trim()
    .replace(INVALID_NAME_CHARS, "")
    .replace(/\s+/g, " ")
    .replace(/[. ]+$/g, "");

  return cleaned || fallback;
}

export function withExtension(baseName: string, extension: string) {
  const normalizedExt = extension.startsWith(".") ? extension : `.${extension}`;
  const bare = sanitizeBaseName(stripExtension(baseName));
  return `${bare}${normalizedExt}`;
}

export function defaultOutputBaseName(toolId: string, files: File[]) {
  const first = files[0]?.name ? stripExtension(files[0].name) : "document";
  const safeFirst = sanitizeBaseName(first, "document");

  switch (toolId) {
    case "merge-pdf":
      return `${safeFirst}-merged`;
    case "split-pdf":
      return `${safeFirst}-split`;
    case "compress-pdf":
      return `${safeFirst}-compressed`;
    case "rotate-pdf":
      return `${safeFirst}-rotated`;
    case "delete-pages":
      return `${safeFirst}-edited`;
    case "extract-pages":
      return `${safeFirst}-extracted`;
    case "organize-pdf":
      return `${safeFirst}-organized`;
    case "page-numbers":
      return `${safeFirst}-numbered`;
    case "watermark-pdf":
      return `${safeFirst}-watermarked`;
    case "protect-pdf":
      return `${safeFirst}-protected`;
    case "unlock-pdf":
      return `${safeFirst}-unlocked`;
    case "jpg-to-pdf":
    case "png-to-pdf":
      return files.length > 1 ? "images" : safeFirst;
    case "pdf-to-jpg":
    case "pdf-to-png":
      return `${safeFirst}-images`;
    case "reverse-pdf":
      return `${safeFirst}-reversed`;
    case "word-to-pdf":
    case "ppt-to-pdf":
    case "markdown-to-pdf":
      return safeFirst;
    case "pdf-to-word":
      return `${safeFirst}-word`;
    case "pdf-to-ppt":
      return `${safeFirst}-slides`;
    default:
      return safeFirst;
  }
}

export function resolveDownloadName(
  outputName: string,
  serverFilename: string,
  contentType: string,
) {
  const serverExt = serverFilename.includes(".")
    ? serverFilename.slice(serverFilename.lastIndexOf("."))
    : "";

  let extension = serverExt;
  if (!extension) {
    if (contentType.includes("zip")) extension = ".zip";
    else if (contentType.includes("jpeg") || contentType.includes("jpg")) extension = ".jpg";
    else if (contentType.includes("png")) extension = ".png";
    else if (contentType.includes("wordprocessingml") || contentType.includes("msword")) {
      extension = ".docx";
    } else if (contentType.includes("presentationml")) extension = ".pptx";
    else extension = ".pdf";
  }

  return withExtension(outputName, extension);
}
