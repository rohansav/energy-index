import { mkdir, writeFile, readFile } from "node:fs/promises";
const { brands } = JSON.parse(
  await readFile("src/data/catalogue.json", "utf8"),
);
const slugs = brands.map((brand) =>
  brand.name.toLowerCase().replaceAll(" ", "-"),
);
const base = process.env.NEXT_PUBLIC_BASE_PATH || "/energy-index";
await writeFile("out/.nojekyll", "");
await mkdir("out/admin", { recursive: true });
await writeFile(
  "out/admin/index.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=https://brilliant-pavlova-12976b.netlify.app/"><title>Review editor</title></head><body><a href="https://brilliant-pavlova-12976b.netlify.app/">Open review editor</a></body></html>`,
);
// Preserve previously shared brand.html?brand= URLs; whitelist the destination slug.
await writeFile(
  "out/brand.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Brand catalogue</title></head><body><p>Opening brand catalogue…</p><a href="${base}/">All brands</a><script>const slug=new URLSearchParams(location.search).get('brand');if(${JSON.stringify(slugs)}.includes(slug))location.replace(${JSON.stringify(base)}+'/brands/'+slug+'/'+location.hash);</script></body></html>`,
);
