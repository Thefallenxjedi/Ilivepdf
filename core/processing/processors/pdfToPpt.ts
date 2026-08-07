import PptxGenJS from "pptxgenjs";
import type { ProcessRequest, ProcessResult, Processor } from "../types";
import { renderPdfPages } from "../renderPdfPages";
import { convertWithLibreOffice } from "../officeConvert";

export const pdfToPptProcessor: Processor = {
  id: "pdf-to-ppt",
  async process(request: ProcessRequest): Promise<ProcessResult> {
    if (request.files.length !== 1) {
      throw new Error("Upload one PDF file.");
    }

    const file = request.files[0];

    try {
      const bytes = await convertWithLibreOffice(
        file.name.endsWith(".pdf") ? file.name : "input.pdf",
        file.bytes,
        "pptx",
      );
      return {
        files: [
          {
            name: "slides.pptx",
            bytes,
            mimeType:
              "application/vnd.openxmlformats-officedocument.presentationml.presentation",
          },
        ],
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!message.includes("LibreOffice")) {
        throw error;
      }
    }

    const rendered = await renderPdfPages(file.bytes, "balanced", "png");
    const pptx = new PptxGenJS();
    pptx.defineLayout({ name: "ILIVE", width: 10, height: 7.5 });
    pptx.layout = "ILIVE";

    for (const image of rendered.files) {
      const slide = pptx.addSlide();
      const data = Buffer.from(image.bytes).toString("base64");
      slide.addImage({
        data: `data:image/png;base64,${data}`,
        x: 0,
        y: 0,
        w: "100%",
        h: "100%",
      });
    }

    const output = (await pptx.write({ outputType: "nodebuffer" })) as Buffer;
    return {
      files: [
        {
          name: "slides.pptx",
          bytes: new Uint8Array(output),
          mimeType:
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
        },
      ],
      meta: { pageCount: rendered.pageCount },
    };
  },
};
