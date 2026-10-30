import Link from "next/link";
import type { Drink } from "@/domain/types";
import {
  availabilityLabels,
  reviewBody,
  reviewSummary,
} from "@/domain/catalogue";
import { isRated } from "@/domain/ratings";
import { drinkPath } from "@/lib/paths";
import { ReviewAction } from "@/components/editor/ReviewAction";
import { Score } from "@/components/ratings/Score";
import { SensoryProfile } from "@/components/ratings/SensoryProfile";
import { ProductPhoto } from "./ProductPhoto";
import { ProductSources } from "./ProductSources";
import { ReviewText } from "./ReviewText";

export function ReviewRow({ drink, rank }: { drink: Drink; rank: number }) {
  const rated = isRated(drink.review);
  return (
    <article className="excerpt-row" id={`review-${drink.id}`}>
      <span className="excerpt-rank">
        {rated ? String(rank).padStart(2, "0") : "—"}
      </span>
      <Link
        href={drinkPath(drink.id)}
        className="drink-thumbnail real-product"
        aria-label={`Read ${drink.name}`}
      >
        <ProductPhoto product={drink} className="product-photo" />
      </Link>
      <div className="excerpt-copy">
        <div className="eyebrow">
          {drink.line.toUpperCase()} <span>/</span>{" "}
          {rated ? "REVIEW" : "UNRATED"}
        </div>
        <h2>
          <Link href={drinkPath(drink.id)}>{drink.name}</Link>
        </h2>
        <ReviewText text={reviewBody(drink)} excerpt />
        <div className="excerpt-tags">
          <span>{availabilityLabels[drink.status]}</span>
          {reviewSummary(drink)
            .split(" · ")
            .map((note, index) => (
              <span key={index}>{note}</span>
            ))}
        </div>
        <SensoryProfile drink={drink} />
        <ReviewAction review={drink.review} />
        <details>
          <summary>
            Product details &amp; sources <span>+</span>
          </summary>
          <div className="expanded-notes">
            <ProductSources product={drink} />
            {!rated && <p>No personal tasting notes or rating yet.</p>}
          </div>
        </details>
      </div>
      <Score value={drink.review.score} />
    </article>
  );
}
