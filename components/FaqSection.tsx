import type { FaqItem } from "@/config/faq";

type FaqSectionProps = {
  title?: string;
  items: FaqItem[];
  className?: string;
};

export function FaqSection({
  title = "PDF FAQ",
  items,
  className,
}: FaqSectionProps) {
  if (!items.length) return null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <section className={className ? `faq-section ${className}` : "faq-section"} aria-labelledby="faq-heading">
      <h2 id="faq-heading">{title}</h2>
      <div className="faq-list">
        {items.map((item) => (
          <details className="faq-item" key={item.question}>
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}
