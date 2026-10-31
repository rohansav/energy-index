import assert from "node:assert/strict";
import type { Pool } from "pg";
import { handler } from "../src/api/handler";
import { PostgresCatalogueRepository } from "../src/server/postgres-repository";

/** Run only against the fresh database created by the PostgreSQL integration test. */
export async function verifyBrandSummaries(pool: Pool) {
  const prior=process.env.DATABASE_URL;
  process.env.DATABASE_URL=process.env.TEST_DATABASE_URL;
  const request=async(summary:string,version:number) => handler({rawPath:"/editor/brands",body:JSON.stringify({name:"Monster",summary,version}),requestContext:{http:{method:"PUT"},authorizer:{lambda:{owner:"true"}}}} as any);
  try {
    const created=await request("Bright flavors, with a broad sugar-free range.",0);
    assert.equal(created.statusCode,200);
    assert.equal(JSON.parse(created.body).version,1);
    assert.equal((await request("Stale overwrite",0)).statusCode,409);
    const repository=new PostgresCatalogueRepository(pool);
    assert.equal((await repository.getCatalogue()).brands.find(b=>b.name==="Monster")?.summary,"Bright flavors, with a broad sugar-free range.");
    assert.equal((await request("Updated brand notes",1)).statusCode,200);
    assert.equal((await request("Another stale edit",1)).statusCode,409);
    assert.equal((await request("",2)).statusCode,200);
    assert.equal((await repository.getCatalogue()).brands.find(b=>b.name==="Monster")?.summary,undefined);
  } finally {if(prior===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=prior;}
}
