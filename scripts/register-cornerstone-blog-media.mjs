#!/usr/bin/env node
/**
 * Copy section-1/2/3 files + clone manifest entries for cornerstone blog posts.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { blogMediaFolder } from "./blog-slug-media-path.mjs";
import { CORNERSTONE_MEDIA_COPY } from "./cornerstone-blog-media-map.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const blogRoot = path.join(root, "public/media/blog");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");

const SECTION_FILES = ["section-1.jpg", "section-2.jpg", "section-3.jpg"];
const checkOnly = process.argv.includes("--check");

function heroLocalPathForSlug(slug) {
  return `media/blog/${blogMediaFolder(slug)}/hero.jpg`;
}

function assetsForSlug(assets, slug) {
  const heroPath = heroLocalPathForSlug(slug);
  return assets.filter(
    (asset) =>
      asset.blogPostSlug === slug ||
      asset.localPath === heroPath ||
      asset.localPath?.startsWith(`media/blog/${blogMediaFolder(slug)}/`)
  );
}

function checkCornerstoneMedia() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const assets = manifest.assets ?? manifest;
  const missing = [];

  for (const target of Object.keys(CORNERSTONE_MEDIA_COPY)) {
    const heroPath = path.join(blogRoot, blogMediaFolder(target), "hero.jpg");
    if (!fs.existsSync(heroPath)) {
      missing.push(`${target}: missing hero.jpg`);
      continue;
    }
    const heroAsset = assets.find(
      (asset) => asset.role === "hero" && asset.localPath === heroLocalPathForSlug(target)
    );
    if (!heroAsset) {
      missing.push(`${target}: missing manifest hero entry`);
    }
  }

  if (missing.length) {
    console.error("Cornerstone media check failed:");
    for (const line of missing) console.error(`  ${line}`);
    process.exit(1);
  }

  console.log(`Cornerstone media OK (${Object.keys(CORNERSTONE_MEDIA_COPY).length} posts)`);
}

if (checkOnly) {
  checkCornerstoneMedia();
  process.exit(0);
}

function cloneAsset(asset, targetSlug, roleSuffix = "") {
  const folder = blogMediaFolder(targetSlug);
  const role = asset.role === "hero" ? "hero" : asset.role;
  const slotSuffix =
    role === "section"
      ? asset.id.includes("section-2")
        ? "section-2"
        : asset.id.includes("section-3")
          ? "section-3"
          : "section-1"
      : role;

  const id =
    role === "hero"
      ? `blog-${folder}`
      : `blog-${folder}-${slotSuffix}`;

  const localPath =
    role === "hero"
      ? `media/blog/${folder}/hero.jpg`
      : `media/blog/${folder}/${slotSuffix}.jpg`;

  return {
    ...asset,
    id,
    blogPostSlug: targetSlug,
    localPath,
    title: asset.title,
    alt: asset.alt,
  };
}

let filesCopied = 0;
for (const [target, source] of Object.entries(CORNERSTONE_MEDIA_COPY)) {
  const sourceDir = path.join(blogRoot, blogMediaFolder(source));
  const targetDir = path.join(blogRoot, blogMediaFolder(target));
  fs.mkdirSync(targetDir, { recursive: true });

  for (const file of SECTION_FILES) {
    const src = path.join(sourceDir, file);
    const dst = path.join(targetDir, file);
    if (!fs.existsSync(src) || fs.existsSync(dst)) continue;
    fs.copyFileSync(src, dst);
    filesCopied += 1;
    console.log(`COPY ${target}/${file} ← ${source}/${file}`);
  }
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const assets = manifest.assets ?? manifest;
let added = 0;
let updated = 0;

for (const [target, source] of Object.entries(CORNERSTONE_MEDIA_COPY)) {
  const sourceAssets = assetsForSlug(assets, source);
  const roles = ["hero", "section-1", "section-2", "section-3"];

  for (const roleKey of roles) {
    const sourceAsset =
      roleKey === "hero"
        ? sourceAssets.find((a) => a.role === "hero")
        : sourceAssets.find((a) => a.id?.endsWith(`-${roleKey}`));

    if (!sourceAsset) continue;

    const cloned = cloneAsset(sourceAsset, target);
    const index = assets.findIndex((a) => a.id === cloned.id);
    if (index >= 0) {
      assets[index] = cloned;
      updated += 1;
    } else {
      assets.push(cloned);
      added += 1;
    }
  }
}

if (added > 0 || updated > 0) {
  manifest.version = (manifest.version ?? 1) + 1;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

console.log(`\nManifest: +${added} / ~${updated}, section files copied: ${filesCopied}`);
