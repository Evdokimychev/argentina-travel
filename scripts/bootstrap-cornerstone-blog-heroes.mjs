#!/usr/bin/env node
/**
 * Bootstrap local hero.jpg for cornerstone posts from docs/articles.
 * Copies from thematically related existing blog heroes — no network.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { blogMediaFolder } from "./blog-slug-media-path.mjs";
import { CORNERSTONE_MEDIA_COPY } from "./cornerstone-blog-media-map.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const blogRoot = path.join(root, "public/media/blog");

function copyHero(targetSlug, sourceSlug) {
  const sourceDir = path.join(blogRoot, blogMediaFolder(sourceSlug));
  const sourceHero = path.join(sourceDir, "hero.jpg");
  if (!fs.existsSync(sourceHero)) {
    console.error(`SKIP ${targetSlug}: source missing ${sourceHero}`);
    return false;
  }

  const targetDir = path.join(blogRoot, blogMediaFolder(targetSlug));
  fs.mkdirSync(targetDir, { recursive: true });
  const targetHero = path.join(targetDir, "hero.jpg");
  if (fs.existsSync(targetHero)) {
    console.log(`OK ${targetSlug} (already exists)`);
    return true;
  }

  fs.copyFileSync(sourceHero, targetHero);
  console.log(`COPY ${targetSlug} ← ${blogMediaFolder(sourceSlug)}/hero.jpg`);
  return true;
}

let ok = 0;
let fail = 0;
for (const [target, source] of Object.entries(CORNERSTONE_MEDIA_COPY)) {
  if (copyHero(target, source)) ok += 1;
  else fail += 1;
}

console.log(`\nDone: ${ok} ok, ${fail} skipped`);
process.exit(fail > 0 ? 1 : 0);
