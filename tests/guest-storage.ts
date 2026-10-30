import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import type { Pool } from "pg";
import type { Drink } from "../src/domain/types";
import { guestActor, limitGuest } from "../src/server/guest-reviews";
import { CommunityRepository } from "../src/server/community-repository";
export async function verifyGuests(pool: Pool, drink: Drink) {
  const repo = new CommunityRepository(pool);
  const a = guestActor(randomBytes(32).toString("hex")),
    b = guestActor(randomBytes(32).toString("hex"));
  await repo.save(drink.id, a, {
    version: 0,
    displayName: "Spoofed editor",
    review: { ...drink.review, score: 7.4 },
  });
  assert.equal((await repo.mine(drink.id, b)).review, null);
  await assert.rejects(() => repo.save(drink.id, b, { version: 1 }, true));
  const page = await repo.page(drink.id, "newest", 0);
  assert.equal(page.reviews[0].displayName, "Anonymous");
  assert.notEqual(page.reviews[0].authorId, a.subject);
  await repo.save(drink.id, a, {
    version: 1,
    review: { ...drink.review, score: 8.2 },
  });
  assert.equal((await repo.mine(drink.id, a)).review?.score, 8.2);
  await repo.save(drink.id, a, { version: 2 }, true);
  assert.equal((await repo.mine(drink.id, a)).review, null);
  process.env.GUEST_RATE_SECRET = "test-only-secret";
  const attempts = await Promise.allSettled(
    Array.from({ length: 11 }, () => limitGuest(pool, a.subject, "192.0.2.1")),
  );
  assert.equal(attempts.filter((x) => x.status === "fulfilled").length, 10);
  const keys = await pool.query("SELECT key FROM guest_rate_limits");
  assert(keys.rows.every((r) => /^[a-f0-9]{64}$/.test(r.key)));
  for (let i = 0; i < 10; i++)
    await limitGuest(pool, `another-${i}`, "192.0.2.1");
  await assert.rejects(
    () => limitGuest(pool, "another-new", "192.0.2.1"),
    /Too many/,
  );
}
