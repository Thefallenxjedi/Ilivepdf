import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "iLivePDF — Free Online PDF Tools",
    template: "%s | iLivePDF",
  },
  description:
    "Free online PDF tools to merge, split, compress, convert, protect, and summarize PDF files. Upload a PDF, process it, name it, and download.",
  keywords: [
    "PDF tools",
    "merge PDF",
    "compress PDF",
    "split PDF",
    "convert PDF",
    "online PDF editor",
    "free PDF",
    "iLivePDF",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
