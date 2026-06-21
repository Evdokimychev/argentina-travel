#!/usr/bin/env node
/** Sync cms_media_assets (manifest_synced=false) into src/data/media-library/manifest.json */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST_PATH = path.join(__dirname, "../src/data/media-library/manifest.json");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(url, key);

function rowToAsset(row) {
  return {
    id: `cms:${row.id}`,
    title: row.title,
    alt: row.alt || row.title,
    source: "local",
    sourceUrl: row.public_url,
    license: "Uploaded via CMS",
    category: row.category || "blog-article",
    tags: row.tags ?? [],
    localPath: row.public_url,
    role: row.role || "content",
    attributionRequired: false,
  };
}

const { data: rows, error } = await supabase
  .from("cms_media_assets")
  .select("*")
  .eq("manifest_synced", false);

if (error) {
  console.error(error.message);
  process.exit(1);
}

const raw = await fs.readFile(MANIFEST_PATH, "utf8");
const manifest = JSON.parse(raw);
let added = 0;
let updated = 0;

for (const row of rows ?? []) {
  const asset = rowToAsset(row);
  const index = manifest.assets.findIndex((entry) => entry.id === asset.id);
  if (index >= 0) {
    manifest.assets[index] = asset;
    updated += 1;
  } else {
    manifest.assets.push(asset);
    added += 1;
  }
}

if (added > 0 || updated > 0) {
  manifest.version = (manifest.version ?? 1) + 1;
  await fs.writeFile(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

const syncedIds = (rows ?? []).map((r) => r.id);
if (syncedIds.length > 0) {
  await supabase.from("cms_media_assets").update({ manifest_synced: true }).in("id", syncedIds);
}

console.log(
  `CMS media manifest sync: added ${added}, updated ${updated}, total ${manifest.assets.length}`
);
