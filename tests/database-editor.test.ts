import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

test("Decap keeps dropdown formats, saves to API, and retains version on conflict", async () => {
  let Backend: any;
  let conflict = false;
  let writes = 0;
  const review = {
    id: "sample",
    name: "Sample",
    brand: "Brand",
    score: 8,
    sweetness: 0,
    tartness: null,
    dryness: 2.1,
    energy: null,
    notes: "",
    body: "notes",
  };
  const context = vm.createContext({
    window: {},
    fetch: async (url: string, options: any) => {
      if (options.method === "PUT") {
        writes++;
        const input = JSON.parse(options.body);
        assert.equal(input.version, 1);
        assert.equal(input.review.score, "8.0");
        assert.equal(options.headers.Authorization, "Bearer test");
        return {
          ok: !conflict,
          status: conflict ? 409 : 200,
          json: async () =>
            conflict ? { error: "Review changed" } : { version: 2 },
        };
      }
      return { ok: true, json: async () => ({ review, version: 1 }) };
    },
  });
  vm.runInContext(
    fs.readFileSync("admin/database-backend.js", "utf8"),
    context,
  );
  context.window.registerEnergyDatabaseBackend(
    {
      getBackend: () => ({
        BackendClass: class {
          token = "test";
        },
      }),
      registerBackend: (_: string, value: any) => {
        Backend = value;
      },
    },
    "https://example.test",
  );
  const backend = new Backend();
  const entry = await backend.getEntry("reviews/sample.json");
  const data = JSON.parse(entry.data);
  assert.equal(data.score, "8.0");
  assert.equal(data.sweetness, "0.0");
  assert.equal(data.tartness, "");
  conflict = true;
  await assert.rejects(
    () =>
      backend.persistEntry({
        dataFiles: [{ path: entry.file.path, raw: entry.data }],
        assets: [],
      }),
    /changed/,
  );
  assert.equal(backend.versions.get("sample"), 1);
  conflict = false;
  await backend.persistEntry({
    dataFiles: [{ path: entry.file.path, raw: entry.data }],
    assets: [],
  });
  assert.equal(backend.versions.get("sample"), 2);
  assert.equal(writes, 2);
  assert.throws(() => backend.persistMedia(), /not supported/);
});
