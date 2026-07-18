#!/usr/bin/env node
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  CRITICAL_PUBLIC_MEDIA,
  DEFAULT_CRITICAL_MEDIA_MAX_EDGE,
  mediaBudgetFor,
} from "./lib/critical-public-media.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");

function md5(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const byPath = new Map((manifest.assets ?? []).map((asset) => [asset.localPath, asset]));

for (const entry of CRITICAL_PUBLIC_MEDIA) {
  const fullPath = path.join(publicRoot, entry.path);
  if (!fs.existsSync(fullPath)) throw new Error(`Missing curated media: /${entry.path}`);

  const before = fs.statSync(fullPath).size;
  const beforeMeta = await sharp(fullPath).metadata();
  const maxEdge = entry.maxEdge ?? DEFAULT_CRITICAL_MEDIA_MAX_EDGE;
  const currentEdge = Math.max(beforeMeta.width ?? 0, beforeMeta.height ?? 0);
  if (before > mediaBudgetFor(entry) || currentEdge > maxEdge) {
    const temporaryPath = path.join(os.tmpdir(), `goargentina-${crypto.randomUUID()}.jpg`);
    await sharp(fullPath)
      .rotate()
      .resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
      .jpeg({
        quality: entry.quality ?? 72,
        progressive: true,
        chromaSubsampling: "4:2:0",
        mozjpeg: true,
      })
      .toFile(temporaryPath);

    const optimized = fs.readFileSync(temporaryPath);
    fs.rmSync(temporaryPath, { force: true });
    if (optimized.length < before) fs.writeFileSync(fullPath, optimized);
  }

  const current = fs.readFileSync(fullPath);
  const asset = byPath.get(entry.path);
  if (asset) asset.contentHash = md5(current);
  else if (entry.manifestRequired !== false) {
    throw new Error(`Manifest entry missing for /${entry.path}`);
  }
  console.log(`/${entry.path}: ${Math.ceil(before / 1024)} KB -> ${Math.ceil(current.length / 1024)} KB`);
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
