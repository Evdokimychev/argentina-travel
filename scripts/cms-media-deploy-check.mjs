#!/usr/bin/env node
/**
 * Pre-deploy check: CMS media must be in committed manifest (Vercel skips live sync).
 *
 * Usage:
 *   npm run cms-media:deploy-check
 *   npm run cms-media:deploy-check -- --strict   # fail if pending uploads in Supabase
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { LEGACY_BLOG_MEDIA_SLUGS } from "./prune-legacy-blog-media.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");

function loadEnvLocal() {
  for (const file of [".env.local", ".env"]) {
    const envPath = path.join(root, file);
    if (!fs.existsSync(envPath)) continue;
    for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

async function countPendingCmsUploads() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!url || !key) return null;

  const response = await fetch(
    `${url.replace(/\/$/, "")}/rest/v1/cms_media_assets?manifest_synced=eq.false&select=id`,
    {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15000),
    }
  );

  if (!response.ok) {
    throw new Error(`cms_media_assets HTTP ${response.status}`);
  }

  const rows = await response.json();
  return Array.isArray(rows) ? rows.length : 0;
}

function checkManifestLegacySlugs() {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const legacy = (manifest.assets ?? []).filter(
    (asset) => asset.blogPostSlug && LEGACY_BLOG_MEDIA_SLUGS[asset.blogPostSlug]
  );
  return legacy.map((asset) => asset.blogPostSlug);
}

async function main() {
  loadEnvLocal();
  const strict = process.argv.includes("--strict");
  let failures = 0;

  console.log("CMS media deploy check");

  const legacySlugs = checkManifestLegacySlugs();
  if (legacySlugs.length > 0) {
    console.error(`✗ manifest contains legacy slugs: ${legacySlugs.join(", ")}`);
    console.error("  Run: npm run prune-legacy-blog-media");
    failures += 1;
  } else {
    console.log("✓ manifest: no legacy blog slugs");
  }

  const skipSync = process.env.VERCEL === "1" || process.env.CMS_MEDIA_SKIP_MANIFEST_SYNC === "1";
  if (skipSync) {
    console.log("! CMS manifest sync skipped at runtime (Vercel) — commit manifest.json after upload");
  } else {
    console.log("✓ Local/dev can run: npm run sync-cms-media-manifest");
  }

  try {
    const pending = await countPendingCmsUploads();
    if (pending === null) {
      console.log("– pending uploads: skip (no Supabase env)");
    } else if (pending > 0) {
      const msg = `! ${pending} cms_media_assets with manifest_synced=false`;
      if (strict) {
        console.error(`✗ ${msg} — run npm run sync-cms-media-manifest && commit`);
        failures += 1;
      } else {
        console.log(msg);
      }
    } else {
      console.log("✓ no pending CMS media uploads in DB");
    }
  } catch (error) {
    console.log(`– pending uploads: ${error instanceof Error ? error.message : error}`);
  }

  console.log("\nDeploy checklist:");
  console.log("  1. Upload in Admin → Media");
  console.log("  2. npm run sync-cms-media-manifest");
  console.log("  3. git add src/data/media-library/manifest.json && deploy");

  if (failures > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
