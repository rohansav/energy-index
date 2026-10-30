"use client";
import { useLiveCatalogue } from "@/lib/live-catalogue";
import type { Drink } from "@/domain/types";
import { availabilityLabels, reviewBody } from "@/domain/catalogue";
import { isRated } from "@/domain/ratings";
import { Score } from "@/components/ratings/Score";
import { SensoryProfile } from "@/components/ratings/SensoryProfile";
import { ProductPhoto } from "./ProductPhoto";
import { ProductSources } from "./ProductSources";
import { ReviewText } from "./ReviewText";

export function DrinkDetail({
  drink: initialDrink,
  titleId,
  page = false,
}: {
  drink: Drink;
  titleId: string;
  page?: boolean;
}) {
  const catalogue = useLiveCatalogue({ brands: [], drinks: [initialDrink] });
  const drink =
    catalogue.drinks.find((item) => item.id === initialDrink.id) ??
    initialDrink;
  const Heading = page ? "h1" : "h2";
  return (
    <div className="drink-detail">
      <div className="eyebrow">
        {drink.brand.toUpperCase()} / {drink.line.toUpperCase()}
      </div>
      <div className="product-dialog-heading">
        <ProductPhoto product={drink} className="dialog-product" />
        <div>
          <Heading id={titleId}>{drink.name}</Heading>
          <Score value={drink.review.score} />
          <span className="availability-tag">
            {availabilityLabels[drink.status]}
          </span>
        </div>
      </div>
      <div className="note-label">
        {isRated(drink.review) ? "TASTING NOTES" : "CATALOGUE NOTES"}
      </div>
      <ReviewText text={reviewBody(drink)} />
      <SensoryProfile drink={drink} />
      <ProductSources product={drink} />
      <p className="sample-note">
        {isRated(drink.review)
          ? "Personal rating and tasting notes."
          : "Not yet reviewed. No score has been assigned."}{" "}
        Product images belong to their respective brands.
      </p>
    </div>
  );
}
