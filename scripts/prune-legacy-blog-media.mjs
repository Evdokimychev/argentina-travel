#!/usr/bin/env node
/**
 * Remove or remap legacy blog media slugs superseded by content-plan redirects.
 *
 * Usage:
 *   npm run prune-legacy-blog-media
 *   npm run prune-legacy-blog-media:check
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

/** Legacy slug → canonical slug (must match content-plan-url-redirects). */
export const LEGACY_BLOG_MEDIA_SLUGS = {
  "buenos-aires-neighborhoods": "buenos-aires-rajony",
  "mendoza-wine-route": "mendoza-vinnyj-gid",
};

const MANIFEST_PATH = path.join(root, "src/data/media-library/manifest.json");
const STOCK_CACHE_PATHS = [
  path.join(root, "src/data/media-library/stock-cache.json"),
  path.join(root, "var/cache/image-provider/stock-cache.json"),
];

function legacyFolderInPath(value) {
  if (typeof value !== "string") return null;
  for (const legacy of Object.keys(LEGACY_BLOG_MEDIA_SLUGS)) {
    if (value.includes(`/media/blog/${legacy}/`) || value.includes(`media/blog/${legacy}/`)) {
      return legacy;
    }
  }
  return null;
}

function remapMediaPath(value, legacy, canonical) {
  return value.replaceAll(`media/blog/${legacy}/`, `media/blog/${canonical}/`).replaceAll(
    `/media/blog/${legacy}/`,
    `/media/blog/${canonical}/`
  );
}

function pruneManifest(manifest, checkOnly) {
  const before = manifest.assets.length;
  const removed = [];
  const kept = [];

  for (const asset of manifest.assets) {
    const legacySlug = asset.blogPostSlug && LEGACY_BLOG_MEDIA_SLUGS[asset.blogPostSlug];
    const legacyFromPath = legacyFolderInPath(asset.localPath ?? "");
    const legacy = legacySlug ? asset.blogPostSlug : legacyFromPath;

    if (legacy && LEGACY_BLOG_MEDIA_SLUGS[legacy]) {
      removed.push(asset.id ?? asset.localPath ?? legacy);
      continue;
    }
    kept.push(asset);
  }

  if (!checkOnly && removed.length > 0) {
    manifest.assets = kept;
    manifest.version = (manifest.version ?? 1) + 1;
  }

  return { before, after: kept.length, removed };
}

function pruneStockCache(cache, checkOnly) {
  let updated = 0;
  let removed = 0;

  if (!cache?.entries || typeof cache.entries !== "object") {
    return { updated, removed };
  }

  for (const [key, entry] of Object.entries(cache.entries)) {
    const resolved = entry?.resolved;
    if (!resolved) continue;

    const legacyFromPath =
      legacyFolderInPath(resolved.localPath ?? "") ?? legacyFolderInPath(resolved.src ?? "");
    const legacyFromSlug =
      resolved.blogPostSlug && LEGACY_BLOG_MEDIA_SLUGS[resolved.blogPostSlug]
        ? resolved.blogPostSlug
        : null;
    const legacy = legacyFromSlug ?? legacyFromPath;

    if (!legacy || !LEGACY_BLOG_MEDIA_SLUGS[legacy]) continue;

    const canonical = LEGACY_BLOG_MEDIA_SLUGS[legacy];
    if (resolved.localPath) {
      resolved.localPath = remapMediaPath(resolved.localPath, legacy, canonical);
    }
    if (resolved.src) {
      resolved.src = remapMediaPath(resolved.src, legacy, canonical);
    }
    if (resolved.blogPostSlug === legacy) {
      resolved.blogPostSlug = canonical;
    }
    updated += 1;
  }

  if (checkOnly) {
    return { updated, removed };
  }

  return { updated, removed };
}

function main() {
  const checkOnly = process.argv.includes("--check");
  let failures = 0;

  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
  const manifestResult = pruneManifest(manifest, checkOnly);

  if (manifestResult.removed.length > 0) {
    const msg = `manifest: ${manifestResult.removed.length} legacy assets`;
    if (checkOnly) {
      console.error(`✗ ${msg}`);
      console.error(`  ids: ${manifestResult.removed.slice(0, 6).join(", ")}`);
      failures += 1;
    } else {
      fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
      console.log(`✓ ${msg} removed (${manifestResult.before} → ${manifestResult.after})`);
    }
  } else {
    console.log("✓ manifest: no legacy blog slugs");
  }

  for (const cachePath of STOCK_CACHE_PATHS) {
    if (!fs.existsSync(cachePath)) continue;
    const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
    const cacheResult = pruneStockCache(cache, checkOnly);

    const legacyPaths = Object.values(cache.entries ?? {}).filter((entry) => {
      const resolved = entry?.resolved;
      if (!resolved) return false;
      return Boolean(
        legacyFolderInPath(resolved.localPath ?? "") ?? legacyFolderInPath(resolved.src ?? "")
      );
    });

    if (legacyPaths.length > 0 && checkOnly) {
      console.error(`✗ ${path.relative(root, cachePath)}: ${legacyPaths.length} legacy paths`);
      failures += 1;
    } else if (cacheResult.updated > 0 && !checkOnly) {
      fs.writeFileSync(cachePath, `${JSON.stringify(cache, null, 2)}\n`, "utf8");
      console.log(`✓ ${path.relative(root, cachePath)}: remapped ${cacheResult.updated} entries`);
    } else if (legacyPaths.length === 0) {
      console.log(`✓ ${path.relative(root, cachePath)}: clean`);
    }
  }

  if (failures > 0) {
    console.error("\nRun: npm run prune-legacy-blog-media");
    process.exit(1);
  }

  if (!checkOnly) {
    console.log("\nDone. Commit manifest + stock-cache if changed.");
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  main();
}
