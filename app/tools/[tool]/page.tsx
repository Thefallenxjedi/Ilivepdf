import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { enabledTools, getTool } from "@/config/tools";

type ToolPageProps = {
  params: Promise<{ tool: string }>;
};

export function generateStaticParams() {
  return enabledTools.map((tool) => ({ tool: tool.id }));
}

export async function generateMetadata({ params }: ToolPageProps) {
  const { tool: toolId } = await params;
  const tool = getTool(toolId);
  if (!tool || !tool.enabled) {
    return { title: "Tool not found | iLivePDF" };
  }
  return {
    title: `${tool.name} | iLivePDF`,
    description: tool.detail,
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { tool: toolId } = await params;
  const tool = getTool(toolId);

  if (!tool || !tool.enabled) {
    notFound();
  }

  return (
    <div className="site">
      <SiteHeader activeToolHref={tool.href} />
      <main className="site-main tool-main">
        <ToolWorkspace tool={tool} />
      </main>
    </div>
  );
}
