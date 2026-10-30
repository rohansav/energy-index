import { readFile, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import type { Pool } from "pg";
import type { Catalogue } from "@/domain/types";
import { readCatalogue, reviewValues } from "./postgres-repository";

export async function migrateDatabase(pool: Pool) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock(73824001)");
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())`);
    for (const name of (await readdir("migrations"))
      .filter((name) => name.endsWith(".sql"))
      .sort()) {
      const sql = await readFile(path.join("migrations", name), "utf8");
      const checksum = createHash("sha256").update(sql).digest("hex");
      const previous = await client.query(
        "SELECT checksum FROM schema_migrations WHERE name=$1",
        [name],
      );
      if (previous.rowCount) {
        if (previous.rows[0].checksum !== checksum)
          throw new Error(`Applied migration changed: ${name}`);
        continue;
      }
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)",
        [name, checksum],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

/** One-time, transactional import. Re-running can verify, but never overwrite edits. */
export async function importCatalogue(pool: Pool, catalogue: Catalogue) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL SERIALIZABLE");
    await client.query(
      "LOCK TABLE brands, products, editorial_reviews, editorial_review_history IN EXCLUSIVE MODE",
    );
    const count = await client.query(`SELECT
      (SELECT count(*) FROM brands) + (SELECT count(*) FROM products) +
      (SELECT count(*) FROM editorial_reviews) AS total`);
    if (Number(count.rows[0].total) > 0) {
      if (!isDeepStrictEqual(await readCatalogue(client), catalogue))
        throw new Error(
          "Database already contains different content; import refused to protect edits",
        );
      await client.query("COMMIT");
      return "verified";
    }
    for (const [position, brand] of catalogue.brands.entries())
      await client.query(
        "INSERT INTO brands(name,position,color,text) VALUES($1,$2,$3,$4)",
        [brand.name, position, brand.color, brand.text],
      );
    for (const [position, drink] of catalogue.drinks.entries()) {
      const { review, ...product } = drink;
      await client.query(
        "INSERT INTO products(id,brand,position,metadata) VALUES($1,$2,$3,$4)",
        [product.id, product.brand, position, product],
      );
      await client.query(
        `INSERT INTO editorial_reviews(product_id,score,sweetness,tartness,dryness,energy,notes,body)
        VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [product.id, ...reviewValues(review)],
      );
      await client.query(
        "INSERT INTO editorial_review_history(product_id,version,review) VALUES($1,1,$2)",
        [product.id, review],
      );
    }
    if (!isDeepStrictEqual(await readCatalogue(client), catalogue))
      throw new Error("Import verification failed; rolling back");
    await client.query("COMMIT");
    return "imported";
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
