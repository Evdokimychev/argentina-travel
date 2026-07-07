#!/usr/bin/env node
/**
 * Import Instagram posts from queue → media-library manifest + public/media/instagram/
 *
 * Без Graph API / OAuth. Опционально META_APP_ID + META_APP_SECRET для oEmbed thumbnail.
 *
 *   node scripts/import-instagram-queue.mjs
 *   node scripts/import-instagram-queue.mjs --dry-run
 *
 * Очередь: data/media-library/instagram-queue.json
 * Документация: docs/integrations/instagram.md
 */
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const queuePath = path.join(root, "data/media-library/instagram-queue.json");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");
const topicsPath = path.join(root, "data/media-library/topic-bindings.json");
const mediaDir = path.join(root, "public/media/instagram");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");

const appId = process.env.META_APP_ID;
const appSecret = process.env.META_APP_SECRET;
const appToken = appId && appSecret ? `${appId}|${appSecret}` : null;

function slugFromPermalink(permalink) {
  const m = permalink.match(/\/(?:p|reel|tv)\/([^/?#]+)/);
  return m?.[1] ?? crypto.createHash("md5").update(permalink).digest("hex").slice(0, 12);
}

function inferTagsFromCaption(caption, topics) {
  const tags = new Set(["author"]);
  const lower = (caption ?? "").toLowerCase();
  for (const topic of topics) {
    for (const h of topic.hashtags ?? []) {
      if (lower.includes(`#${h.toLowerCase()}`)) tags.add(topic.id);
    }
  }
  return [...tags];
}

async function fetchOembed(permalink) {
  if (!appToken) return null;
  const url = `https://graph.facebook.com/v21.0/instagram_oembed?url=${encodeURIComponent(permalink)}&access_token=${appToken}&fields=thumbnail_url,author_name,title`;
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

async function downloadFile(url, dest) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (!dryRun) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
  }
  return buf.length;
}

function mergeAsset(manifest, asset) {
  const idx = manifest.assets.findIndex((a) => a.id === asset.id);
  if (idx >= 0) manifest.assets[idx] = { ...manifest.assets[idx], ...asset };
  else manifest.assets.push(asset);
}

async function main() {
  const queue = JSON.parse(fs.readFileSync(queuePath, "utf8"));
  const topics = JSON.parse(fs.readFileSync(topicsPath, "utf8"));
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));

  let imported = 0;

  for (const entry of queue.items ?? []) {
    const permalink = entry.permalink?.trim();
    if (!permalink) continue;

    const slug = slugFromPermalink(permalink);
    const assetId = entry.id ?? `instagram:iv-evd:${slug}`;
    const handle = entry.instagramHandle ?? "iv.evd";
    const localRel = entry.localPath ?? `/media/instagram/${handle}/${slug}.jpg`;
    const localAbs = path.join(root, "public", localRel.replace(/^\//, ""));

    let caption = entry.caption ?? "";
    let thumbnailUrl = entry.thumbnailUrl;

    if (!entry.localPath && !thumbnailUrl) {
      const oembed = await fetchOembed(permalink);
      if (oembed) {
        thumbnailUrl = oembed.thumbnail_url;
        caption = caption || oembed.title || "";
      }
    }

    if (!entry.localPath && thumbnailUrl) {
      try {
        await downloadFile(thumbnailUrl, localAbs);
        console.log(`  ✓ ${slug} → ${localRel}`);
      } catch (err) {
        console.warn(`  ✗ download ${slug}: ${err.message}`);
        if (!fs.existsSync(localAbs)) continue;
      }
    } else if (!fs.existsSync(localAbs) && !entry.localPath) {
      console.warn(`  ✗ ${slug}: нет thumbnail — укажите thumbnailUrl или localPath, либо META_APP_ID/SECRET`);
      continue;
    }

    const tags = [
      ...new Set([
        ...(entry.tags ?? []),
        ...inferTagsFromCaption(caption, topics),
      ]),
    ];

    mergeAsset(manifest, {
      id: assetId,
      title: caption.slice(0, 80) || `Instagram @${handle}`,
      alt: caption.slice(0, 120) || `Фото из Instagram @${handle}`,
      caption: caption.slice(0, 500),
      source: "instagram",
      sourceUrl: permalink,
      license: "instagram",
      author: entry.author ?? "Иван",
      instagramPermalink: permalink,
      instagramHandle: handle,
      mediaKind: entry.mediaKind ?? "image",
      category: entry.category ?? "attraction",
      tags,
      localPath: localRel,
      placeId: entry.placeId,
      destinationId: entry.destinationId,
      kbArticleId: entry.kbArticleId,
      guideTopicId: entry.guideTopicId,
      publishedAt: entry.publishedAt ?? new Date().toISOString(),
      feedPriority: handle === "iv.evd" ? 0 : 10,
      role: entry.role ?? "gallery",
      pinned: true,
    });

    imported++;
  }

  if (!dryRun && imported > 0) {
    manifest.version = (manifest.version ?? 1) + 0;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`\nmanifest обновлён: +${imported} (всего ${manifest.assets.length})`);
  } else if (dryRun) {
    console.log(`\n[dry-run] было бы импортировано: ${imported}`);
  } else {
    console.log("\nОчередь пуста — добавьте URL в data/media-library/instagram-queue.json");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
