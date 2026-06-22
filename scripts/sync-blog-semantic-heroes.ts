#!/usr/bin/env node
/**
 * Копирует семантически подобранные обложки в public/media/blog/{slug}/hero.jpg.
 * Usage: npm run sync:blog-semantic-heroes [-- --dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { blogPosts } from "../src/data/blog";
import { blogMediaFolder } from "../src/lib/blog-media-path";
import { resolveBlogPostCardImage } from "../src/lib/media-resolver";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const dryRun = process.argv.includes("--dry-run");

function copyFile(src: string, dest: string) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(src, dest);
}

function main() {
  let updated = 0;
  let skipped = 0;

  for (const post of blogPosts) {
    const targetSrc = resolveBlogPostCardImage(post);
    if (!targetSrc.startsWith("/media/")) {
      skipped += 1;
      continue;
    }

    const sourcePath = path.join(root, "public", targetSrc.replace(/^\//, ""));
    const destPath = path.join(
      root,
      "public/media/blog",
      blogMediaFolder(post.slug),
      "hero.jpg",
    );

    if (!fs.existsSync(sourcePath)) {
      console.warn(`SKIP ${post.slug}: missing source ${targetSrc}`);
      skipped += 1;
      continue;
    }

    let same = false;
    if (fs.existsSync(destPath)) {
      const a = fs.readFileSync(sourcePath);
      const b = fs.readFileSync(destPath);
      same = a.length === b.length && a.equals(b);
    }

    if (same) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(`WOULD ${post.slug} ← ${targetSrc}`);
    } else {
      copyFile(sourcePath, destPath);
      console.log(`SYNC ${post.slug} ← ${targetSrc}`);
    }
    updated += 1;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} unchanged/skipped${dryRun ? " (dry-run)" : ""}.`);
}

main();
