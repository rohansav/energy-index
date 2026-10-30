import { communityStats } from "./community-repository";
import type { Pool, PoolClient } from "pg";
import type { Catalogue, Review } from "@/domain/types";
import type { CatalogueRepository } from "./catalogue-repository";
import { catalogueSchema, parseReview, productSchema } from "./validation";

export class ReviewConflictError extends Error {
  constructor() {
    super("This review changed since it was opened. Reload before saving.");
  }
}
export const ratingKeys = [
  "score",
  "sweetness",
  "tartness",
  "dryness",
  "energy",
] as const;
export function reviewValues(review: Review) {
  return [
    ...ratingKeys.map((key) =>
      review[key] === null ? null : Math.round(review[key]! * 10),
    ),
    review.notes,
    review.body,
  ];
}

export async function readCatalogue(client: PoolClient): Promise<Catalogue> {
  const brands = (
    await client.query("SELECT name, color, text FROM brands ORDER BY position")
  ).rows;
  const rows = (
    await client.query(`SELECT p.metadata, r.* FROM products p
    LEFT JOIN editorial_reviews r ON r.product_id = p.id ORDER BY p.position`)
  ).rows;
  const parsed = catalogueSchema.parse({
    brands,
    products: rows.map((row) => row.metadata),
  });
  const drinks = parsed.products.map((product, i) => {
    const row = rows[i];
    if (!row.product_id)
      throw new Error(`Missing editorial review: ${product.id}`);
    const ratings = Object.fromEntries(
      ratingKeys.map((key) => [key, row[key] === null ? null : row[key] / 10]),
    );
    return {
      ...product,
      review: parseReview(
        {
          ...ratings,
          id: product.id,
          name: product.name,
          brand: product.brand,
          notes: row.notes,
          body: row.body,
        },
        product,
      ),
    };
  });
  return { brands: parsed.brands, drinks };
}

/** Trusted server-side storage. HTTP callers must authorize before invoking writes. */
export class PostgresCatalogueRepository implements CatalogueRepository {
  constructor(private pool: Pool) {}
  async getCatalogue(): Promise<Catalogue> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      const catalogue = await readCatalogue(client);
      const summaries = await communityStats(client);
      for (const drink of catalogue.drinks)
        if (summaries[drink.id]) drink.community = summaries[drink.id];
      await client.query("COMMIT");
      return catalogue;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async saveReview(
    id: string,
    raw: unknown,
    expectedVersion: number,
  ): Promise<number> {
    if (!Number.isSafeInteger(expectedVersion) || expectedVersion < 1)
      throw new Error("Invalid review version");
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const result = await client.query(
        "SELECT metadata FROM products WHERE id = $1",
        [id],
      );
      if (!result.rowCount) throw new Error("Unknown drink");
      const review = parseReview(
        raw,
        productSchema.parse(result.rows[0].metadata),
      );
      const saved = await client.query(
        `UPDATE editorial_reviews SET
        score=$1, sweetness=$2, tartness=$3, dryness=$4, energy=$5, notes=$6, body=$7,
        version=version+1, updated_at=now()
        WHERE product_id=$8 AND version=$9 RETURNING version`,
        [...reviewValues(review), id, expectedVersion],
      );
      if (!saved.rowCount) throw new ReviewConflictError();
      const version = saved.rows[0].version as number;
      await client.query(
        "INSERT INTO editorial_review_history(product_id,version,review) VALUES($1,$2,$3)",
        [id, version, review],
      );
      await client.query("COMMIT");
      return version;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
  async getReviewVersion(id: string): Promise<number> {
    const result = await this.pool.query(
      "SELECT version FROM editorial_reviews WHERE product_id=$1",
      [id],
    );
    if (!result.rowCount) throw new Error("Unknown drink");
    return result.rows[0].version;
  }
}
