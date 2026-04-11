import path from "path";
import { fileURLToPath } from "url";
import type { NextConfig } from "next";

/** Directory containing this config (the Next app root). */
const appDir = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Enable Turbopack filesystem caching for faster builds (2-5x faster)
    turbopackFileSystemCacheForDev: true,
  },
  /**
   * When `next dev` is started from a parent folder (e.g. monorepo root), Turbopack
   * can resolve `@import "tailwindcss"` against the wrong directory and fail to find
   * `node_modules/tailwindcss`. Pin the Turbopack root to this app.
   */
  turbopack: {
    root: appDir,
  },
};

export default nextConfig;
