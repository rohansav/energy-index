import type { Product } from "@/domain/types";
import { availabilityLabels } from "@/domain/catalogue";
export function ProductSources({ product }: { product: Product }) {
  return (
    <>
      <dl className="source-facts">
        <div>
          <dt>Product line</dt>
          <dd>{product.line}</dd>
        </div>
        <div>
          <dt>US availability</dt>
          <dd>{availabilityLabels[product.status]}</dd>
        </div>
        <div>
          <dt>Catalogue checked</dt>
          <dd>{product.checkedAt}</dd>
        </div>
      </dl>
      {product.statusNote && (
        <p className="availability-note">{product.statusNote}</p>
      )}
      <div className="source-links">
        <a href={product.source} target="_blank" rel="noopener noreferrer">
          Official product source ↗
        </a>
        <a href={product.imageSource} target="_blank" rel="noopener noreferrer">
          Original brand image ↗
        </a>
        {product.statusSource && (
          <a
            href={product.statusSource}
            target="_blank"
            rel="noopener noreferrer"
          >
            Availability reporting ↗
          </a>
        )}
      </div>
    </>
  );
}
