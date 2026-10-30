import React from "react";
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { ReviewForm, fields } from "../src/components/editor/ReviewForm";
import { handler as authorize } from "../src/api/authorizer";

test("editor renders every existing rating and both note fields, including zero and unrated", () => {
  const review = {
    id: "test",
    brand: "Test",
    name: "Test",
    score: 7.3,
    sweetness: 0,
    tartness: null,
    dryness: 1.5,
    energy: 2.5,
    notes: "Short note",
    body: "Long note",
  };
  const html = renderToStaticMarkup(
    <ReviewForm
      review={review}
      onChange={() => {}}
      onPublish={() => {}}
      busy={false}
      dirty={true}
    />,
  );
  assert.equal((html.match(/<select/g) || []).length, 5);
  assert.equal((html.match(/<textarea/g) || []).length, 2);
  assert.match(html, /value="0" selected=""/);
  assert.match(html, /value="" selected=""/);
  assert.match(html, /value="7.3" selected=""/);
  assert.match(html, /Short note/);
  assert.match(html, /Long note/);
  assert.deepEqual(
    fields.map((f) => f.label),
    ["Overall", "Sweetness", "Sourness", "Dryness", "Energy"],
  );
  assert.match(html, /Publish review/);
});
test("JWT-shaped credentials cannot fall back to GitHub identity", async () => {
  const original = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("Must not call GitHub");
  };
  try {
    assert.equal(
      (await authorize({ headers: { authorization: "Bearer fake.jwt.token" } }))
        .isAuthorized,
      false,
    );
  } finally {
    globalThis.fetch = original;
  }
});
