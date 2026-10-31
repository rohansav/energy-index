import { test } from "node:test";
import assert from "node:assert/strict";
import { renderToStaticMarkup } from "react-dom/server";
import { handler } from "../src/api/handler";
import { BrandSummary } from "../src/components/catalogue/BrandSummary";

test("brand summaries require editor authorization for reads and writes", async () => {
  for (const method of ["GET", "PUT"])
    for (const owner of [undefined,"false"])
      assert.equal((await handler({rawPath:"/editor/brands",body:"{}",requestContext:{http:{method},authorizer:{lambda:{owner}}}} as any)).statusCode,403);
});
test("brand summary rejects oversized text and invalid versions before storage", async () => {
  for(const body of [{name:"Monster",summary:"x".repeat(1201),version:0},{name:"Monster",summary:"hello",version:-1}])
    assert.equal((await handler({rawPath:"/editor/brands",body:JSON.stringify(body),requestContext:{http:{method:"PUT"},authorizer:{lambda:{owner:"true"}}}} as any)).statusCode,400);
});
test("brand summary hides blank content and renders prose as escaped text", () => {
 const brand={name:"Monster",color:"#ffffff",text:"#000000"};
 assert.equal(renderToStaticMarkup(<BrandSummary brand={brand}/>),"");
 const html=renderToStaticMarkup(<BrandSummary brand={{...brand,summary:'A bold range.\n<script>alert(1)</script>'}}/>);
 assert.ok(html.includes('EDITOR’S TAKE'));assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));
});
