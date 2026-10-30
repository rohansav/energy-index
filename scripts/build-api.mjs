import { build } from "esbuild";
import { mkdir, copyFile } from "node:fs/promises";
await mkdir("dist/api", { recursive: true });
await build({
  entryPoints: ["src/api/handler.ts", "src/api/authorizer.ts"],
  outdir: "dist/api",
  bundle: true,
  platform: "node",
  target: "node22",
  format: "cjs",
  outExtension: { ".js": ".cjs" },
});
await copyFile("infra/rds-ca.pem", "dist/api/rds-ca.pem");
