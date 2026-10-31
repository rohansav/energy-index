"use client";
import Link from "next/link";
import { useLiveCatalogue } from "@/lib/live-catalogue";
import { useState, type CSSProperties } from "react";
import type { Brand, Drink } from "@/domain/types";
import {
  filterDrinks,
  rankDrinks,
  type CatalogueFilters,
} from "@/domain/catalogue";
import { brandPath } from "@/lib/paths";
import { ReviewRow } from "@/components/drinks/ReviewRow";
import { BrandSummary } from "./BrandSummary";
import { BrandFilters } from "./BrandFilters";

interface Props {
  brand: Brand;
  brands: Brand[];
  drinks: Drink[];
}
export function BrandView({ brand, brands, drinks: initialDrinks }: Props) {
  const catalogue = useLiveCatalogue({ brands, drinks: initialDrinks });
  const drinks = catalogue.drinks.filter((drink) => drink.brand === brand.name);
  const [filters, setFilters] = useState<CatalogueFilters>({ sort: "score" });
  const ranked = rankDrinks(drinks);
  const shown = filterDrinks(drinks, filters);
  const lines = [...new Set(drinks.map((drink) => drink.line))];
  return (
    <div
      style={
        {
          "--brand-color": brand.color,
          "--brand-ink": brand.text,
        } as CSSProperties
      }
    >
      <Link href="/" className="back-link">
        ← All brands
      </Link>
      <section className="brand-page-heading">
        <div>
          <div className="eyebrow">
            BRAND INDEX /{" "}
            {String(
              brands.findIndex((item) => item.name === brand.name) + 1,
            ).padStart(2, "0")}
          </div>
          <h1>
            {brand.name}
            <span>.</span>
          </h1>
          <p>
            The US flavor catalogue. Rated drinks first, unrated flavors after.
          </p>
        </div>
        <div className="brand-page-stat">
          <strong>{String(drinks.length).padStart(2, "0")}</strong>
          <span>FLAVORS LISTED</span>
        </div>
      </section>
      <BrandSummary brand={catalogue.brands.find(item => item.name === brand.name) ?? brand} />
      <nav className="brand-navigation" aria-label="Browse brands">
        {brands.map((item) => (
          <Link
            key={item.name}
            href={brandPath(item.name)}
            aria-current={item.name === brand.name ? "page" : undefined}
          >
            {item.name}
          </Link>
        ))}
      </nav>
      <BrandFilters filters={filters} lines={lines} onChange={setFilters} />
      <div className="brand-list-toolbar">
        <span>
          {shown.length} OF {drinks.length} FLAVORS
        </span>
        <label>
          ORDER{" "}
          <select
            value={filters.sort}
            onChange={(event) =>
              setFilters({
                ...filters,
                sort: event.target.value as "score" | "name",
              })
            }
          >
            <option value="score">Overall, then unrated</option>
            <option value="name">Flavor A–Z</option>
          </select>
        </label>
      </div>
      <div aria-live="polite">
        {shown.length ? (
          shown.map((drink) => (
            <ReviewRow
              key={drink.id}
              drink={drink}
              rank={ranked.findIndex((item) => item.id === drink.id) + 1}
            />
          ))
        ) : (
          <p className="empty">
            No flavors match these filters. Try another search or select “All.”
          </p>
        )}
      </div>
      <p className="brand-preview-note">
        US catalogue checked October 29, 2026 · Product images © their
        respective brands.
        <br />
        Listings are not a guarantee of local stock. Discontinued archive
        deferred.
      </p>
    </div>
  );
}
