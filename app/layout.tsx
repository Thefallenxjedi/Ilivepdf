import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "iLivePDF",
  description:
    "A quieter way to finish document work. Upload, process, name, and download PDFs with one trusted workflow.",
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
