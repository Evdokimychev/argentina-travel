#!/usr/bin/env node
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PLACE_ASSETS } from "./media-manifest-data.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "src/data/media-library/manifest.json");

mkdirSync(dirname(outPath), { recursive: true });

const manifest = {
  version: 1,
  generatedAt: new Date().toISOString(),
  assets: PLACE_ASSETS,
};

writeFileSync(outPath, JSON.stringify(manifest, null, 2));
console.log(`Wrote ${PLACE_ASSETS.length} assets to ${outPath}`);
