import type { NextConfig } from "next";

const config: NextConfig = {
  output: "export",
  basePath: process.env.NEXT_PUBLIC_BASE_PATH || "/energy-index",
  trailingSlash: true,
  images: { unoptimized: true },
};
export default config;
