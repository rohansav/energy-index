import type { Availability, Drink } from "./types";
import { isRated } from "./ratings";

export const availabilityLabels: Record<Availability, string> = {
  listed: "Listed by brand",
  limited: "Limited / seasonal",
  uncertain: "Availability uncertain",
  retiring: "Reported phase-out",
};
export const brandSlug = (name: string): string =>
  name.toLowerCase().replace(/[’']/g, "").replaceAll(" ", "-");
export const reviewSummary = (drink: Drink): string =>
  drink.review.notes || drink.catalogueNotes;
export function reviewBody(drink: Drink): string {
  return (
    drink.review.body ||
    (isRated(drink.review)
      ? "Rated personally. Written notes have not been added yet."
      : drink.catalogueDescription)
  );
}
export function rankDrinks(drinks: readonly Drink[]): Drink[] {
  return [...drinks].sort(
    (a, b) =>
      (b.review.score ?? -1) - (a.review.score ?? -1) ||
      a.name.localeCompare(b.name),
  );
}
export interface CatalogueFilters {
  query?: string;
  line?: string;
  availability?: Availability | "all";
  reviewStatus?: "all" | "rated" | "unrated";
  sort?: "score" | "name";
}
export function filterDrinks(
  drinks: readonly Drink[],
  filters: CatalogueFilters = {},
): Drink[] {
  const query = (filters.query || "").trim().toLowerCase();
  const filtered = drinks.filter((drink) => {
    const searchable = [
      drink.brand,
      drink.name,
      reviewSummary(drink),
      drink.line,
      ...drink.aliases,
    ]
      .join(" ")
      .toLowerCase();
    return (
      searchable.includes(query) &&
      (!filters.line ||
        filters.line === "all" ||
        drink.line === filters.line) &&
      (!filters.availability ||
        filters.availability === "all" ||
        drink.status === filters.availability) &&
      (!filters.reviewStatus ||
        filters.reviewStatus === "all" ||
        isRated(drink.review) === (filters.reviewStatus === "rated"))
    );
  });
  return filters.sort === "name"
    ? filtered.sort((a, b) => a.name.localeCompare(b.name))
    : rankDrinks(filtered);
}
