"use client";
import Link from "next/link";
import { useLiveCatalogue } from "@/lib/live-catalogue";
import { useState } from "react";
import type { Catalogue, Drink } from "@/domain/types";
import { filterDrinks } from "@/domain/catalogue";
import { drinkPath } from "@/lib/paths";
import { Modal } from "@/components/ui/Modal";
import { DrinkDetail } from "@/components/drinks/DrinkDetail";
import { BrandCard } from "./BrandCard";
import { DrinkTable } from "./DrinkTable";

export function CatalogueView(initial: Catalogue) {
  const { brands, drinks } = useLiveCatalogue(initial);
  const [view, setView] = useState<"brands" | "all">("brands");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Drink | null>(null);
  const filtered = filterDrinks(drinks, { query });
  const shownBrands = brands.filter((brand) =>
    filtered.some((drink) => drink.brand === brand.name),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">THE CATALOGUE / 001</div>
          <h1>By brand.</h1>
          <p>US flavors, product details, and a place for every review.</p>
        </div>
        <div className="catalogue-stats">
          <strong>
            {String(brands.length).padStart(2, "0")} <span>brands</span>
          </strong>
          <strong>
            <span className="stat-number">{drinks.length}</span>{" "}
            <span>flavors</span>
          </strong>
        </div>
      </div>
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
          <p className="empty">No matches. Try a different brand or flavor.</p>
        ) : view === "brands" ? (
          <div className="brand-grid">
            {shownBrands.map((brand) => (
              <BrandCard
                key={brand.name}
                brand={brand}
                index={brands.indexOf(brand)}
                drinks={filtered.filter((drink) => drink.brand === brand.name)}
                onSelect={setSelected}
              />
            ))}
          </div>
        ) : (
          <DrinkTable drinks={filtered} onSelect={setSelected} />
        )}
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
      <Modal
        open={selected !== null}
        onClose={() => setSelected(null)}
        titleId="drink-dialog-title"
      >
        {selected && (
          <>
            <DrinkDetail
              drink={
                drinks.find((drink) => drink.id === selected.id) ?? selected
              }
              titleId="drink-dialog-title"
            />
            <Link className="full-review-link" href={drinkPath(selected.id)}>
              Open drink page →
            </Link>
          </>
        )}
      </Modal>
    </>
  );
}
