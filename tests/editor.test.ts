import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

test("existing Decap editor retains repo, files, score-only filters, and new fields", () => {
  let config:
    | {
        backend: { repo: string; branch: string };
        collections: Array<{
          folder: string;
          create: boolean;
          view_filters: Array<{
            label: string;
            field: string;
            pattern: string;
          }>;
          fields: Array<{ name: string; label?: string; options?: unknown[] }>;
        }>;
      }
    | undefined;
  let script: { onload: () => void } | undefined;
  const message = { textContent: "", remove() {} };
  const context = vm.createContext({
    window: {
      ENERGY_AUTH: { site_domain: "brilliant-pavlova-12976b.netlify.app" },
    },
    document: {
      querySelector: () => message,
      createElement: () => ({}),
      head: {
        append: (value: typeof script) => {
          script = value;
        },
      },
    },
    CMS: {
      init: (value: { config: typeof config }) => {
        config = value.config;
      },
    },
  });
  vm.runInContext(fs.readFileSync("admin/editor.js", "utf8"), context);
  script!.onload();
  assert.equal(config!.backend.repo, "rohansav/energy-index");
  assert.equal(config!.backend.branch, "main");
  const collection = config!.collections[0];
  assert.equal(collection.folder, "reviews");
  assert.equal(collection.create, false);
  const rated = collection.view_filters.find(
    (filter) => filter.label === "Rated",
  )!;
  assert.equal(rated.field, "score");
  const pattern = new RegExp(rated.pattern);
  for (const value of [1, "1.0", "7.3", 10, "10.0"])
    assert(pattern.test(String(value)));
  for (const value of [null, "", undefined, 0, "0.0", "10.1", "11", "7.35"])
    assert(!pattern.test(String(value)));
  const unrated = new RegExp(
    collection.view_filters.find((filter) => filter.label === "Unrated")!
      .pattern,
  );
  assert(unrated.test("null"));
  assert(unrated.test(""));
  assert(!unrated.test("7.3"));
  assert.equal(
    collection.fields.find((field) => field.name === "tartness")!.label,
    "Sourness",
  );
  assert.equal(
    collection.fields.find((field) => field.name === "energy")!.options!.length,
    52,
  );
});
