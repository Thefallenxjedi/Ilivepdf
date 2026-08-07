"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ToolIcon } from "@/components/ToolIcon";
import { enabledTools, type ToolCategory } from "@/config/tools";

type FilterId = "all" | ToolCategory;

const filters: Array<{ id: FilterId; label: string }> = [
  { id: "all", label: "All" },
  { id: "organize", label: "Arrange" },
  { id: "optimize", label: "Reduce size" },
  { id: "edit", label: "Mark up" },
  { id: "security", label: "Secure" },
  { id: "convert", label: "Convert" },
  { id: "scan", label: "DocScan" },
  { id: "ai", label: "AI tools" },
];

export function ToolCatalog() {
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");

  const visibleTools = useMemo(() => {
    if (activeFilter === "all") return enabledTools;
    return enabledTools.filter((tool) => tool.category === activeFilter);
  }, [activeFilter]);

  return (
    <>
      <section className="filters" aria-label="Filter tools">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={activeFilter === filter.id ? "filter-chip is-active" : "filter-chip"}
            onClick={() => setActiveFilter(filter.id)}
            aria-pressed={activeFilter === filter.id}
          >
            {filter.label}
          </button>
        ))}
      </section>

      <section className="tools" id="tools">
        {visibleTools.length > 0 ? (
          <div className="tools-grid">
            {visibleTools.map((tool) => (
              <Link className="tool-card tool-card-link" href={tool.href} key={tool.id}>
                <ToolIcon toolId={tool.id} title={tool.name} size={56} />
                <h2>{tool.name}</h2>
                <p>{tool.detail}</p>
              </Link>
            ))}
          </div>
        ) : (
          <div className="tools-empty">
            <h2>No tools in this section yet</h2>
            <p>Choose another category to browse available workflows.</p>
          </div>
        )}
      </section>
    </>
  );
}
