#!/usr/bin/env node
import fs from "node:fs";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  CRITICAL_PUBLIC_MEDIA,
  DEFAULT_CRITICAL_MEDIA_MAX_EDGE,
  MOBILE_DERIVATIVE_BUDGET_BYTES,
  isMobileDerivative,
  mediaBudgetFor,
} from "./lib/critical-public-media.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const manifest = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/media-library/manifest.json"), "utf8"),
);
const manifestByPath = new Map(
  (manifest.assets ?? []).map((asset) => [asset.localPath, asset]),
);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

async function inspect(relativePath, maxBytes, maxEdge, manifestRequired = false) {
  const fullPath = path.join(publicRoot, relativePath);
  if (!fs.existsSync(fullPath)) return [`missing /${relativePath}`];

  const bytes = fs.statSync(fullPath).size;
  const meta = await sharp(fullPath).metadata();
  const edge = Math.max(meta.width ?? 0, meta.height ?? 0);
  const failures = [];
  if (bytes > maxBytes) {
    failures.push(`/${relativePath}: ${Math.ceil(bytes / 1024)} KB > ${Math.ceil(maxBytes / 1024)} KB`);
  }
  if (maxEdge && edge > maxEdge) {
    failures.push(`/${relativePath}: ${edge}px > ${maxEdge}px`);
  }
  if (manifestRequired) {
    const asset = manifestByPath.get(relativePath);
    if (!asset) failures.push(`/${relativePath}: media manifest entry missing`);
    else {
      const actualHash = crypto
        .createHash("md5")
        .update(fs.readFileSync(fullPath))
        .digest("hex");
      if (asset.contentHash !== actualHash) {
        failures.push(`/${relativePath}: contentHash does not match the delivered file`);
      }
    }
  }
  return failures;
}

const checks = CRITICAL_PUBLIC_MEDIA.map((entry) =>
  inspect(
    entry.path,
    mediaBudgetFor(entry),
    entry.maxEdge ?? DEFAULT_CRITICAL_MEDIA_MAX_EDGE,
    entry.manifestRequired !== false,
  ),
);

for (const fullPath of walk(path.join(publicRoot, "media"))) {
  const relativePath = path.relative(publicRoot, fullPath).split(path.sep).join("/");
  if (!isMobileDerivative(relativePath)) continue;
  checks.push(inspect(relativePath, MOBILE_DERIVATIVE_BUDGET_BYTES, 1600));
}

const failures = (await Promise.all(checks)).flat();
if (failures.length) {
  console.error("Critical public media budget failed:");
  failures.forEach((failure) => console.error(`  - ${failure}`));
  console.error("Run `npm run media:critical:optimize` for curated fallback sources.");
  process.exit(1);
}

console.log(
  `Critical public media budget PASS (${CRITICAL_PUBLIC_MEDIA.length} fallbacks, mobile derivatives <= ${Math.ceil(MOBILE_DERIVATIVE_BUDGET_BYTES / 1024)} KB).`,
);
