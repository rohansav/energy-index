import type { Catalogue } from "@/domain/types";
import { loadFileCatalogue } from "./file-catalogue";
import { PostgresCatalogueRepository } from "./postgres-repository";
import { databasePool } from "./database";

export { loadFileCatalogue } from "./file-catalogue";
export interface CatalogueRepository {
  getCatalogue(): Promise<Catalogue>;
}

/** Explicit selection: a configured database failure must never show stale files. */
function createRepository(): CatalogueRepository {
  const storage = process.env.CATALOGUE_STORAGE ?? "files";
  if (storage === "postgres")
    return new PostgresCatalogueRepository(databasePool());
  if (storage !== "files") throw new Error("Invalid CATALOGUE_STORAGE");
  return { getCatalogue: loadFileCatalogue };
}
let repository: CatalogueRepository | undefined;
export const catalogueRepository: CatalogueRepository = {
  getCatalogue() {
    return (repository ??= createRepository()).getCatalogue();
  },
};
