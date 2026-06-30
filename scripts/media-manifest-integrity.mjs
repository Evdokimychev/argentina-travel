#!/usr/bin/env node
/**
 * Verify manifest localPath files exist under public/ and optionally on production.
 *
 * Usage:
 *   node scripts/media-manifest-integrity.mjs
 *   node scripts/media-manifest-integrity.mjs --prod
 *   MEDIA_INTEGRITY_BASE_URL=https://www.goargentina.ru node scripts/media-manifest-integrity.mjs --prod
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");
const publicRoot = path.join(root, "public");

const checkProd = process.argv.includes("--prod");
const prodBase = (process.env.MEDIA_INTEGRITY_BASE_URL ?? "https://www.goargentina.ru").replace(
  /\/$/,
  "",
);

function toPublicPath(localPath) {
  const normalized = localPath.replace(/^\/+/, "");
  const rel = normalized.startsWith("media/") ? normalized : `media/${normalized}`;
  return { rel, url: `/${rel}` };
}

function loadManifestPaths() {
  const data = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  return (data.assets ?? [])
    .filter((a) => a.localPath)
    .map((a) => ({ id: a.id, ...toPublicPath(a.localPath) }));
}

async function main() {
  const entries = loadManifestPaths();
  const missingDisk = [];
  const missingProd = [];

  for (const entry of entries) {
    const full = path.join(publicRoot, entry.rel);
    if (!fs.existsSync(full)) missingDisk.push(entry);
  }

  console.log(`Manifest assets with localPath: ${entries.length}`);
  console.log(`Missing on disk: ${missingDisk.length}`);

  if (missingDisk.length) {
    for (const m of missingDisk) console.error(`  ✗ disk ${m.url} (${m.id})`);
  } else {
    console.log("✓ All manifest files present under public/");
  }

  // Known runtime fallbacks outside manifest
  const extras = ["media/placeholders/tour-card.jpg"];
  for (const rel of extras) {
    const full = path.join(publicRoot, rel);
    if (!fs.existsSync(full)) {
      console.error(`✗ missing runtime fallback: /${rel}`);
      missingDisk.push({ id: "runtime-fallback", rel, url: `/${rel}` });
    } else {
      console.log(`✓ runtime fallback /${rel}`);
    }
  }

  if (checkProd) {
    console.log(`\nChecking production (${prodBase})…`);
    let i = 0;
    const concurrency = 10;
    const all = [...entries, ...extras.map((rel) => ({ id: "extra", rel, url: `/${rel}` }))];
    const unique = [...new Map(all.map((e) => [e.url, e])).values()];

    async function worker() {
      while (i < unique.length) {
        const entry = unique[i++];
        const res = await fetch(`${prodBase}${entry.url}`, {
          method: "HEAD",
          redirect: "follow",
        });
        if (res.status !== 200) missingProd.push({ ...entry, status: res.status });
      }
    }

    await Promise.all(Array.from({ length: concurrency }, worker));
    console.log(`Production broken: ${missingProd.length}`);
    for (const m of missingProd.slice(0, 20)) {
      console.error(`  ✗ ${m.status} ${m.url}${m.id !== "extra" ? ` (${m.id})` : ""}`);
    }
    if (missingProd.length > 20) console.error(`  … and ${missingProd.length - 20} more`);
  }

  const failures = missingDisk.length + missingProd.length;
  if (failures > 0) process.exit(1);
  console.log("\n✓ Media manifest integrity OK");
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
