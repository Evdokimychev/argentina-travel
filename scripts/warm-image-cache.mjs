#!/usr/bin/env node
/**
 * Warm image cache: fetch stock media + populate stock-cache.json from manifest.
 *
 * Usage:
 *   node scripts/warm-image-cache.mjs
 *   node scripts/warm-image-cache.mjs --dry-run
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STOCK_MEDIA_SLOTS } from "./stock-media-entities.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");
const cachePath = path.join(root, "src/data/media-library/stock-cache.json");
const varCachePath = path.join(root, "var/cache/image-provider/stock-cache.json");

const DRY_RUN = process.argv.includes("--dry-run");

function loadEnvLocal() {
  const envPath = path.join(root, ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

function mediaUrl(localPath) {
  const normalized = localPath.replace(/^\/+/, "");
  return normalized.startsWith("media/") ? `/${normalized}` : `/media/${normalized}`;
}

function buildAttributionHtml(asset) {
  const author = asset.authorProfileUrl
    ? `<a href="${asset.authorProfileUrl}">${asset.author ?? "Author"}</a>`
    : (asset.author ?? "Author");
  if (asset.source === "unsplash") {
    return `Фото: ${author} / <a href="${asset.sourceUrl}">Unsplash</a>`;
  }
  if (asset.source === "pexels") {
    return `Фото: ${author} / <a href="${asset.sourceUrl}">Pexels</a>`;
  }
  if (asset.source === "wikimedia" || asset.source === "wikipedia") {
    return `Фото: ${author} / <a href="${asset.sourceUrl}">Wikimedia Commons</a> (${asset.license})`;
  }
  return asset.attributionHtml ?? `Фото: ${author}`;
}

function buildCacheFromManifest() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const entries = {};

  for (const slot of STOCK_MEDIA_SLOTS) {
    const asset = manifest.assets?.find((a) => a.id === slot.id);
    if (!asset) continue;

    const key = `${slot.role}:${slot.query}`;
    entries[key] = {
      key,
      resolvedAt: new Date().toISOString(),
      query: slot.query,
      role: slot.role,
      resolved: {
        src: mediaUrl(asset.localPath),
        alt: asset.alt,
        title: asset.imageTitle ?? asset.title ?? slot.alt,
        description: asset.imageDescription ?? asset.caption,
        attribution: {
          authorName: asset.author ?? "Unknown",
          authorProfileUrl: asset.authorProfileUrl,
          sourceUrl: asset.sourceUrl,
          license: asset.license,
        },
        attributionHtml: asset.attributionHtml ?? buildAttributionHtml(asset),
        localPath: asset.localPath,
      },
    };
  }

  const cache = {
    version: 1,
    updatedAt: new Date().toISOString(),
    entries,
  };

  if (DRY_RUN) {
    console.log(`Would write ${Object.keys(entries).length} cache entries`);
    return;
  }

  const json = `${JSON.stringify(cache, null, 2)}\n`;
  fs.mkdirSync(path.dirname(cachePath), { recursive: true });
  fs.writeFileSync(cachePath, json, "utf8");
  fs.mkdirSync(path.dirname(varCachePath), { recursive: true });
  fs.writeFileSync(varCachePath, json, "utf8");
  console.log(`Cache written: ${cachePath} (${Object.keys(entries).length} entries)`);
}

function main() {
  loadEnvLocal();
  console.log("Warming stock media + image cache…");
  if (!DRY_RUN) {
    try {
      execSync("node scripts/fetch-stock-media.mjs", { cwd: root, stdio: "inherit" });
    } catch (err) {
      console.warn("fetch-stock-media completed with errors — building cache from current manifest");
    }
  }
  buildCacheFromManifest();
}

main();
