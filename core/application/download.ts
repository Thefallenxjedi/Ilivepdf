import { resolveDownloadName } from "./outputName";

export function downloadBlob(blob: Blob, preferredName: string, serverFilename = "") {
  const filename = resolveDownloadName(
    preferredName,
    serverFilename,
    blob.type || "application/octet-stream",
  );

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();

  // Keep the blob URL alive briefly so the browser can finish starting the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);

  return filename;
}
