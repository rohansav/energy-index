import type { Brand } from "@/domain/types";
export function BrandSummary({ brand }: { brand: Brand }) {
  if (!brand.summary?.trim()) return null;
  return (
    <section
      className="brand-summary"
      aria-label={`Editor's take on ${brand.name}`}
    >
      <p className="eyebrow">EDITOR’S TAKE</p>
      <p className="brand-summary-copy">{brand.summary}</p>
    </section>
  );
}
