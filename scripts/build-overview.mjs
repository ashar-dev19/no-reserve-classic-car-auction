/**
 * Wraps docs/system-overview.html in a full HTML document and writes it into
 * public/, so the deployed app serves the client-facing overview at /overview
 * on its own domain — one link, no access to grant.
 *
 * The source file omits <!doctype>, <head> and <body> because the Artifact
 * publisher supplies them; without them a browser falls into quirks mode.
 *
 *   npm run overview
 */
import { readFileSync, writeFileSync } from "node:fs";

const SRC = "docs/system-overview.html";
const OUT = "public/overview.html";

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
