import Link from "next/link";
import type { CSSProperties } from "react";
import type { Brand, Drink } from "@/domain/types";
import { rankDrinks, reviewSummary } from "@/domain/catalogue";
import { isRated } from "@/domain/ratings";
import { brandPath, drinkPath } from "@/lib/paths";
import { ProductPhoto } from "@/components/drinks/ProductPhoto";
import { ReviewAction } from "@/components/editor/ReviewAction";
import { CommunityCompact } from "@/components/community/CommunityCompact";
import { Score } from "@/components/ratings/Score";

interface Props {
  brand: Brand;
  drinks: Drink[];
  index: number;
}
export function BrandCard({ brand, drinks, index }: Props) {
  const ordered = rankDrinks(drinks),
    rated = ordered.some((drink) => isRated(drink.review));
  return (
    <section className="brand-panel" aria-label={`${brand.name} catalogue`}>
      <Link
        className="brand-cover"
        href={brandPath(brand.name)}
        style={
          { "--color": brand.color, "--text": brand.text } as CSSProperties
        }
      >
        <span className="cover-arrow" aria-hidden="true">
          ↗
        </span>
        <span className="brand-index">
          {String(index + 1).padStart(2, "0")} / BRAND INDEX
        </span>
        <h2>{brand.name}</h2>
        <div className="cover-bottom">
          <span>{drinks.length} FLAVORS</span>
          <span>VIEW BRAND ↗</span>
        </div>
      </Link>
      <div className="list-heading">
        <span>{rated ? "TOP 4 PREVIEW" : "FLAVOR PREVIEW"}</span>
        <span>{rated ? "OVERALL ↓" : "UNRATED · A–Z"}</span>
      </div>
      {ordered.slice(0, 4).map((drink) => (
        <div className="preview-drink" key={drink.id}>
          <Link
            href={drinkPath(drink.id)}
            className="drink-row photo-row"
            aria-label={`${drink.name}. ${isRated(drink.review) ? `Overall ${drink.review.score?.toFixed(1)}` : "Unrated"}. Open details.`}
          >
            <ProductPhoto product={drink} className="mini-product" />
            <span>
              <span className="drink-name">{drink.name}</span>
              <span className="drink-note">{reviewSummary(drink)}</span>
            </span>
            <Score value={drink.review.score} compact />
          </Link>
          <CommunityCompact stats={drink.community} />
          <ReviewAction review={drink.review} />
        </div>
      ))}
      <Link className="brand-all-link" href={brandPath(brand.name)}>
        Browse all {drinks.length} flavors <span>→</span>
      </Link>
    </section>
  );
}
