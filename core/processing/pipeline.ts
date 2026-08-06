import { compressProcessor } from "./processors/compress";
import { deletePagesProcessor } from "./processors/deletePages";
import { extractPagesProcessor } from "./processors/extractPages";
import { jpgToPdfProcessor } from "./processors/jpgToPdf";
import { mergeProcessor } from "./processors/merge";
import { organizeProcessor } from "./processors/organize";
import { pageNumbersProcessor } from "./processors/pageNumbers";
import { pdfToJpgProcessor } from "./processors/pdfToJpg";
import { protectProcessor } from "./processors/protect";
import { rotateProcessor } from "./processors/rotate";
import { splitProcessor } from "./processors/split";
import { unlockProcessor } from "./processors/unlock";
import { watermarkProcessor } from "./processors/watermark";
import type { ProcessRequest, ProcessResult, Processor } from "./types";

const processors: Record<string, Processor> = {
  [mergeProcessor.id]: mergeProcessor,
  [splitProcessor.id]: splitProcessor,
  [compressProcessor.id]: compressProcessor,
  [rotateProcessor.id]: rotateProcessor,
  [deletePagesProcessor.id]: deletePagesProcessor,
  [extractPagesProcessor.id]: extractPagesProcessor,
  [organizeProcessor.id]: organizeProcessor,
  [pageNumbersProcessor.id]: pageNumbersProcessor,
  [watermarkProcessor.id]: watermarkProcessor,
  [protectProcessor.id]: protectProcessor,
  [unlockProcessor.id]: unlockProcessor,
  [jpgToPdfProcessor.id]: jpgToPdfProcessor,
  [pdfToJpgProcessor.id]: pdfToJpgProcessor,
};

export async function runProcessing(request: ProcessRequest): Promise<ProcessResult> {
  if (!request.files.length) {
    throw new Error("No files were provided.");
  }

  for (const file of request.files) {
    if (!file.bytes.byteLength) {
      throw new Error(`File "${file.name}" is empty.`);
    }
  }

  const processor = processors[request.toolId];
  if (!processor) {
    throw new Error("Unsupported tool.");
  }

  return processor.process(request);
}
