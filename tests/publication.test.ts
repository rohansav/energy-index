import { test } from "node:test";
import assert from "node:assert/strict";
import { confirmPublication } from "../src/lib/confirm-publication";
import { loadFileCatalogue } from "../src/server/file-catalogue";
const catalogue = await loadFileCatalogue();
const expected = {
  ...catalogue.drinks[0].review,
  score: 8.7,
  notes: "New notes",
};
const fresh = {
  ...catalogue,
  drinks: [{ ...catalogue.drinks[0], review: expected }],
};
const pause = async () => {};
test("publication waits for the full saved review, including notes", async () => {
  let reads = 0;
  await confirmPublication(
    expected,
    async () => {
      reads++;
      return reads < 3
        ? {
            ...fresh,
            drinks: [
              {
                ...fresh.drinks[0],
                review: { ...expected, notes: "Old notes" },
              },
            ],
          }
        : fresh;
    },
    pause,
  );
  assert.equal(reads, 3);
});
test("publication retries transient reads and confirms success", async () => {
  let reads = 0;
  await confirmPublication(
    expected,
    async () => {
      if (++reads === 1) throw new Error("Temporary outage");
      return fresh;
    },
    pause,
  );
  assert.equal(reads, 2);
});
test("publication stops polling with an honest saved-but-unconfirmed error", async () => {
  let reads = 0;
  await assert.rejects(
    confirmPublication(
      expected,
      async () => {
        reads++;
        return catalogue;
      },
      pause,
    ),
    /saved.*couldn't confirm/,
  );
  assert.equal(reads, 6);
});
