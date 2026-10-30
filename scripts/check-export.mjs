import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("out");
const base = process.env.NEXT_PUBLIC_BASE_PATH || "/energy-index";
async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory()
          ? files(path.join(directory, entry.name))
          : [path.join(directory, entry.name)],
      ),
    )
  ).flat();
}
const htmlFiles = (await files(root)).filter((file) => file.endsWith(".html"));
for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  if (html.includes('rel="stylesheet"')) {
    assert(
      html.includes("<style data-export-styles>"),
      `Missing embedded styles: ${file}`,
    );
  }
  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const url = match[1];
    if (!url.startsWith(`${base}/`)) continue;
    const pathname = decodeURIComponent(
      new URL(url, "https://example.com").pathname,
    ).slice(base.length + 1);
    const target = path.resolve(root, pathname);
    assert(
      target.startsWith(`${root}/`) || target === root,
      `Escaped export path: ${url}`,
    );
    const info = await stat(target).catch(() => null);
    assert(info, `Broken link in ${path.relative(root, file)}: ${url}`);
    if (info.isDirectory()) await stat(path.join(target, "index.html"));
  }
}
const catalogue = JSON.parse(await readFile("src/data/catalogue.json", "utf8"));
for (const product of catalogue.products)
  await stat(path.join(root, "drinks", product.id, "index.html"));
assert(
  (await readFile("out/admin/index.html", "utf8")).includes(
    "/energy-index/editor/",
  ),
);
assert((await readFile("out/brand.html", "utf8")).includes("URLSearchParams"));
console.log(
  `Verified ${htmlFiles.length} exported pages, all local links/assets, and editor/legacy routes.`,
);
