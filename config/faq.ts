import type { ToolId } from "@/config/tools";

export type FaqItem = {
  question: string;
  answer: string;
};

export const homeFaqs: FaqItem[] = [
  {
    question: "What is iLivePDF?",
    answer:
      "iLivePDF is an online PDF toolkit for merging, splitting, compressing, converting, securing, and summarizing PDF files. Upload a PDF, choose a tool, name your download, and save the result.",
  },
  {
    question: "Are these PDF tools free to use?",
    answer:
      "Yes. Core PDF tools such as Merge PDF, Split PDF, Compress PDF, and Convert PDF run in your workflow without an account. AI PDF tools use your own free Gemini API key from Google AI Studio.",
  },
  {
    question: "Do I need to install software to edit a PDF?",
    answer:
      "No. iLivePDF works in your browser. Upload a PDF, run the tool, and download the updated PDF file directly.",
  },
  {
    question: "Is my PDF file private?",
    answer:
      "PDF files are processed for your request and are not kept as a long-term library. DocScan / Scan to PDF runs fully on-device with no upload. For Chat with PDF and Summarize PDF, your Gemini API key stays in your browser when you choose Remember key.",
  },
  {
    question: "Which PDF tasks can I do on iLivePDF?",
    answer:
      "You can merge PDF files, split a PDF, compress a PDF, rotate or organize PDF pages, add PDF page numbers or a watermark, protect or unlock a PDF, convert images and Office files to PDF, convert a PDF to images or Office formats, convert Markdown to PDF, scan documents to a searchable PDF with DocScan, and use AI to chat with a PDF or summarize a PDF.",
  },
  {
    question: "How do I download my PDF after processing?",
    answer:
      "Set a download name on the tool page, then press Download. iLivePDF saves the finished PDF (or ZIP of PDF outputs) automatically with the name you chose.",
  },
];

const toolFaqs: Record<ToolId, FaqItem[]> = {
  "merge-pdf": [
    {
      question: "How do I merge PDF files online?",
      answer:
        "Upload two or more PDF files, reorder them if needed, choose a download name, and download one combined PDF.",
    },
    {
      question: "Can I change the order before merging a PDF?",
      answer:
        "Yes. Use Up and Down on each PDF file so the merged PDF follows the order you want.",
    },
    {
      question: "Is Merge PDF free on iLivePDF?",
      answer:
        "Yes. Merge PDF is free to use in your browser without creating an account.",
    },
    {
      question: "What is the best way to combine multiple PDFs?",
      answer:
        "Upload every PDF you need, confirm the order, name the output PDF, and download. That keeps one clean PDF ready to share.",
    },
  ],
  "split-pdf": [
    {
      question: "How do I split a PDF into separate files?",
      answer:
        "Upload one PDF, choose extract PDF page ranges or save every PDF page on its own, then download the split PDF files.",
    },
    {
      question: "Can I extract only some PDF pages?",
      answer:
        "Yes. Use ranges such as 1-3,5 to pull those PDF pages into a new PDF file.",
    },
    {
      question: "Does Split PDF keep the original PDF?",
      answer:
        "Your uploaded PDF is used only to create the split output. Download the new PDF files when processing finishes.",
    },
  ],
  "compress-pdf": [
    {
      question: "How do I compress a PDF without losing readability?",
      answer:
        "Upload your PDF, pick a compression level, and download a smaller PDF that stays clear enough for everyday use.",
    },
    {
      question: "Will Compress PDF reduce email attachment size?",
      answer:
        "Yes. Compress PDF is built to shrink a heavy PDF so it is easier to send, store, or upload.",
    },
    {
      question: "Is online PDF compression free here?",
      answer: "Yes. Compress PDF on iLivePDF is free and runs from your browser.",
    },
  ],
  "rotate-pdf": [
    {
      question: "How do I rotate a PDF online?",
      answer:
        "Upload a PDF, choose 90, 180, or 270 degrees, then download the rotated PDF.",
    },
    {
      question: "Can I fix a sideways PDF scan?",
      answer:
        "Yes. Rotate PDF turns the PDF to the correct orientation before you share or archive it.",
    },
    {
      question: "Does Rotate PDF change the PDF content?",
      answer:
        "It changes orientation only. Text and images stay in the same PDF; they are turned to the angle you choose.",
    },
  ],
  "reverse-pdf": [
    {
      question: "How do I reverse PDF page order?",
      answer:
        "Upload one PDF and download a new PDF with the order flipped from last PDF page to first.",
    },
    {
      question: "When should I reverse a PDF?",
      answer:
        "Use Reverse PDF when a scan or export saved PDF pages backwards and you need the natural reading order.",
    },
    {
      question: "Is Reverse PDF free?",
      answer: "Yes. Reverse PDF is free on iLivePDF.",
    },
  ],
  "delete-pages": [
    {
      question: "How do I delete pages from a PDF?",
      answer:
        "Upload a PDF, enter the PDF page ranges to remove, and download a PDF that keeps only what you need.",
    },
    {
      question: "Can I remove blank PDF pages?",
      answer:
        "Yes. List the blank PDF page numbers in the ranges field and download the cleaned PDF.",
    },
    {
      question: "Will Delete PDF pages keep my original file?",
      answer:
        "You download a new PDF without the removed PDF pages. Use that file as your edited PDF copy.",
    },
  ],
  "extract-pages": [
    {
      question: "How do I extract pages from a PDF?",
      answer:
        "Upload a PDF, enter the PDF page ranges to keep, and download a new PDF with only those PDF pages.",
    },
    {
      question: "Can I pull one chapter out of a large PDF?",
      answer:
        "Yes. Enter the PDF page range for that section and download a smaller PDF for sharing or review.",
    },
    {
      question: "Does Extract PDF pages change the original PDF?",
      answer:
        "No. You get a new PDF built from the selected PDF pages while your upload is used only for processing.",
    },
  ],
  "organize-pdf": [
    {
      question: "How do I rearrange PDF pages?",
      answer:
        "Upload a PDF, reorder the PDF pages with Up and Down, then download the organized PDF.",
    },
    {
      question: "Can I fix a PDF that is out of order?",
      answer:
        "Yes. Organize PDF lets you move PDF pages until the document reads correctly, then save the new PDF.",
    },
    {
      question: "Is Organize PDF free to use?",
      answer: "Yes. Organize PDF is free in your browser on iLivePDF.",
    },
  ],
  "page-numbers": [
    {
      question: "How do I add page numbers to a PDF?",
      answer:
        "Upload a PDF, choose a number format, position, start value, colour, and font weight, then download the numbered PDF.",
    },
    {
      question: "Which PDF page number formats are available?",
      answer:
        "You can use 1, 2, 3; roman i, ii, iii; letters A, B, C; Page 1; or 1 / total pages.",
    },
    {
      question: "Can I skip the cover page when numbering a PDF?",
      answer:
        "Yes. Enable Skip first page (cover) so page numbers start on the second PDF page.",
    },
    {
      question: "Where can PDF page numbers appear?",
      answer:
        "Place PDF page numbers at top or bottom, and left, center, or right, using the position board.",
    },
  ],
  "watermark-pdf": [
    {
      question: "How do I watermark a PDF?",
      answer:
        "Upload a PDF, choose watermark text, pattern (single, diagonal, or grid), opacity, colour, and font size, then download the watermarked PDF.",
    },
    {
      question: "Can I tile a diagonal watermark across a PDF?",
      answer:
        "Yes. Choose the Diagonal tiled pattern and adjust horizontal and vertical tile spacing for your PDF.",
    },
    {
      question: "Why add a watermark to a PDF?",
      answer:
        "A PDF watermark helps mark drafts, ownership, or confidentiality when you share the PDF.",
    },
    {
      question: "Is Watermark PDF free?",
      answer: "Yes. Watermark PDF is free on iLivePDF.",
    },
  ],
  "protect-pdf": [
    {
      question: "How do I password protect a PDF?",
      answer:
        "Upload a PDF, set a password, and download a protected PDF that requires the password to open.",
    },
    {
      question: "Is Protect PDF secure enough for sharing?",
      answer:
        "Protect PDF adds password locking before you send the PDF. Use a strong password and share it through a separate channel.",
    },
    {
      question: "Can I lock a PDF for free?",
      answer: "Yes. Protect PDF is free to use on iLivePDF.",
    },
  ],
  "unlock-pdf": [
    {
      question: "How do I unlock a password-protected PDF?",
      answer:
        "Upload the protected PDF, enter the password you already have, and download an unlocked PDF.",
    },
    {
      question: "Do I need the PDF password to unlock it?",
      answer:
        "Yes. Unlock PDF only works when you already know the PDF password.",
    },
    {
      question: "Is Unlock PDF free?",
      answer: "Yes. Unlock PDF is free on iLivePDF when you have the password.",
    },
  ],
  "jpg-to-pdf": [
    {
      question: "How do I convert JPG to PDF?",
      answer:
        "Upload one or more JPG images, reorder them if needed, and download a single PDF.",
    },
    {
      question: "Can I put multiple photos into one PDF?",
      answer:
        "Yes. JPG to PDF accepts multiple images and builds one PDF ready to store or send.",
    },
    {
      question: "Is JPG to PDF free online?",
      answer: "Yes. Convert JPG to PDF for free on iLivePDF.",
    },
  ],
  "png-to-pdf": [
    {
      question: "How do I convert PNG to PDF?",
      answer:
        "Upload PNG images and download one PDF that includes each image as a PDF page.",
    },
    {
      question: "Can I combine several PNG files into a PDF?",
      answer:
        "Yes. Add multiple PNG files, set the order, and download a combined PDF.",
    },
    {
      question: "Is PNG to PDF free?",
      answer: "Yes. PNG to PDF is free on iLivePDF.",
    },
  ],
  "pdf-to-jpg": [
    {
      question: "How do I convert a PDF to JPG?",
      answer:
        "Upload a PDF, choose image quality, and download JPG files for each PDF page.",
    },
    {
      question: "Will PDF to JPG keep good quality?",
      answer:
        "Choose Balanced or High quality before download so each JPG from the PDF matches your needs.",
    },
    {
      question: "Is PDF to JPG free?",
      answer: "Yes. Convert PDF to JPG for free on iLivePDF.",
    },
  ],
  "pdf-to-png": [
    {
      question: "How do I convert a PDF to PNG?",
      answer:
        "Upload a PDF, pick quality, and download PNG images from each PDF page.",
    },
    {
      question: "When should I use PDF to PNG instead of JPG?",
      answer:
        "Use PDF to PNG when you want sharper graphics or transparent-friendly previews from the PDF.",
    },
    {
      question: "Is PDF to PNG free?",
      answer: "Yes. PDF to PNG is free on iLivePDF.",
    },
  ],
  "word-to-pdf": [
    {
      question: "How do I convert Word to PDF?",
      answer:
        "Upload a .doc or .docx file and download a stable PDF for sharing.",
    },
    {
      question: "Why convert a Word file to PDF?",
      answer:
        "A PDF keeps layout consistent when you send the file, so readers see the same PDF on any device.",
    },
    {
      question: "Is Word to PDF free?",
      answer: "Yes. Convert Word to PDF for free on iLivePDF.",
    },
  ],
  "pdf-to-word": [
    {
      question: "How do I convert a PDF to Word?",
      answer:
        "Upload a PDF and download a Word document you can edit.",
    },
    {
      question: "Will PDF to Word keep all formatting?",
      answer:
        "Complex PDF layouts may need light cleanup in Word after conversion. Text-based PDFs usually convert best.",
    },
    {
      question: "Is PDF to Word free?",
      answer: "Yes. Convert PDF to Word for free on iLivePDF.",
    },
  ],
  "ppt-to-pdf": [
    {
      question: "How do I convert PowerPoint to PDF?",
      answer:
        "Upload a .ppt or .pptx file and download a shareable PDF of your slides.",
    },
    {
      question: "Why save a presentation as a PDF?",
      answer:
        "A PDF is easy to send and review when recipients do not need to edit the slides.",
    },
    {
      question: "Is PPT to PDF free?",
      answer: "Yes. Convert PPT to PDF for free on iLivePDF.",
    },
  ],
  "pdf-to-ppt": [
    {
      question: "How do I convert a PDF to PowerPoint?",
      answer:
        "Upload a PDF and download a PPT file built from the PDF pages as slides.",
    },
    {
      question: "Can I edit the slides after PDF to PPT?",
      answer:
        "Yes. Open the downloaded presentation and edit the slides created from your PDF.",
    },
    {
      question: "Is PDF to PPT free?",
      answer: "Yes. Convert PDF to PPT for free on iLivePDF.",
    },
  ],
  "markdown-to-pdf": [
    {
      question: "How do I convert Markdown to PDF?",
      answer:
        "Paste Markdown or upload a .md file, set a download name, and download a clean PDF.",
    },
    {
      question: "Can I paste Markdown instead of uploading a file?",
      answer:
        "Yes. Paste Markdown into the editor, optionally add .md files, then download the PDF.",
    },
    {
      question: "Is Markdown to PDF free?",
      answer: "Yes. Convert Markdown to PDF for free on iLivePDF.",
    },
  ],
  "scan-to-pdf": [
    {
      question: "What is DocScan / Scan to PDF?",
      answer:
        "DocScan is an on-device Scan to PDF tool. It uses live edge tracking, auto-capture, perspective fix (homography), multi-page batch capture, and OCR to build a searchable PDF — without uploading your images to a server.",
    },
    {
      question: "Does Scan to PDF upload my photos?",
      answer:
        "No. DocScan runs on-device in your browser. Camera frames and gallery imports stay local while you build the PDF.",
    },
    {
      question: "How does auto-edge and perspective fix work?",
      answer:
        "DocScan uses Sobel edge detection to find document corners, then a homography warp to de-skew and flatten the page into a clean PDF page.",
    },
    {
      question: "Can I make a searchable OCR PDF?",
      answer:
        "Yes. Enable Searchable OCR, capture or import pages, then choose OCR → PDF. Text is recognized on-device and embedded in the PDF for search.",
    },
    {
      question: "Can I scan multiple pages into one PDF?",
      answer:
        "Yes. Use batch capture or gallery import to add multiple pages, then export one multi-page PDF.",
    },
  ],
  "chat-pdf": [
    {
      question: "How does Chat with PDF work?",
      answer:
        "Add your free Gemini API key, upload one or more PDF files, then ask questions about the PDF content in the chat.",
    },
    {
      question: "Do I need an API key for Chat with PDF?",
      answer:
        "Yes. Chat with PDF uses your own free Gemini key from Google AI Studio. The key stays in your browser if you choose Remember key.",
    },
    {
      question: "Can I ask questions across multiple PDF files?",
      answer:
        "Yes. Upload up to 10 PDF files and ask about any of the uploaded PDF content.",
    },
    {
      question: "Is Chat with PDF free?",
      answer:
        "iLivePDF does not charge for the tool. Gemini usage follows Google’s free API key limits for your account.",
    },
  ],
  "summarize-pdf": [
    {
      question: "How do I summarize a PDF online?",
      answer:
        "Add your Gemini API key, upload a PDF, choose a summary style, and generate a PDF summary you can copy or download.",
    },
    {
      question: "What summary styles are available for a PDF?",
      answer:
        "Choose Brief, Detailed, or Bullets to match how you want the PDF summary written.",
    },
    {
      question: "Do I need an API key to summarize a PDF?",
      answer:
        "Yes. Summarize PDF uses your free Gemini API key. Get one from Google AI Studio and paste it in the sidebar.",
    },
    {
      question: "Is Summarize PDF free?",
      answer:
        "The iLivePDF tool is free to use. Gemini requests use your own free API key and its quota.",
    },
  ],
};

export function getToolFaqs(toolId: ToolId): FaqItem[] {
  return toolFaqs[toolId] ?? [];
}
