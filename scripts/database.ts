import { writeFile } from "node:fs/promises";
import { isDeepStrictEqual } from "node:util";
import { databasePool } from "../src/server/database";
import { loadFileCatalogue } from "../src/server/file-catalogue";
import { PostgresCatalogueRepository } from "../src/server/postgres-repository";
import {
  migrateDatabase,
  importCatalogue,
} from "../src/server/migrate-database";

const pool = databasePool();
try {
  const command = process.argv[2];
  if (command === "migrate") {
    await migrateDatabase(pool);
    console.log("Database schema is up to date.");
  } else if (command === "import") {
    const catalogue = await loadFileCatalogue();
    const outcome = await importCatalogue(pool, catalogue);
    console.log(
      `${outcome}: ${catalogue.brands.length} brands and ${catalogue.drinks.length} drinks/reviews; exact read-back match.`,
    );
  } else if (command === "verify") {
    const expected = await loadFileCatalogue();
    const actual = await new PostgresCatalogueRepository(pool).getCatalogue();
    if (!isDeepStrictEqual(actual, expected))
      throw new Error("Database differs from the file snapshot");
    console.log(
      "Every brand, product, rating, note, and metadata field matches.",
    );
  } else if (command === "export") {
    const output = process.argv[3];
    if (!output) throw new Error("Pass an output filename");
    const catalogue = await new PostgresCatalogueRepository(
      pool,
    ).getCatalogue();
    await writeFile(output, JSON.stringify(catalogue, null, 2) + "\n", {
      flag: "wx",
      mode: 0o600,
    });
    console.log("Snapshot exported (existing files are never overwritten).");
  } else throw new Error("Use migrate, import, verify, or export <filename>");
} finally {
  await pool.end();
}
