import { test } from "node:test";
import assert from "node:assert/strict";
import { safeReturnPath, requestedDrink } from "../src/lib/auth-navigation";
test("sign-in keeps the requested drink but rejects external or callback redirects", () => {
  assert.equal(
    safeReturnPath("/energy-index/editor/?drink=alani-blue-slush"),
    "/energy-index/editor/?drink=alani-blue-slush",
  );
  assert.equal(
    safeReturnPath("/energy-index/brands/alani/"),
    "/energy-index/brands/alani/",
  );
  for (const value of [
    undefined,
    "https://evil.test/",
    "//evil.test/",
    "/energy-index/../../evil",
    "/energy-index/auth/callback/",
    "/energy-index/\\evil",
  ])
    assert.equal(safeReturnPath(value), "/energy-index/editor/");
  assert.equal(requestedDrink("?drink=alani-blue-slush"), "alani-blue-slush");
  assert.equal(requestedDrink("?drink=../../other"), null);
});
