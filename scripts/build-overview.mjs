/**
 * Wraps docs/system-overview.html in a full HTML document.
 *
 * The source file is written for the Artifact publisher, which supplies its own
 * <!doctype>, <head> and <body>. A browser opening the raw file would fall into
 * quirks mode, so this emits a standalone copy to open locally or email as an
 * attachment.
 *
 *   node scripts/build-overview.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "docs/system-overview.html";
const OUT = "docs/system-overview.standalone.html";

const body = readFileSync(SRC, "utf8");
const title = body.match(/<title>([^<]*)<\/title>/)?.[1] ?? "System Overview";

writeFileSync(
  OUT,
  `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="How the collector car auction platform works.">
<style>
  :root { color-scheme: light; }
  body { margin: 0; }
  img { max-width: 100%; }
  [hidden] { display: none !important; }
</style>
${body}
</body>
</html>
`,
  "utf8",
);

console.log(`${OUT}  (${title})`);
