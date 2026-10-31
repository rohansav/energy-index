import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { loadFileCatalogue } from "../src/server/catalogue-repository";
import { parseReview } from "../src/server/validation";
import { filterDrinks, rankDrinks, brandSlug } from "../src/domain/catalogue";
import { isRated, scoreColor } from "../src/domain/ratings";
import source from "../src/data/catalogue.json";

const catalogue = await loadFileCatalogue();
const sample = catalogue.drinks[0];

test("migration preserves every product and every saved rating and note", async () => {
  const files = (await readdir("reviews")).filter((file) =>
    file.endsWith(".json"),
  );
  assert.equal(catalogue.drinks.length, files.length);
  assert.equal(catalogue.drinks.length, source.products.length);
  assert.equal(catalogue.brands.length, source.brands.length);
  for (const drink of catalogue.drinks) {
    const raw = JSON.parse(await readFile(`reviews/${drink.id}.json`, "utf8"));
    for (const key of [
      "score",
      "sweetness",
      "tartness",
      "dryness",
      "energy",
    ] as const) {
      assert.equal(
        drink.review[key],
        raw[key] == null || raw[key] === "" ? null : Number(raw[key]),
        `${drink.id}.${key}`,
      );
    }
    assert.equal(drink.review.notes, (raw.notes || "").trim());
    assert.equal(drink.review.body, (raw.body || "").trim());
  }
});

test("validation preserves explicit zero, accepts dropdown decimals, and rejects invalid inputs", () => {
  const review = parseReview(
    {
      ...sample.review,
      score: "8.6",
      energy: "0.0",
      tartness: "",
      body: "<script>text</script>",
    },
    sample,
  );
  assert.equal(review.score, 8.6);
  assert.equal(review.energy, 0);
  assert.equal(review.tartness, null);
  assert.equal(review.body, "<script>text</script>");
  for (const score of ["8.65", true, " ", "bad", 0, 10.1]) {
    assert.throws(() => parseReview({ ...sample.review, score }, sample));
  }
  assert.throws(
    () => parseReview({ ...sample.review, id: "wrong-drink" }, sample),
    /identity/,
  );
  assert.throws(() =>
    parseReview({ ...sample.review, body: "x".repeat(20001) }, sample),
  );
});

test("Overall alone determines rated status; intensity and notes cannot make a review rated", () => {
  const unrated = {
    ...sample,
    review: {
      ...sample.review,
      score: null,
      energy: 5,
      sweetness: 5,
      notes: "Tasted",
    },
  };
  const rated = {
    ...sample,
    id: "rated",
    review: { ...sample.review, score: 1 },
  };
  assert(!isRated(unrated.review));
  assert.deepEqual(
    filterDrinks([unrated, rated], { reviewStatus: "rated" }).map(
      (drink) => drink.id,
    ),
    ["rated"],
  );
  assert.deepEqual(
    filterDrinks([unrated, rated], { reviewStatus: "unrated" }).map(
      (drink) => drink.id,
    ),
    [sample.id],
  );
});

test("rankings are immutable, sort ties alphabetically, and put unrated last", () => {
  const a = { ...sample, name: "Z", review: { ...sample.review, score: null } };
  const b = { ...sample, name: "B", review: { ...sample.review, score: 8 } };
  const c = { ...sample, name: "A", review: { ...sample.review, score: 8 } };
  const list = [a, b, c];
  assert.deepEqual(
    rankDrinks(list).map((drink) => drink.name),
    ["A", "B", "Z"],
  );
  assert.equal(list[0], a);
});

test("brand, availability, status, aliases, and line filters combine", () => {
  const electric = catalogue.drinks.find(
    (drink) => drink.id === "celsius-electric-vibe",
  )!;
  assert(
    filterDrinks(catalogue.drinks, {
      query: "tropical freeze",
      line: electric.line,
      availability: "limited",
    }).some((drink) => drink.id === electric.id),
  );
  assert.equal(filterDrinks(catalogue.drinks, { query: "<script>" }).length, 0);
  for (const brand of catalogue.brands)
    assert.match(brandSlug(brand.name), /^[a-z-]+$/);
});

test("score colors follow the requested thresholds and interpolate tenths", () => {
  assert.equal(scoreColor(1), scoreColor(4));
  for (const [score, hue] of [
    [4, 0],
    [5, 20],
    [6, 32],
    [7, 50],
    [8, 72],
    [9, 105],
    [10, 135],
  ]) {
    assert(scoreColor(score).startsWith(`hsl(${hue.toFixed(1)} `));
  }
  assert.notEqual(scoreColor(7), scoreColor(7.1));
});
