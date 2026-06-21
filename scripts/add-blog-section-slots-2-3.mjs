#!/usr/bin/env node
/**
 * Adds section-2 (hero) and section-3 (section-1) manifest slots for blog posts
 * that already have section-1 — supports BlogPostSectionView mid/end images.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const assets = manifest.assets ?? manifest;

const section1 = assets.filter(
  (a) => a.role === "section" && a.id?.endsWith("-section-1") && a.blogPostSlug,
);

let added = 0;

for (const s1 of section1) {
  const slug = s1.blogPostSlug;
  const hero = assets.find((a) => a.blogPostSlug === slug && a.role === "hero");
  if (!hero) continue;

  const slots = [
    {
      slot: "section-2",
      source: hero,
      titleSuffix: " — обзор маршрута",
      altSuffix: " — обзор маршрута",
      localPathSuffix: "section-2.jpg",
    },
    {
      slot: "section-3",
      source: s1,
      titleSuffix: " — практические детали",
      altSuffix: " — практические детали",
      localPathSuffix: "section-3.jpg",
    },
  ];

  for (const { slot, source, titleSuffix, altSuffix, localPathSuffix } of slots) {
    const id = `blog-${slug}-${slot}`;
    if (assets.some((a) => a.id === id)) continue;

    const folder = path.dirname(source.localPath);
    const localPath = localPathSuffix
      ? `${folder}/${localPathSuffix}`
      : source.localPath;

    assets.push({
      id,
      title: `${source.title || s1.title}${titleSuffix}`,
      alt: `${source.alt || s1.alt}${altSuffix}`,
      category: "blog-article",
      tags: source.tags ?? s1.tags ?? ["stock", "section"],
      source: source.source,
      sourceUrl: source.sourceUrl,
      license: source.license,
      author: source.author,
      localPath,
      role: "section",
      contentHash: source.contentHash,
      blogPostSlug: slug,
      ...(source.authorProfileUrl ? { authorProfileUrl: source.authorProfileUrl } : {}),
      ...(source.attributionHtml ? { attributionHtml: source.attributionHtml } : {}),
      ...(source.attributionRequired != null
        ? { attributionRequired: source.attributionRequired }
        : {}),
      ...(source.imageTitle ? { imageTitle: `${source.imageTitle}${titleSuffix}` } : {}),
    });
    added++;
  }
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Added ${added} section-2/section-3 manifest entries.`);
