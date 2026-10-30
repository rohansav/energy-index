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

test("publish button distinguishes pending, confirmed, edited and retry states", () => {
  const review = {
    id: "test",
    brand: "Test",
    name: "Test",
    score: 7,
    sweetness: null,
    tartness: null,
    dryness: null,
    energy: null,
    notes: "",
    body: "",
  };
  const render = (state: {
    busy: boolean;
    dirty: boolean;
    published?: boolean;
    awaitingConfirmation?: boolean;
  }) =>
    renderToStaticMarkup(
      <ReviewForm
        review={review}
        onChange={() => {}}
        onPublish={() => {}}
        {...state}
      />,
    );
  const busy = render({ busy: true, dirty: false });
  assert.match(busy, /Publishing…/);
  assert.match(busy, /aria-busy="true"/);
  const confirmed = render({ busy: false, dirty: false, published: true });
  assert.match(confirmed, /is-published/);
  assert.match(confirmed, /✓ Published/);
  const edited = render({ busy: false, dirty: true, published: true });
  assert.doesNotMatch(edited, /is-published/);
  assert.match(edited, /Publish review/);
  const retry = render({
    busy: false,
    dirty: false,
    awaitingConfirmation: true,
  });
  assert.match(retry, /Check publication/);
  assert.doesNotMatch(retry, /disabled=""/);
});
