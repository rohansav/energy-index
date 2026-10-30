import { verifyCommunity } from "./community-storage";
import { test } from "node:test";
import assert from "node:assert/strict";
import { Pool } from "pg";
import { loadFileCatalogue } from "../src/server/file-catalogue";
import {
  migrateDatabase,
  importCatalogue,
} from "../src/server/migrate-database";
import {
  PostgresCatalogueRepository,
  ReviewConflictError,
} from "../src/server/postgres-repository";

test(
  "PostgreSQL migration, exact round trip, constraints, concurrent saves and import protection",
  {
    skip: !process.env.TEST_DATABASE_URL,
  },
  async () => {
    const pool = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    try {
      // Require an empty dedicated test database. Never reset or truncate user data.
      const existing = await pool.query(
        "SELECT to_regclass('public.products') AS table_name",
      );
      assert.equal(
        existing.rows[0].table_name,
        null,
        "Use a fresh test database",
      );
      const source = await loadFileCatalogue();
      await migrateDatabase(pool);
      await migrateDatabase(pool);
      assert.equal(await importCatalogue(pool, source), "imported");
      assert.equal(await importCatalogue(pool, source), "verified");
      const repository = new PostgresCatalogueRepository(pool);
      assert.deepEqual(await repository.getCatalogue(), source);
      const sample = source.drinks[0];
      await assert.rejects(() =>
        repository.saveReview(sample.id, { ...sample.review, score: 8.65 }, 1),
      );
      await assert.rejects(() =>
        repository.saveReview(sample.id, { ...sample.review, id: "wrong" }, 1),
      );
      await assert.rejects(() =>
        pool.query(
          "UPDATE editorial_reviews SET energy=51 WHERE product_id=$1",
          [sample.id],
        ),
      );
      await assert.rejects(() =>
        pool.query("UPDATE editorial_reviews SET score=9 WHERE product_id=$1", [
          sample.id,
        ]),
      );
      assert.equal(await repository.getReviewVersion(sample.id), 1);
      const updated = {
        ...sample.review,
        score: 8.1,
        energy: 0,
        sweetness: null,
        body: "Test only: ' Unicode ☕ <script> literal",
      };
      const saves = await Promise.allSettled([
        repository.saveReview(sample.id, updated, 1),
        repository.saveReview(sample.id, updated, 1),
      ]);
      assert.equal(
        saves.filter((result) => result.status === "fulfilled").length,
        1,
      );
      const rejected = saves.find((result) => result.status === "rejected");
      assert(
        rejected?.status === "rejected" &&
          rejected.reason instanceof ReviewConflictError,
      );
      assert.equal(await repository.getReviewVersion(sample.id), 2);
      const actual = await repository.getCatalogue();
      assert.deepEqual(actual.drinks[0].review, updated);
      await assert.rejects(
        () => importCatalogue(pool, source),
        /protect edits/,
      );
      assert.deepEqual(
        (await repository.getCatalogue()).drinks[0].review,
        updated,
      );
      const history = await pool.query(
        "SELECT review FROM editorial_review_history WHERE product_id=$1 ORDER BY version",
        [sample.id],
      );
      assert.deepEqual(
        history.rows.map((row) => row.review),
        [sample.review, updated],
      );
      await verifyCommunity(pool, sample);
    } finally {
      await pool.end();
    }
  },
);
