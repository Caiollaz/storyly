import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

// Directory containing this config file (the project root).
const projectRoot = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  output: "standalone",
  // This project has its own lockfile; pin the workspace root so Turbopack
  // doesn't pick up an unrelated lockfile higher in the filesystem.
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
