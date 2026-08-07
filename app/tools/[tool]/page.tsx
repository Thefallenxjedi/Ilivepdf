import { notFound } from "next/navigation";
import { DocScanWorkspace } from "@/components/scan/DocScanWorkspace";
import { ChatPdfWorkspace } from "@/components/ai/ChatPdfWorkspace";
import { SummarizePdfWorkspace } from "@/components/ai/SummarizePdfWorkspace";
import { FaqSection } from "@/components/FaqSection";
import { SiteHeader } from "@/components/SiteHeader";
import { ToolWorkspace } from "@/components/ToolWorkspace";
import { getToolFaqs } from "@/config/faq";
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
    return { title: "Tool not found" };
  }
  return {
    title: `${tool.name} Online — Free PDF Tool`,
    description: tool.detail,
  };
}

export default async function ToolPage({ params }: ToolPageProps) {
  const { tool: toolId } = await params;
  const tool = getTool(toolId);

  if (!tool || !tool.enabled) {
    notFound();
  }

  const workspace =
    tool.id === "scan-to-pdf" ? (
      <DocScanWorkspace tool={tool} />
    ) : tool.id === "chat-pdf" ? (
      <ChatPdfWorkspace tool={tool} />
    ) : tool.id === "summarize-pdf" ? (
      <SummarizePdfWorkspace tool={tool} />
    ) : (
      <ToolWorkspace tool={tool} />
    );

  const faqs = getToolFaqs(tool.id);

  return (
    <div className="site">
      <SiteHeader activeToolHref={tool.href} />
      <main
        className={`site-main tool-main${
          tool.category === "ai" || tool.category === "scan" ? " ai-tool-main" : ""
        }`}
      >
        {workspace}
        <FaqSection title={`${tool.name} FAQ`} items={faqs} className="tool-faq" />
      </main>
    </div>
  );
}
