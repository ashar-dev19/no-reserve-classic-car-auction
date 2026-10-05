/**
 * Verifies that everything the Docker build reads actually survives
 * `.dockerignore`.
 *
 * A file excluded from the build context does not fail locally — it fails on
 * the build host, several minutes in. This catches that class of mistake
 * before a push.
 *
 *   npm run check:docker
 */
import { existsSync, readFileSync } from "node:fs";

/** Paths the build stage needs present in the context. */
const REQUIRED = [
  "package.json",
  "package-lock.json",
  "next.config.ts",
  "tsconfig.json",
  "postcss.config.mjs",
  "docker-entrypoint.sh",
  "src/app/layout.tsx",
  "src/lib/db.ts",
  "scripts/seed.mts",
  "scripts/lots.mts",
  "scripts/build-overview.mjs",
  // Read by `npm run overview` to produce public/overview.html.
  "docs/system-overview.html",
  "public/cars/hero-wide.jpg",
  "public/brand/nrc-logo-white.png",
];

/** Paths that must NOT reach the image. */
const FORBIDDEN = [
  "data/auction.db",
  ".env.local",
];

const patterns = readFileSync(".dockerignore", "utf8")
  .split("\n")
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

/**
 * Approximates Docker's matching: a bare name excludes that path and anything
 * beneath it; `*` matches within a single path segment.
 */
function isIgnored(path) {
  return patterns.some((pattern) => {
    if (pattern.includes("*")) {
      const rx = new RegExp(
        "^" + pattern.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*") + "$",
      );
      return path.split("/").some((_, i, parts) => rx.test(parts.slice(0, i + 1).join("/")));
    }
    return path === pattern || path.startsWith(pattern + "/");
  });
}

let failed = 0;

for (const path of REQUIRED) {
  if (!existsSync(path)) {
    console.log(`  ✗ ${path} — missing from the repository`);
    failed++;
  } else if (isIgnored(path)) {
    console.log(`  ✗ ${path} — excluded by .dockerignore but the build needs it`);
    failed++;
  } else {
    console.log(`  ✓ ${path}`);
  }
}

for (const path of FORBIDDEN) {
  if (!existsSync(path)) continue;
  if (isIgnored(path)) {
    console.log(`  ✓ ${path} — correctly kept out of the image`);
  } else {
    console.log(`  ✗ ${path} — would be copied into the image; add it to .dockerignore`);
    failed++;
  }
}

console.log(
  failed === 0
    ? "\n  Docker build context looks complete.\n"
    : `\n  ${failed} problem${failed === 1 ? "" : "s"} — the Docker build would fail or leak.\n`,
);

process.exit(failed > 0 ? 1 : 0);
