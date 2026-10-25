import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "8mb" } },
  // Two dev servers sharing one .next delete each other's route manifests, which
  // shows up as pages flickering between 200 and ENOENT. Give each its own.
  distDir: process.env.NEXT_DIST_DIR ?? ".next",
};

export default nextConfig;
