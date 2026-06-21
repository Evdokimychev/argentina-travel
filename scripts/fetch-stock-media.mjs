#!/usr/bin/env node
/**
 * Fetch stock photos via Unsplash → Pexels → Wikimedia Commons, or curated fallback IDs.
 * Downloads optimized JPEGs to public/media/ and merges into manifest.json.
 *
 * Env: UNSPLASH_ACCESS_KEY, PEXELS_API_KEY (optional — fallback IDs used without keys)
 * Unsplash: use Access Key from developers.unsplash.com (Client-ID header), not Secret Key — HTTP 401 means invalid/revoked key.
 *
 * Usage:
 *   node scripts/fetch-stock-media.mjs
 *   node scripts/fetch-stock-media.mjs --dry-run
 *   node scripts/fetch-stock-media.mjs --force
 *   node scripts/fetch-stock-media.mjs --force --only=id1,id2
 */
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { STOCK_MEDIA_SLOTS } from "./stock-media-entities.mjs";
import { searchWikimedia } from "./wikimedia-client.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");
const publicRoot = path.join(root, "public");

const argv = process.argv.slice(2);
const args = new Set(argv.filter((a) => !a.startsWith("--only=")));
const onlyArg = argv.find((a) => a.startsWith("--only="));
const ONLY_IDS = onlyArg
  ? new Set(
      onlyArg
        .slice("--only=".length)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    )
  : null;
const DRY_RUN = args.has("--dry-run");
const FORCE = args.has("--force");

const USER_AGENT = "argentina-travel-stock-media/1.0 (https://www.goargentina.ru)";
const DELAY_MS = 1200;
const HERO_WIDTH = 1920;
const GALLERY_WIDTH = 1400;
const THUMB_WIDTH = 900;

function getUnsplashKey() {
  return process.env.UNSPLASH_ACCESS_KEY ?? "";
}

function getPexelsKey() {
  return process.env.PEXELS_API_KEY ?? "";
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Keys that must come from .env.local (override empty shell exports). */
const ENV_LOCAL_FORCE_KEYS = new Set([
  "UNSPLASH_ACCESS_KEY",
  "UNSPLASH_SECRET_KEY",
  "PEXELS_API_KEY",
]);

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
    if (ENV_LOCAL_FORCE_KEYS.has(key) || !process.env[key]) {
      process.env[key] = val;
    }
  }
}

loadEnvLocal();

function unsplashDownloadUrl(photoId, width) {
  return `https://images.unsplash.com/photo-${photoId}?w=${width}&q=85&fit=crop&auto=format&fm=jpg`;
}

function pexelsDownloadUrl(src, width) {
  if (width >= 1600 && src.original) return src.original;
  if (width >= 1200 && src.large2x) return src.large2x;
  return src.large ?? src.medium;
}

async function fetchJson(url, headers = {}) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, ...headers } });
  if (!res.ok) {
    if (url.includes("api.unsplash.com") && res.status === 401) {
      throw new Error(
        "Unsplash HTTP 401 — проверьте UNSPLASH_ACCESS_KEY в .env.local (developers.unsplash.com → Access Key, заголовок Client-ID)",
      );
    }
    throw new Error(`HTTP ${res.status} ${url}`);
  }
  return res.json();
}

async function searchUnsplash(query, page = 1) {
  const key = getUnsplashKey();
  if (!key) return null;
  const params = new URLSearchParams({
    query,
    orientation: "landscape",
    content_filter: "high",
    per_page: "8",
    page: String(page),
  });
  const data = await fetchJson(`https://api.unsplash.com/search/photos?${params}`, {
    Authorization: `Client-ID ${key}`,
    "Accept-Version": "v1",
  });
  return (data.results ?? []).map((p) => ({
    provider: "unsplash",
    id: p.id,
    photoId: p.id,
    downloadUrl: p.urls?.raw
      ? `${p.urls.raw}&w=${HERO_WIDTH}&q=85&fit=crop&auto=format&fm=jpg`
      : p.urls?.regular,
    sourceUrl: p.links?.html ?? `https://unsplash.com/photos/${p.id}`,
    author: p.user?.name ?? "Unsplash",
    authorProfileUrl: p.user?.links?.html,
    license: "Unsplash License",
  }));
}

async function searchPexels(query, page = 1) {
  const key = getPexelsKey();
  if (!key) return null;
  const params = new URLSearchParams({
    query,
    orientation: "landscape",
    per_page: "8",
    page: String(page),
  });
  const data = await fetchJson(`https://api.pexels.com/v1/search?${params}`, {
    Authorization: key,
  });
  return (data.photos ?? []).map((p) => ({
    provider: "pexels",
    id: String(p.id),
    photoId: String(p.id),
    downloadUrl: pexelsDownloadUrl(p.src, HERO_WIDTH),
    sourceUrl: p.url ?? `https://www.pexels.com/photo/${p.id}/`,
    author: p.photographer ?? "Pexels",
    authorProfileUrl: p.photographer_url,
    license: "Pexels License",
  }));
}

function fallbackResult(fallbackId, width = HERO_WIDTH) {
  return {
    provider: "unsplash",
    id: fallbackId,
    photoId: fallbackId,
    downloadUrl: unsplashDownloadUrl(fallbackId, width),
    sourceUrl: `https://unsplash.com/photos/${fallbackId}`,
    author: "Unsplash",
    license: "Unsplash License",
  };
}

function localCopyResult(slot) {
  return {
    provider: "local",
    id: slot.id,
    photoId: slot.id,
    copyFrom: slot.copyFrom,
    sourceUrl: `/${slot.copyFrom.replace(/^\/+/, "")}`,
    author: "Wikimedia Commons (via media library)",
    license: "CC BY-SA / CC BY (Wikimedia Commons)",
  };
}

async function verifyDownloadUrl(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      method: "GET",
      redirect: "follow",
    });
    if (!res.ok) return false;
    const len = Number(res.headers.get("content-length") ?? 0);
    if (len > 0 && len < 2048) return false;
    return true;
  } catch {
    return false;
  }
}

function copyFromExists(relativePath) {
  const srcPath = path.join(publicRoot, relativePath.replace(/^\/+/, ""));
  return fs.existsSync(srcPath);
}

function photoKey(candidate) {
  return `${candidate.provider}:${candidate.photoId ?? candidate.id}`;
}

function contentHashFromBuffer(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

function contentHashFromFile(filePath) {
  return contentHashFromBuffer(fs.readFileSync(filePath));
}

function createArticleTracker() {
  return {
    sourceUrls: new Set(),
    photoIds: new Set(),
    contentHashes: new Set(),
    isCandidateUsed(candidate) {
      if (candidate.sourceUrl && this.sourceUrls.has(candidate.sourceUrl)) return true;
      const key = photoKey(candidate);
      if (key && this.photoIds.has(key)) return true;
      return false;
    },
    isContentHashUsed(hash) {
      return this.contentHashes.has(hash);
    },
    record(candidate, contentHash) {
      if (candidate.sourceUrl) this.sourceUrls.add(candidate.sourceUrl);
      this.photoIds.add(photoKey(candidate));
      if (contentHash) this.contentHashes.add(contentHash);
    },
  };
}

async function collectRemoteCandidates(slot, page = 1) {
  const width = targetWidth(slot.role);
  const candidates = [];

  try {
    const unsplash = await searchUnsplash(slot.query, page);
    await sleep(DELAY_MS);
    if (unsplash?.length) candidates.push(...unsplash);
  } catch (err) {
    console.warn(`  Unsplash search failed (page ${page}): ${err.message}`);
  }

  try {
    const pexels = await searchPexels(slot.query, page);
    await sleep(DELAY_MS);
    if (pexels?.length) candidates.push(...pexels);
  } catch (err) {
    console.warn(`  Pexels search failed (page ${page}): ${err.message}`);
  }

  if (page === 1) {
    const tryWikimedia = slot.preferWikimedia || candidates.length === 0;
    if (tryWikimedia) {
      try {
        const wikimediaQuery = slot.wikimediaQuery ?? slot.query;
        const wikimedia = await searchWikimedia(wikimediaQuery);
        await sleep(DELAY_MS);
        if (wikimedia?.length) candidates.push(...wikimedia);
      } catch (err) {
        console.warn(`  Wikimedia search failed: ${err.message}`);
      }
    }

    for (const fb of slot.fallbackIds ?? []) {
      candidates.push(fallbackResult(fb, width));
    }
  }

  return candidates;
}

function candidateDownloadUrl(candidate, role) {
  if (candidate.provider === "unsplash" && candidate.photoId?.includes("-")) {
    return unsplashDownloadUrl(candidate.photoId, targetWidth(role));
  }
  return candidate.downloadUrl;
}

async function downloadToBuffer(url) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow" });
  if (!res.ok) throw new Error(`Download HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 2048) throw new Error(`File too small (${buffer.length} bytes)`);
  return buffer;
}

async function resolvePhoto(slot, tracker) {
  for (let page = 1; page <= 3; page++) {
    const candidates = await collectRemoteCandidates(slot, page);
    for (const candidate of candidates) {
      if (tracker.isCandidateUsed(candidate)) continue;

      if (candidate.copyFrom) {
        if (!copyFromExists(candidate.copyFrom)) continue;
        const srcPath = path.join(publicRoot, candidate.copyFrom.replace(/^\/+/, ""));
        const hash = contentHashFromFile(srcPath);
        if (tracker.isContentHashUsed(hash)) continue;
        tracker.record(candidate, hash);
        return { ...candidate, contentHash: hash, copyFrom: candidate.copyFrom };
      }

      const url = candidateDownloadUrl(candidate, slot.role);
      if (!(await verifyDownloadUrl(url))) continue;

      try {
        const buffer = await downloadToBuffer(url);
        const hash = contentHashFromBuffer(buffer);
        if (tracker.isContentHashUsed(hash)) {
          console.warn(`  Skip duplicate bytes for ${slot.id} (${hash.slice(0, 8)}…)`);
          continue;
        }
        tracker.record(candidate, hash);
        return {
          ...candidate,
          downloadUrl: url,
          contentHash: hash,
          buffer,
        };
      } catch (err) {
        console.warn(`  Download failed for ${slot.id}: ${err.message}`);
      }
    }
  }

  if (slot.copyFrom && copyFromExists(slot.copyFrom)) {
    const local = localCopyResult(slot);
    if (!tracker.isCandidateUsed(local)) {
      const srcPath = path.join(publicRoot, slot.copyFrom.replace(/^\/+/, ""));
      const hash = contentHashFromFile(srcPath);
      if (!tracker.isContentHashUsed(hash)) {
        tracker.record(local, hash);
        return { ...local, contentHash: hash };
      }
    }
  }

  throw new Error(`No unique photo for ${slot.id}`);
}

function targetWidth(role) {
  if (role === "thumbnail" || role === "card") return THUMB_WIDTH;
  if (role === "gallery" || role === "section" || role === "content") return GALLERY_WIDTH;
  return HERO_WIDTH;
}

async function downloadFile(url, destPath) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow" });
  if (!res.ok) throw new Error(`Download HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 2048) throw new Error(`File too small (${buffer.length} bytes)`);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.writeFileSync(destPath, buffer);
  return buffer.length;
}

function buildAsset(slot, photo) {
  const width = targetWidth(slot.role);
  let downloadUrl = photo.downloadUrl;
  if (photo.provider === "unsplash" && photo.photoId?.includes("-")) {
    downloadUrl = unsplashDownloadUrl(photo.photoId, width);
  }

  const asset = {
    id: slot.id,
    title: slot.alt.slice(0, 80),
    alt: slot.alt,
    category: slot.category,
    tags: ["stock", slot.role, ...(slot.articleId ? ["blog-rich"] : [])].filter(Boolean),
    source:
      photo.provider === "pexels"
        ? "pexels"
        : photo.provider === "wikimedia" || photo.provider === "local"
          ? "wikimedia"
          : "unsplash",
    sourceUrl: photo.sourceUrl,
    license: photo.license,
    author: photo.author,
    localPath: slot.localPath,
    role: slot.role,
  };

  if (photo.contentHash) asset.contentHash = photo.contentHash;

  if (slot.immigrationTopicId) asset.immigrationTopicId = slot.immigrationTopicId;
  if (slot.servicePageId) asset.servicePageId = slot.servicePageId;
  if (slot.podborRegionId) asset.podborRegionId = slot.podborRegionId;
  if (slot.podborThemeId) asset.podborThemeId = slot.podborThemeId;
  if (slot.shopProductId) asset.shopProductId = slot.shopProductId;
  if (slot.blogPostSlug) asset.blogPostSlug = slot.blogPostSlug;
  if (slot.articleId) asset.articleId = slot.articleId;
  if (slot.guideTopicId) asset.guideTopicId = slot.guideTopicId;
  if (slot.destinationId) asset.destinationId = slot.destinationId;
  if (photo.provider === "unsplash" && photo.authorProfileUrl) {
    asset.authorProfileUrl = photo.authorProfileUrl;
  }
  if (photo.provider === "pexels" && photo.authorProfileUrl) {
    asset.authorProfileUrl = photo.authorProfileUrl;
  }
  const source = asset.source;
  if (source === "unsplash" || source === "pexels") {
    const authorLink = asset.authorProfileUrl
      ? `<a href="${asset.authorProfileUrl}">${asset.author}</a>`
      : asset.author;
    const brand = source === "unsplash" ? "Unsplash" : "Pexels";
    asset.attributionHtml = `Фото: ${authorLink} / <a href="${asset.sourceUrl}">${brand}</a>`;
    asset.attributionRequired = true;
  }
  if (source === "wikimedia" && photo.provider === "wikimedia") {
    asset.attributionHtml = `Фото: ${asset.author} / <a href="${asset.sourceUrl}">Wikimedia Commons</a> (${asset.license})`;
    asset.imageTitle = photo.imageTitle ?? slot.alt.slice(0, 80);
  } else {
    asset.imageTitle = slot.alt.slice(0, 80);
  }

  return { asset, downloadUrl, copyFrom: photo.copyFrom };
}

function copyLocalFile(relativePath, destPath) {
  const srcPath = path.join(publicRoot, relativePath.replace(/^\/+/, ""));
  if (!fs.existsSync(srcPath)) throw new Error(`Copy source missing: ${relativePath}`);
  fs.mkdirSync(path.dirname(destPath), { recursive: true });
  fs.copyFileSync(srcPath, destPath);
  return fs.statSync(destPath).size;
}

function loadManifest() {
  const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return { version: data.version ?? 1, assets: data.assets ?? [] };
}

function mergeManifest(existing, newAssets) {
  const byId = new Map(existing.assets.map((a) => [a.id, a]));
  for (const asset of newAssets) byId.set(asset.id, asset);
  return { version: existing.version, assets: [...byId.values()] };
}

function selectSlots() {
  if (!ONLY_IDS) return STOCK_MEDIA_SLOTS;
  const selected = STOCK_MEDIA_SLOTS.filter((s) => ONLY_IDS.has(s.id));
  const missing = [...ONLY_IDS].filter((id) => !selected.some((s) => s.id === id));
  if (missing.length) {
    console.warn(`Unknown slot ids: ${missing.join(", ")}`);
  }
  return selected;
}

async function main() {
  const slots = selectSlots();
  console.log(`Stock media fetch (${slots.length}${ONLY_IDS ? ` of ${STOCK_MEDIA_SLOTS.length}` : ""} slots)`);
  console.log(`  Unsplash API: ${getUnsplashKey() ? "yes" : "no (fallback IDs)"}`);
  console.log(`  Pexels API:   ${getPexelsKey() ? "yes" : "no"}`);
  console.log(`  Wikimedia:    yes (Commons API, no key)`);
  if (ONLY_IDS) console.log(`  Filter: --only=${[...ONLY_IDS].join(",")}`);
  if (DRY_RUN) console.log("  Mode: DRY RUN\n");

  const manifest = loadManifest();
  const newAssets = [];
  const articleTrackers = new Map();
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const slot of slots) {
    const destPath = path.join(publicRoot, slot.localPath);
    const exists = fs.existsSync(destPath);

    if (exists && !FORCE) {
      const existing = manifest.assets.find((a) => a.id === slot.id);
      if (existing) {
        console.log(`SKIP  ${slot.id} (file + manifest exist)`);
        skipped++;
        continue;
      }
    }

    try {
      const tracker = slot.articleId
        ? articleTrackers.get(slot.articleId) ?? createArticleTracker()
        : createArticleTracker();
      if (slot.articleId && !articleTrackers.has(slot.articleId)) {
        articleTrackers.set(slot.articleId, tracker);
      }

      const photo = await resolvePhoto(slot, tracker);
      const { asset, downloadUrl, copyFrom } = buildAsset(slot, photo);

      if (DRY_RUN) {
        console.log(
          `PLAN  ${slot.id} ← ${photo.provider}:${photo.photoId ?? copyFrom} md5=${photo.contentHash?.slice(0, 8) ?? "?"}`,
        );
        newAssets.push(asset);
        continue;
      }

      if (!exists || FORCE) {
        let bytes;
        if (copyFrom) {
          bytes = copyLocalFile(copyFrom, destPath);
          console.log(
            `COPY  ${slot.id} ← ${copyFrom} → ${slot.localPath} (${bytes} bytes, md5=${photo.contentHash?.slice(0, 8) ?? "?"})`,
          );
        } else if (photo.buffer) {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
          fs.writeFileSync(destPath, photo.buffer);
          bytes = photo.buffer.length;
          console.log(
            `OK    ${slot.id} → ${slot.localPath} (${bytes} bytes, md5=${photo.contentHash?.slice(0, 8) ?? "?"})`,
          );
          await sleep(DELAY_MS);
        } else {
          bytes = await downloadFile(downloadUrl, destPath);
          console.log(`OK    ${slot.id} → ${slot.localPath} (${bytes} bytes)`);
          await sleep(DELAY_MS);
        }
        downloaded++;
      } else {
        console.log(`KEEP  ${slot.id} (file exists)`);
        skipped++;
      }

      newAssets.push(asset);
    } catch (err) {
      console.error(`FAIL  ${slot.id}: ${err.message}`);
      failed++;
    }
  }

  if (!DRY_RUN && newAssets.length > 0) {
    const merged = mergeManifest(manifest, newAssets);
    fs.writeFileSync(manifestPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");
    console.log(`\nManifest updated: +${newAssets.length} assets (${merged.assets.length} total)`);
  }

  console.log(`\nDone: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
