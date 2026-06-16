#!/usr/bin/env node
/**
 * Download media assets from manifest.json into public/media/.
 * Deduplicates by sourceUrl, retries on HTTP 429, skips existing files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");
const publicRoot = path.join(root, "public");

const USER_AGENT = "argentina-travel-media-sync/1.0 (https://github.com/argentina-travel)";
const DELAY_MS = 1500;
const MAX_RETRIES = 5;

/** @type {Map<string, Buffer>} */
const downloadedByUrl = new Map();

function loadManifest() {
  if (!fs.existsSync(manifestPath)) {
    console.error(`Manifest not found: ${manifestPath}`);
    process.exit(1);
  }
  const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return data.assets ?? data;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url, attempt = 1) {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    redirect: "follow",
  });
  if (res.status === 429 && attempt < MAX_RETRIES) {
    await sleep(DELAY_MS * attempt * 2);
    return fetchWithRetry(url, attempt + 1);
  }
  return res;
}

async function getBuffer(sourceUrl) {
  if (downloadedByUrl.has(sourceUrl)) {
    return downloadedByUrl.get(sourceUrl);
  }
  const res = await fetchWithRetry(sourceUrl);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 512) {
    throw new Error(`file too small (${buffer.length} bytes)`);
  }
  downloadedByUrl.set(sourceUrl, buffer);
  await sleep(DELAY_MS);
  return buffer;
}

async function downloadAsset(asset) {
  const destPath = path.join(publicRoot, asset.localPath);
  if (fs.existsSync(destPath)) {
    console.log(`SKIP  ${asset.id} → ${asset.localPath}`);
    return { id: asset.id, status: "skipped" };
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  try {
    const buffer = await getBuffer(asset.sourceUrl);
    fs.writeFileSync(destPath, buffer);
    console.log(`OK    ${asset.id} → ${asset.localPath} (${buffer.length} bytes)`);
    return { id: asset.id, status: "downloaded", bytes: buffer.length };
  } catch (err) {
    console.error(`FAIL  ${asset.id} ${err.message} ${asset.sourceUrl}`);
    return { id: asset.id, status: "failed", error: err.message };
  }
}

async function main() {
  const assets = loadManifest();
  console.log(`Syncing ${assets.length} assets (${new Set(assets.map((a) => a.sourceUrl)).size} unique URLs)…\n`);

  const results = { downloaded: 0, skipped: 0, failed: 0, failedIds: [] };

  for (const asset of assets) {
    const result = await downloadAsset(asset);
    if (result.status === "downloaded") results.downloaded++;
    else if (result.status === "skipped") results.skipped++;
    else {
      results.failed++;
      results.failedIds.push(result.id);
    }
  }

  console.log(`\nDone: ${results.downloaded} downloaded, ${results.skipped} skipped, ${results.failed} failed`);
  if (results.failed > 0) {
    const failPath = path.join(root, "docs/media-sync-failures.json");
    fs.writeFileSync(
      failPath,
      JSON.stringify(
        results.failedIds.map((id) => {
          const asset = assets.find((a) => a.id === id);
          return { id, sourceUrl: asset?.sourceUrl };
        }),
        null,
        2,
      ),
    );
    console.log(`Failures: ${failPath}`);
    process.exitCode = 1;
  }
}

main();
