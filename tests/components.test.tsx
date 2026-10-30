import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { loadFileCatalogue } from "../src/server/catalogue-repository";
import { CatalogueView } from "../src/components/catalogue/CatalogueView";
import { BrandView } from "../src/components/catalogue/BrandView";
import { DrinkDetail } from "../src/components/drinks/DrinkDetail";
import { Score } from "../src/components/ratings/Score";
import { ScoringGuide } from "../src/components/ratings/ScoringGuide";
import { ReviewText } from "../src/components/drinks/ReviewText";
import { SensoryProfile } from "../src/components/ratings/SensoryProfile";

const catalogue = await loadFileCatalogue();
test("catalogue server render has six brand cards and four previews per brand", () => {
  const html = renderToStaticMarkup(<CatalogueView {...catalogue} />);
  assert.equal((html.match(/class="brand-panel"/g) || []).length, 6);
  assert.equal((html.match(/class="drink-row photo-row"/g) || []).length, 24);
  assert(html.includes(String(catalogue.drinks.length)));
});
test("all brand pages render every drink and individual drink-page links", () => {
  for (const brand of catalogue.brands) {
    const drinks = catalogue.drinks.filter(
      (drink) => drink.brand === brand.name,
    );
    const html = renderToStaticMarkup(
      <BrandView brand={brand} brands={catalogue.brands} drinks={drinks} />,
    );
    assert.equal(
      (html.match(/class="excerpt-row"/g) || []).length,
      drinks.length,
    );
    for (const drink of drinks)
      assert(new RegExp(`href="/drinks/${drink.id}/?"`).test(html));
  }
});
test("review prose is escaped and paragraph boundaries are preserved", () => {
  const html = renderToStaticMarkup(
    <ReviewText text={"<script>alert(1)</script>\n\nSecond paragraph"} />,
  );
  assert(!html.includes("<script>"));
  assert(html.includes("&lt;script&gt;"));
  assert.equal((html.match(/<p>/g) || []).length, 2);
});
test("shared scores, guide, detail and sensory components preserve ratings", () => {
  const drink = {
    ...catalogue.drinks[0],
    review: {
      ...catalogue.drinks[0].review,
      score: 7.3,
      sweetness: 0,
      energy: 2.4,
    },
  };
  assert.match(renderToStaticMarkup(<Score value={7.3} />), /7\.3/);
  assert.match(renderToStaticMarkup(<Score value={null} compact />), /Unrated/);
  const profile = renderToStaticMarkup(<SensoryProfile drink={drink} />);
  assert(profile.includes("0.0"));
  assert(profile.includes("2.4 / 5"));
  assert(profile.includes("Sourness"));
  assert.match(
    renderToStaticMarkup(
      <DrinkDetail drink={drink} titleId="test-title" page />,
    ),
    /<h1 id="test-title"/,
  );
  const guide = renderToStaticMarkup(<ScoringGuide titleId="guide-title" />);
  assert(guide.includes("Energy · 0.0–5.0"));
  assert(guide.includes("Sourness"));
});
