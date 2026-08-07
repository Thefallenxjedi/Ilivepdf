import type { Metadata } from "next";
import { FaqSection } from "@/components/FaqSection";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolCatalog } from "@/components/ToolCatalog";
import { homeFaqs } from "@/config/faq";

export const metadata: Metadata = {
  title: "iLivePDF — Free Online PDF Tools to Merge, Compress, Convert & Edit PDF",
  description:
    "Free online PDF tools to merge PDF, split PDF, compress PDF, convert PDF, protect PDF, and more. Upload a PDF, finish the task, name your file, and download.",
};

export default function HomePage() {
  return (
    <div className="site">
      <SiteHeader />

      <main className="site-main">
        <section className="hero">
          <p className="hero-brand">iLivePDF</p>
          <h1>Free online PDF tools that stay clear and calm</h1>
          <p>
            Merge PDF, split PDF, compress PDF, convert PDF, and secure PDF files in one
            trusted path. Upload your PDF, finish the task, name the download, and save —
            without the noise of a crowded tool dump.
          </p>
        </section>

        <ToolCatalog />

        <FaqSection title="PDF FAQ" items={homeFaqs} />
      </main>
    </div>
  );
}
