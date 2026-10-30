import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import catalogueSource from "@/data/catalogue.json";
import type { Catalogue } from "@/domain/types";
import { catalogueSchema, parseReview } from "./validation";

/** Public pages depend on this interface, not on Git files or a future database. */
export interface CatalogueRepository {
  getCatalogue(): Promise<Catalogue>;
}
export async function loadFileCatalogue(
  root = process.cwd(),
): Promise<Catalogue> {
  const { brands, products } = catalogueSchema.parse(catalogueSource);
  const brandNames = new Set(brands.map((brand) => brand.name));
  const productIds = new Set(products.map((product) => product.id));
  if (brandNames.size !== brands.length || productIds.size !== products.length)
    throw new Error("Duplicate catalogue identity");
  const reviewFiles = (await readdir(path.join(root, "reviews"))).filter(
    (file) => file.endsWith(".json"),
  );
  if (
    reviewFiles.length !== products.length ||
    reviewFiles.some((file) => !productIds.has(file.slice(0, -5)))
  ) {
    throw new Error(
      "Every product must have exactly one review file; unexpected review found",
    );
  }
  const drinks = await Promise.all(
    products.map(async (product) => {
      if (!brandNames.has(product.brand))
        throw new Error(`Unknown brand for ${product.id}`);
      if ((await stat(path.join(root, product.image))).size < 1000)
        throw new Error(`Missing product image: ${product.id}`);
      const raw: unknown = JSON.parse(
        await readFile(
          path.join(root, "reviews", `${product.id}.json`),
          "utf8",
        ),
      );
      return { ...product, review: parseReview(raw, product) };
    }),
  );
  return { brands, drinks };
}
let catalogue: Promise<Catalogue> | undefined;
export const catalogueRepository: CatalogueRepository = {
  getCatalogue() {
    return (catalogue ??= loadFileCatalogue());
  },
};
