import { execFile } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

async function findLibreOfficeBinary() {
  const candidates = ["soffice", "libreoffice"];
  for (const binary of candidates) {
    try {
      await execFileAsync(binary, ["--version"]);
      return binary;
    } catch {
      // keep looking
    }
  }
  return null;
}

export async function convertWithLibreOffice(
  inputName: string,
  inputBytes: Uint8Array,
  targetExt: "pdf" | "docx" | "pptx",
) {
  const binary = await findLibreOfficeBinary();
  if (!binary) {
    throw new Error(
      "Office conversion needs LibreOffice installed on the server (soffice).",
    );
  }

  const dir = await mkdtemp(join(tmpdir(), "ilivepdf-office-"));
  const inputPath = join(dir, inputName);

  try {
    await writeFile(inputPath, inputBytes);
    await execFileAsync(binary, [
      "--headless",
      "--nologo",
      "--nofirststartwizard",
      "--convert-to",
      targetExt,
      "--outdir",
      dir,
      inputPath,
    ]);

    const base = inputName.replace(/\.[^/.]+$/, "");
    const outputPath = join(/*turbopackIgnore: true*/ dir, `${base}.${targetExt}`);
    const output = await readFile(/*turbopackIgnore: true*/ outputPath);
    return new Uint8Array(output);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}
