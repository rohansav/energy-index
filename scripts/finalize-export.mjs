import { mkdir, writeFile, readFile, readdir } from "node:fs/promises";
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
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="refresh" content="0;url=${base}/editor/"><title>Review editor</title></head><body><a href="${base}/editor/">Open review editor</a></body></html>`,
);
// Preserve previously shared brand.html?brand= URLs; whitelist the destination slug.
await writeFile(
  "out/brand.html",
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Brand catalogue</title></head><body><p>Opening brand catalogue…</p><a href="${base}/">All brands</a><script>const slug=new URLSearchParams(location.search).get('brand');if(${JSON.stringify(slugs)}.includes(slug))location.replace(${JSON.stringify(base)}+'/brands/'+slug+'/'+location.hash);</script></body></html>`,
);

// Keep the initial render styled even while a CDN edge still has stale chunks.
// Retain Next's stylesheet links for client navigation and resource bookkeeping.
async function inlinePageStyles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = `${directory}/${entry.name}`;
    if (entry.isDirectory()) {
      await inlinePageStyles(file);
    } else if (entry.name.endsWith(".html")) {
      let html = await readFile(file, "utf8");
      const styles = [];
      for (const match of html.matchAll(
        /<link\b[^>]*rel="stylesheet"[^>]*>/g,
      )) {
        const href = match[0].match(/href="([^"]+)"/)?.[1];
        if (!href?.startsWith(`${base}/_next/`)) continue;
        const css = await readFile(`out${href.slice(base.length)}`, "utf8");
        if (/<\/style/i.test(css))
          throw new Error("Unsafe inline stylesheet content");
        styles.push(css);
      }
      if (styles.length) {
        html = html.replace(
          "</head>",
          `<style data-export-styles>${styles.join("\n")}</style></head>`,
        );
        await writeFile(file, html);
      }
    }
  }
}
await inlinePageStyles("out");
