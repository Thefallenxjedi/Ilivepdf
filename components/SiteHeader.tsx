import Image from "next/image";
import Link from "next/link";

type SiteHeaderProps = {
  activeToolHref?: string;
};

export function SiteHeader({ activeToolHref }: SiteHeaderProps) {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link className="brand-link" href="/" aria-label="iLivePDF home">
          <Image
            src="/ilivepdf-logo.png"
            alt="iLivePDF"
            width={220}
            height={64}
            className="brand-logo"
            priority
          />
        </Link>

        <nav className="main-nav" aria-label="Primary">
          <Link
            href="/tools/merge-pdf"
            className={activeToolHref === "/tools/merge-pdf" ? "is-active" : undefined}
          >
            Merge PDF
          </Link>
          <Link
            href="/tools/split-pdf"
            className={activeToolHref === "/tools/split-pdf" ? "is-active" : undefined}
          >
            Split PDF
          </Link>
          <Link
            href="/tools/compress-pdf"
            className={activeToolHref === "/tools/compress-pdf" ? "is-active" : undefined}
          >
            Compress PDF
          </Link>
          <Link href="/#tools">All PDF Tools</Link>
        </nav>
      </div>
    </header>
  );
}
