import type { Catalogue } from "@/domain/types";
import { loadFileCatalogue } from "./file-catalogue";
import { PostgresCatalogueRepository } from "./postgres-repository";
import { databasePool } from "./database";
import { catalogueSchema, parseReview } from "./validation";

export { loadFileCatalogue } from "./file-catalogue";
export interface CatalogueRepository {
  getCatalogue(): Promise<Catalogue>;
}

/** Explicit selection: a configured database failure must never show stale files. */
function createRepository(): CatalogueRepository {
  const storage = process.env.CATALOGUE_STORAGE ?? "files";
  if (storage === "postgres")
    return new PostgresCatalogueRepository(databasePool());
  if (storage === "http") {
    let snapshot: Promise<Catalogue> | undefined;
    const load = async (): Promise<Catalogue> => {
      const url = process.env.NEXT_PUBLIC_CATALOGUE_API;
      if (!url?.startsWith("https://"))
        throw new Error("HTTPS catalogue API is required");
      const response = await fetch(`${url}/catalogue`, {
        signal: AbortSignal.timeout(30000),
      });
      if (!response.ok) throw new Error("Database catalogue API unavailable");
      const raw = await response.json();
      const { brands, products } = catalogueSchema.parse({
        brands: raw.brands,
        products: raw.drinks,
      });
      return {
        brands,
        drinks: products.map((product, i) => ({
          ...product,
          ...(raw.drinks[i].community
            ? { community: raw.drinks[i].community }
            : {}),
          review: parseReview(raw.drinks[i].review, product),
        })),
      };
    };
    return { getCatalogue: () => (snapshot ??= load()) };
  }
  if (storage !== "files") throw new Error("Invalid CATALOGUE_STORAGE");
  return { getCatalogue: loadFileCatalogue };
}
let repository: CatalogueRepository | undefined;
export const catalogueRepository: CatalogueRepository = {
  getCatalogue() {
    return (repository ??= createRepository()).getCatalogue();
  },
};
