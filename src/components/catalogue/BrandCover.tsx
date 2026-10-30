import Link from "next/link";
import type { Brand, Drink } from "@/domain/types";
import { assetPath, brandPath } from "@/lib/paths";
import { isRated } from "@/domain/ratings";
import { ProductPhoto } from "@/components/drinks/ProductPhoto";
const logos: Record<string, string> = {
  Monster: "monster.png",
  Celsius: "celsius.svg",
  Bloom: "bloom.svg",
  "Red Bull": "red-bull.svg",
  Ghost: "ghost-energy.svg",
  Alani: "alani-clean.png",
};
export function BrandCover({
  brand,
  ordered,
  index,
}: {
  brand: Brand;
  ordered: Drink[];
  index: number;
}) {
  return (
    <Link
      className="brand-cover"
      href={brandPath(brand.name)}
      aria-label={`${brand.name} brand index`}
    >
      <div className="cover-meta">
        <span className="brand-index">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span>{ordered.length} FLAVORS</span>
        <span className="cover-arrow" aria-hidden="true">
          ↗
        </span>
      </div>
      <div className="cover-body">
        <h2>
          <img
            className="brand-logo"
            src={assetPath(`assets/brands/${logos[brand.name]}`)}
            alt={brand.name}
          />
        </h2>
        <div className="cover-cans" aria-hidden="true">
          {ordered
            .slice(0, 3)
            .reverse()
            .map((drink) => (
              <ProductPhoto
                key={drink.id}
                product={drink}
                className="cover-can"
              />
            ))}
        </div>
      </div>
      <div className="cover-bottom">
        <span>{ordered.filter((d) => isRated(d.review)).length} REVIEWED</span>
        <span>BRAND INDEX</span>
      </div>
    </Link>
  );
}
