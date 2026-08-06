import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolIcon } from "@/components/ToolIcon";
import { enabledTools } from "@/config/tools";

const filters = [
  "All",
  "Arrange",
  "Reduce size",
  "Mark up",
  "Secure",
  "Convert",
];

export default function HomePage() {
  return (
    <div className="site">
      <SiteHeader />

      <main className="site-main">
        <section className="hero">
          <p className="hero-brand">iLivePDF</p>
          <h1>A quieter way to finish document work</h1>
          <p>
            Upload once, follow one clear path, name your file, and download. Built for
            calm, trusted PDF workflows — not noisy tool catalogs.
          </p>
        </section>

        <section className="filters" aria-label="Filter tools">
          {filters.map((filter, index) => (
            <button
              key={filter}
              type="button"
              className={index === 0 ? "filter-chip is-active" : "filter-chip"}
            >
              {filter}
            </button>
          ))}
        </section>

        <section className="tools" id="tools">
          <div className="tools-grid">
            {enabledTools.map((tool) => (
              <Link className="tool-card tool-card-link" href={tool.href} key={tool.id}>
                <ToolIcon
                  variant={tool.iconVariant}
                  color={tool.iconColor}
                  mark={tool.iconMark}
                  title={tool.name}
                />
                <h2>{tool.name}</h2>
                <p>{tool.detail}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
