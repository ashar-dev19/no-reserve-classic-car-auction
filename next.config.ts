import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a self-contained server bundle so the runtime image carries only
  // what the app actually imports.
  output: "standalone",
  // Kept out of the bundle: it is a native module and must load from disk.
  serverExternalPackages: ["better-sqlite3"],
  images: { formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
