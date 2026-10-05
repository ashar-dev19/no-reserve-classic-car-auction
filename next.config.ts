import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Emits a self-contained server bundle so the runtime image carries only
  // what the app actually imports.
  output: "standalone",
  // Kept out of the bundle: it is a native module and must load from disk.
  serverExternalPackages: ["better-sqlite3"],
  images: { formats: ["image/avif", "image/webp"] },
  // The client-facing system overview is a standalone page in public/, served
  // at a clean path so the link can be sent as-is.
  async rewrites() {
    return [{ source: "/overview", destination: "/overview.html" }];
  },
  // The tracer otherwise copies the local development database into the build
  // output, which would ship real account rows and password hashes inside the
  // image. The database belongs on the volume, never in the bundle.
  outputFileTracingExcludes: { "*": ["data/**", "docs/**", "_decoded/**", "auction-assets/**"] },
};

export default nextConfig;
