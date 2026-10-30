"use client";
import { useLiveCatalogue } from "@/lib/live-catalogue";
import { useState } from "react";
import type { Catalogue } from "@/domain/types";
import { isRated } from "@/domain/ratings";
import { filterDrinks } from "@/domain/catalogue";
import { MonthlyTheme } from "./MonthlyTheme";
import { BrandCard } from "./BrandCard";
import { DrinkTable } from "./DrinkTable";

export function CatalogueView(initial: Catalogue) {
  const { brands, drinks } = useLiveCatalogue(initial);
  const [view, setView] = useState<"brands" | "all">("brands");
  const [query, setQuery] = useState("");
  const [ratedOnly, setRatedOnly] = useState(false);
  const filtered = filterDrinks(drinks, { query }).filter(
    (drink) => !ratedOnly || isRated(drink.review),
  );
  const shownBrands = brands.filter((brand) =>
    filtered.some((drink) => drink.brand === brand.name),
  );
  return (
    <div className="catalogue-home">
      <div className="collection-heading">
        <h1>
          <span aria-hidden="true" />
          THE COLLECTION
        </h1>
        <div className="collection-receipt">
          <span>ON THE SHELF</span>
          <div>
            <strong>{drinks.length}</strong> drinks{" "}
            <strong>{String(brands.length).padStart(2, "0")}</strong> brands
          </div>
          <div className="collection-barcode" aria-hidden="true" />
        </div>
      </div>
      <div className="catalogue-columns">
        <MonthlyTheme drinks={drinks} />
        <section className="brand-catalogue" aria-label="Browse the catalogue">
          <div className="toolbar">
            <div className="views" aria-label="Catalogue layout">
              <button
                type="button"
                className={view === "brands" ? "selected" : ""}
                aria-pressed={view === "brands"}
                onClick={() => setView("brands")}
              >
                By brand
              </button>
              <button
                type="button"
                className={view === "all" ? "selected" : ""}
                aria-pressed={view === "all"}
                onClick={() => setView("all")}
              >
                All flavors
              </button>
            </div>
            <label className="reviewed-filter">
              <input
                type="checkbox"
                checked={ratedOnly}
                onChange={(e) => setRatedOnly(e.target.checked)}
              />{" "}
              Reviewed only
            </label>
            <label className="search">
              <span aria-hidden="true">⌕</span>
              <input
                type="search"
                aria-label="Search brands or drinks"
                placeholder="Find a brand or flavor"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <span className="sort-note">
              SCORED FIRST, THEN UNRATED <span aria-hidden="true">↓</span>
            </span>
          </div>
          <div className="results-meta">
            <span>
              {shownBrands.length} BRANDS / {filtered.length} FLAVORS
            </span>
            <span>OVERALL / UNRATED</span>
          </div>
          <div aria-live="polite">
            {!filtered.length ? (
              <p className="empty">
                No matches. Try a different brand or flavor.
              </p>
            ) : view === "brands" ? (
              <div className="brand-grid">
                {shownBrands.map((brand) => (
                  <BrandCard
                    key={brand.name}
                    brand={brand}
                    index={brands.indexOf(brand)}
                    drinks={filtered.filter(
                      (drink) => drink.brand === brand.name,
                    )}
                  />
                ))}
              </div>
            ) : (
              <DrinkTable drinks={filtered} />
            )}
          </div>
        </section>
      </div>
      <div className="catalogue-note">
        <span>CATALOGUE NOTES</span>
        <p>
          US brand catalogues checked October 29, 2026. Ratings are personal;
          unreviewed flavors are marked Unrated. Limited editions and uncertain
          availability are labeled. Product photos belong to their respective
          brands.
        </p>
      </div>
    </div>
  );
}
