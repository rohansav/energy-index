import Link from "next/link";
import { AutumnLeaves } from "./AutumnLeaves";
import type { Drink } from "@/domain/types";
import { assetPath, drinkPath } from "@/lib/paths";
import { ProductPhoto } from "@/components/drinks/ProductPhoto";
import { Score } from "@/components/ratings/Score";
import { CommunityCompact } from "@/components/community/CommunityCompact";

const selection = [
  { id: "alani-witch-s-brew", note: "Caramel apple" },
  { id: "red-bull-fuji-apple-ginger-apple-edition", note: "Apple & ginger" },
  { id: "monster-juice-bad-apple", note: "Apple" },
  { id: "bloom-crisp-apple", note: "Crisp apple" },
  { id: "celsius-sparkling-fuji-apple-pear", note: "Apple & pear" },
  { id: "monster-java-salted-caramel", note: "The coffee wildcard" },
];
export function MonthlyTheme({ drinks }: { drinks: Drink[] }) {
  return (
    <aside className="monthly-theme" aria-labelledby="monthly-theme-title">
      <AutumnLeaves />
      <div className="monthly-kicker">
        NOVEMBER{" "}
        <span className="monthly-title-emojis" aria-hidden="true">
          🍎 🍐 🍂
        </span>
      </div>
      <h2 id="monthly-theme-title">
        Fruits basket<span>.</span>
      </h2>
      <p className="monthly-description">
        Apples, pears, and a little caramel. Six cans for the fall shelf.
      </p>
      <div className="monthly-lineup monthly-lineup-stardew" aria-label="November drink selection" style={{ backgroundImage: `linear-gradient(#f5e8cd66, #f5e8cd66), url("${assetPath("assets/themes/stardew-fall.jpg")}")` }}>
        {selection.map(({ id }) => {
          const drink = drinks.find((item) => item.id === id);
          if (!drink) return null;
          return (
            <Link
              key={id}
              href={drinkPath(id)}
              className="monthly-lineup-item"
              aria-label={`Read ${drink.brand} ${drink.name} reviews`}
            >
              <ProductPhoto product={drink} className="monthly-lineup-can" />
            </Link>
          );
        })}
      </div>
      <div className="monthly-list-heading">
        <span>IN THE BASKET</span>
        <span>EDITOR / 10</span>
      </div>
      <div className="monthly-drinks">
        {selection.map(({ id, note }) => {
          const drink = drinks.find((item) => item.id === id);
          if (!drink) return null;
          return (
            <div className="monthly-drink" key={id}>
              <Link
                href={drinkPath(id)}
                className="monthly-drink-link"
                aria-label={`Read ${drink.brand} ${drink.name} reviews`}
              >
                <ProductPhoto product={drink} className="monthly-can" />
                <span className="monthly-drink-copy">
                  <small>{drink.brand}</small>
                  <strong>{drink.name}</strong>
                  <span>{note}</span>
                </span>
                <Score value={drink.review.score} compact />
              </Link>
              <CommunityCompact stats={drink.community} />
            </div>
          );
        })}
      </div>
    </aside>
  );
}
