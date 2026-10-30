import Link from "next/link";
import { BrandCover } from "./BrandCover";
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
  const ordered = rankDrinks(drinks);
  const editorTop = ordered
    .filter((drink) => isRated(drink.review))
    .slice(0, 3);
  const communityTop = drinks
    .filter((drink) => (drink.community?.count ?? 0) > 0)
    .sort(
      (a, b) =>
        b.community!.average - a.community!.average ||
        a.name.localeCompare(b.name),
    )
    .slice(0, 3);
  return (
    <section
      data-brand={brand.name}
      className="brand-panel"
      aria-label={`${brand.name} catalogue`}
    >
      <BrandCover brand={brand} ordered={ordered} index={index} />
      <div className="list-heading">
        <span>EDITOR TOP 3</span>
        <span>OVERALL ↓</span>
      </div>
      {!editorTop.length && (
        <p className="ranking-empty">No editor ratings yet.</p>
      )}
      {editorTop.map((drink, rank) => (
        <div className="preview-drink" key={drink.id}>
          <Link
            href={drinkPath(drink.id)}
            className="drink-row photo-row"
            aria-label={`${drink.name}. ${isRated(drink.review) ? `Overall ${drink.review.score?.toFixed(1)}` : "Unrated"}. Open details.`}
          >
            <span className="preview-rank">
              {String(rank + 1).padStart(2, "0")}
            </span>
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
      {
        <>
          <div className="list-heading">
            <span>COMMUNITY TOP 3</span>
            <span>AVERAGE / 10</span>
          </div>
          {!communityTop.length && (
            <p className="ranking-empty">No community ratings yet.</p>
          )}
          {communityTop.map((drink, rank) => (
            <div className="preview-drink" key={drink.id}>
              <Link
                href={drinkPath(drink.id)}
                className="drink-row photo-row community-preview-row"
              >
                <span className="preview-rank" aria-hidden="true">
                  {String(rank + 1).padStart(2, "0")}
                </span>
                <ProductPhoto product={drink} className="mini-product" />
                <span>
                  <span className="drink-name">{drink.name}</span>
                  <span className="drink-note">
                    {drink.community!.count} community{" "}
                    {drink.community!.count === 1 ? "review" : "reviews"}
                  </span>
                </span>
                <Score value={drink.community!.average} compact />
              </Link>
            </div>
          ))}
        </>
      }
      <Link className="brand-all-link" href={brandPath(brand.name)}>
        Browse all {drinks.length} flavors <span>→</span>
      </Link>
    </section>
  );
}
