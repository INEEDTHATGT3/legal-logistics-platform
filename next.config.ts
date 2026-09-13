import type { NextConfig } from "next";

/**
 * GitHub Pages serves this repo from a subpath, so the bundle needs a
 * basePath — but only there. Gating on GITHUB_ACTIONS instead of
 * NODE_ENV keeps a local `next build` servable at the root, which is what
 * `pnpm preview` relies on.
 */
const repository = "legal-logistics-platform";
const isGithubPages = process.env.GITHUB_ACTIONS === "true";

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  ...(isGithubPages
    ? {
        basePath: `/${repository}`,
        assetPrefix: `/${repository}/`,
      }
    : {}),
};

export default nextConfig;
