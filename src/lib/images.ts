import fs from "node:fs";
import path from "node:path";

/**
 * The image paths available to the lot editor. Reads the public folder rather
 * than a hard-coded list, so dropping a new photo in makes it selectable.
 */
export function availableImages(): string[] {
  try {
    const dir = path.join(process.cwd(), "public", "cars");
    return fs
      .readdirSync(dir)
      .filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f))
      .sort()
      .map((f) => `/cars/${f}`);
  } catch {
    return [];
  }
}
