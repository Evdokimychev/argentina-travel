#!/usr/bin/env node
/**
 * CI warning: indexable blog posts without a local hero.jpg under public/media/blog/.
 * Usage: node scripts/audit-blog-heroes.mjs [--strict]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { blogMediaFolder } from "./blog-slug-media-path.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const STRICT = process.argv.includes("--strict");

function loadIndexableSlugs() {
  const blogPath = path.join(root, "src/data/blog.ts");
  const src = fs.readFileSync(blogPath, "utf8");
  const slugs = [];
  for (const match of src.matchAll(/slug:\s*"([^"]+)"/g)) {
    slugs.push(match[1]);
  }
  const noIndex = new Set();
  for (const match of src.matchAll(/slug:\s*"([^"]+)"[\s\S]*?noIndex:\s*true/g)) {
    noIndex.add(match[1]);
  }
  return [...new Set(slugs)].filter((slug) => !noIndex.has(slug));
}

function hasLocalHero(slug) {
  const folder = blogMediaFolder(slug);
  const heroPath = path.join(root, "public/media/blog", folder, "hero.jpg");
  return fs.existsSync(heroPath);
}

function main() {
  const indexable = loadIndexableSlugs();
  const missing = indexable.filter((slug) => !hasLocalHero(slug));
  const covered = indexable.length - missing.length;
  const pct = indexable.length ? Math.round((covered / indexable.length) * 100) : 100;

  console.log(`Blog hero audit: ${covered}/${indexable.length} indexable (${pct}%) have local hero.jpg`);

  if (missing.length) {
    console.log("\nMissing local hero:");
    for (const slug of missing.sort()) {
      console.log(`  - ${slug} → public/media/blog/${blogMediaFolder(slug)}/hero.jpg`);
    }
  }

  if (STRICT && missing.length > 0) {
    console.error(`\nStrict mode: ${missing.length} indexable post(s) without hero.jpg`);
    process.exit(1);
  }

  if (missing.length > 5) {
    console.warn(`\nWarning: ${missing.length} indexable posts use hub/category fallback (> 5 target).`);
    process.exit(STRICT ? 1 : 0);
  }
}

main();
