import assert from "node:assert/strict";
import type { Pool } from "pg";
import type { Drink } from "../src/domain/types";
import { CommunityRepository } from "../src/server/community-repository";
import { PostgresCatalogueRepository } from "../src/server/postgres-repository";
export async function verifyCommunity(pool: Pool, drink: Drink) {
  const repo = new CommunityRepository(pool),
    editor = new PostgresCatalogueRepository(pool);
  const editorialBefore = (await editor.getCatalogue()).drinks.find(
    (d) => d.id === drink.id,
  )!.review;
  const a = {
      issuer: "https://test.example",
      subject: "member-a",
      owner: false,
    },
    b = { ...a, subject: "member-b" };
  const review = {
    ...drink.review,
    score: 8,
    sweetness: 0,
    tartness: null,
    dryness: 2,
    energy: null,
    notes: "Community only",
    body: "Literal <script> text",
  };
  await assert.rejects(() =>
    repo.save(drink.id, a, { version: 0, displayName: "A", review }),
  );
  await assert.rejects(() =>
    repo.save(drink.id, a, {
      version: 0,
      displayName: "Member A",
      review: { ...review, score: null },
    }),
  );
  const concurrent = await Promise.allSettled([
    repo.save(drink.id, a, { version: 0, displayName: "Member A", review }),
    repo.save(drink.id, a, { version: 0, displayName: "Member A", review }),
  ]);
  assert.equal(concurrent.filter((r) => r.status === "fulfilled").length, 1);
  await repo.save(drink.id, b, {
    version: 0,
    displayName: "Member B",
    review: { ...review, score: 6, sweetness: 4, energy: 5 },
  });
  let page = await repo.page(drink.id, "highest", 0);
  assert.equal(page.stats!.count, 2);
  assert.equal(page.stats!.average, 7);
  assert.equal(page.stats!.min, 6);
  assert.equal(page.stats!.max, 8);
  assert.deepEqual(page.stats!.sensory.sweetness, { average: 2, count: 2 });
  assert.deepEqual(page.stats!.sensory.energy, { average: 5, count: 1 });
  assert.deepEqual(page.stats!.sensory.tartness, { average: null, count: 0 });
  assert.equal(
    page.stats!.distribution.reduce((a, b) => a + b, 0),
    2,
  );
  assert.equal(page.reviews[0].review.score, 8);
  assert.equal(
    (await repo.page(drink.id, "lowest", 0)).reviews[0].review.score,
    6,
  );
  // User input cannot select someone else's identity: each actor only changes their own row.
  await repo.save(drink.id, b, {
    version: 1,
    displayName: "Member B",
    review: { ...review, score: 10 },
  });
  assert.equal((await repo.mine(drink.id, a)).review!.score, 8);
  assert.equal((await repo.page(drink.id, "newest", 0)).stats!.average, 9);
  await repo.save(drink.id, a, { version: 1 }, true);
  assert.equal((await repo.page(drink.id, "newest", 0)).stats!.count, 1);
  assert.equal((await repo.mine(drink.id, a)).review, null);
  await assert.rejects(() =>
    repo.save(drink.id, a, { version: 1, displayName: "Member A", review }),
  );
  await repo.save(drink.id, a, { version: 2, displayName: "Member A", review });
  assert.equal((await repo.page(drink.id, "newest", 0)).stats!.count, 2);
  assert.deepEqual(
    (await editor.getCatalogue()).drinks.find((d) => d.id === drink.id)!.review,
    editorialBefore,
  );
  const history = await pool.query(
    "SELECT count(*)::int AS n FROM community_review_history",
  );
  assert.equal(history.rows[0].n, 5);
  // Pagination has stable ordering and no duplicated users across pages.
  for (let i = 0; i < 20; i++)
    await repo.save(
      drink.id,
      { ...a, subject: `page-${i}` },
      { version: 0, displayName: `Member ${i}`, review },
    );
  const first = await repo.page(drink.id, "highest", 0),
    second = await repo.page(drink.id, "highest", first.nextOffset!);
  assert.equal(first.reviews.length, 20);
  assert.equal(second.reviews.length, 2);
  assert.equal(second.nextOffset, null);
  assert.equal(
    new Set([...first.reviews, ...second.reviews].map((r) => r.authorId)).size,
    22,
  );
}
