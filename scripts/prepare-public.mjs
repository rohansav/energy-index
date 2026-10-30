import { cp, mkdir, rm } from "node:fs/promises";
// Keep original asset paths compatible with the existing editor's upload location.
await mkdir("public", { recursive: true });
await rm("public/assets", { recursive: true, force: true });
await cp("assets", "public/assets", { recursive: true });
