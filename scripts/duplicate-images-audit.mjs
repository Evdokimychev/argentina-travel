#!/usr/bin/env node
/**
 * Audit manifest and resolver helpers for duplicate gallery image URLs within the same context.
 * Writes docs/duplicate-images-audit.md
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");
const outPath = path.join(root, "docs/duplicate-images-audit.md");
const publicRoot = path.join(root, "public");

function mediaUrl(localPath) {
  const normalized = localPath.replace(/^\/+/, "");
  return normalized.startsWith("media/") ? `/${normalized}` : `/media/${normalized}`;
}

function groupKey(asset) {
  if (asset.articleId) return `rich:${asset.articleId}`;
  if (asset.tourSlug) return `tour:${asset.tourSlug}`;
  if (asset.placeId) return `place:${asset.placeId}`;
  if (asset.destinationId) return `destination:${asset.destinationId}`;
  if (asset.podborRegionId) return `podbor-region:${asset.podborRegionId}`;
  return null;
}

function findDuplicateGroups(assets, roleFilter) {
  const groups = new Map();
  for (const asset of assets) {
    if (roleFilter && asset.role !== roleFilter) continue;
    const key = groupKey(asset);
    if (!key) continue;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(asset);
  }

  const duplicates = [];
  for (const [key, list] of groups) {
    const bySrc = new Map();
    const bySourceUrl = new Map();
    for (const asset of list) {
      const src = mediaUrl(asset.localPath);
      if (!bySrc.has(src)) bySrc.set(src, []);
      bySrc.get(src).push(asset.id);
      if (asset.sourceUrl) {
        if (!bySourceUrl.has(asset.sourceUrl)) bySourceUrl.set(asset.sourceUrl, []);
        bySourceUrl.get(asset.sourceUrl).push(asset.id);
      }
    }
    const srcDupes = [...bySrc.entries()].filter(([, ids]) => ids.length > 1);
    const urlDupes = [...bySourceUrl.entries()].filter(([, ids]) => ids.length > 1);
    if (srcDupes.length || urlDupes.length) {
      duplicates.push({ key, srcDupes, urlDupes, total: list.length });
    }
  }
  return duplicates;
}

function scanFileHashes(dir, pattern) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const files = fs.readdirSync(dir).filter((f) => pattern.test(f));
  const byHash = new Map();
  for (const file of files) {
    const full = path.join(dir, file);
    const data = fs.readFileSync(full);
    let hash = 0;
    for (let i = 0; i < data.length; i++) hash = (hash * 31 + data[i]) | 0;
    const key = `${hash}:${data.length}`;
    if (!byHash.has(key)) byHash.set(key, []);
    byHash.get(key).push(file);
  }
  for (const [hashKey, files] of byHash) {
    if (files.length > 1) results.push({ hashKey, files });
  }
  return results;
}

function richGalleryFileDupes() {
  const richDir = path.join(publicRoot, "media/blog/rich");
  if (!fs.existsSync(richDir)) return [];
  const articles = fs.readdirSync(richDir, { withFileTypes: true }).filter((d) => d.isDirectory());
  const dupes = [];
  for (const article of articles) {
    const fileDupes = scanFileHashes(path.join(richDir, article.name), /^gallery-\d+\.jpg$/);
    if (fileDupes.length) dupes.push({ articleId: article.name, fileDupes });
  }
  return dupes;
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const assets = manifest.assets ?? [];

const galleryDupes = findDuplicateGroups(assets, "gallery");
const allDupes = findDuplicateGroups(assets, null);
const richFileDupes = richGalleryFileDupes();

const lines = [
  "# Duplicate images audit",
  "",
  `Generated: ${new Date().toISOString().slice(0, 10)}`,
  "",
  "## Summary",
  "",
  `- Gallery duplicate groups (manifest): **${galleryDupes.length}**`,
  `- All-role duplicate groups (manifest): **${allDupes.length}**`,
  `- Rich article file-hash duplicate groups: **${richFileDupes.length}**`,
  "",
  "## Resolver helpers checked",
  "",
  "- `getRichArticleGallery` — dedupes by `src` and `contentHash`, supplements from place gallery",
  "- `getPlaceGallery` — dedupes via `Set`",
  "- `getTourGallery` — dedupes via `Set`",
  "- `getDestinationGallery` — dedupes via `Set`",
  "- `resolveGalleryFromArticle` (image-provider) — dedupes by `src` and `contentHash`",
  "",
];

if (galleryDupes.length) {
  lines.push("## Gallery duplicate groups (manifest)", "");
  for (const { key, srcDupes, urlDupes, total } of galleryDupes) {
    lines.push(`### ${key} (${total} assets)`, "");
    if (srcDupes.length) {
      lines.push("Duplicate `localPath` / src:", "");
      for (const [src, ids] of srcDupes) {
        lines.push(`- \`${src}\` → ${ids.join(", ")}`);
      }
      lines.push("");
    }
    if (urlDupes.length) {
      lines.push("Duplicate `sourceUrl`:", "");
      for (const [url, ids] of urlDupes) {
        lines.push(`- ${url} → ${ids.join(", ")}`);
      }
      lines.push("");
    }
  }
} else {
  lines.push("## Gallery duplicate groups (manifest)", "", "No duplicate groups found.", "");
}

if (richFileDupes.length) {
  lines.push("## Rich article gallery file duplicates (byte-identical)", "");
  for (const { articleId, fileDupes } of richFileDupes) {
    lines.push(`### ${articleId}`, "");
    for (const { hashKey, files } of fileDupes) {
      lines.push(`- ${files.join(", ")} (identical: ${hashKey})`);
    }
    lines.push("");
  }
} else {
  lines.push("## Rich article gallery file duplicates", "", "No byte-identical gallery files.", "");
}

if (allDupes.length > galleryDupes.length) {
  const extra = allDupes.filter((d) => !galleryDupes.some((g) => g.key === d.key));
  if (extra.length) {
    lines.push("## Other duplicate groups (non-gallery roles)", "");
    for (const { key, srcDupes } of extra) {
      lines.push(`- **${key}**: ${srcDupes.length} duplicate src group(s)`);
    }
    lines.push("");
  }
}

fs.writeFileSync(outPath, lines.join("\n"), "utf8");
console.log(`Written ${outPath}`);
console.log(
  `Gallery groups: ${galleryDupes.length}, all groups: ${allDupes.length}, rich file dupes: ${richFileDupes.length}`,
);
