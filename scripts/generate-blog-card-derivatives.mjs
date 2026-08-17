#!/usr/bin/env node
/**
 * Build lightweight -card.webp (and editorial avatar) derivatives for blog hub
 * listing surfaces. Required while NEXT image optimization stays off on Vercel.
 */
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { MOBILE_DERIVATIVE_BUDGET_BYTES } from "./lib/critical-public-media.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicRoot = path.join(root, "public");
const CARD_MAX_EDGE = 960;
const CARD_QUALITY = 68;
const AVATAR_EDGE = 256;

const CATEGORY_CARD_SOURCES = [
  "media/places/perito-moreno-glacier/hero.jpg",
  "media/places/buenos-aires/hero.jpg",
  "media/places/salta/hero.jpg",
  "media/places/iguazu-falls/hero.jpg",
  "media/places/los-glaciares-national-park/hero.jpg",
  "media/places/el-chalten/gallery-1.jpg",
  "media/places/valdes-peninsula/hero.jpg",
  "media/places/mendoza/hero.jpg",
  "media/blog/wineries.jpg",
  "media/blog/food.jpg",
  "media/blog/transport.jpg",
  "media/blog/money.jpg",
  "media/blog/safety.jpg",
  "media/blog/internet.jpg",
  "media/blog/relocation.jpg",
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function toCardRelative(relativePath) {
  return relativePath.replace(/\.(?:jpe?g|png|webp)$/i, "-card.webp");
}

function md5(buffer) {
  return crypto.createHash("md5").update(buffer).digest("hex");
}

async function writeWebpDerivative(sourceAbs, destAbs, { maxEdge, quality, square }) {
  const temporaryPath = path.join(os.tmpdir(), `goargentina-card-${crypto.randomUUID()}.webp`);
  let pipeline = sharp(sourceAbs, { failOn: "none" }).rotate();
  if (square) {
    pipeline = pipeline.resize({
      width: maxEdge,
      height: maxEdge,
      fit: "cover",
      position: "attention",
    });
  } else {
    pipeline = pipeline.resize({
      width: maxEdge,
      height: maxEdge,
      fit: "inside",
      withoutEnlargement: true,
    });
  }
  await pipeline.webp({ quality, effort: 4 }).toFile(temporaryPath);

  let bytes = fs.readFileSync(temporaryPath);
  // Stay inside the critical-public-media mobile derivative budget.
  if (bytes.length > MOBILE_DERIVATIVE_BUDGET_BYTES) {
    await sharp(temporaryPath)
      .webp({ quality: Math.max(50, quality - 12), effort: 5 })
      .toFile(temporaryPath);
    bytes = fs.readFileSync(temporaryPath);
  }
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  fs.writeFileSync(destAbs, bytes);
  fs.rmSync(temporaryPath, { force: true });
  return bytes.length;
}

const sources = new Set(CATEGORY_CARD_SOURCES);

for (const fullPath of walk(path.join(publicRoot, "media/blog"))) {
  const relativePath = path.relative(publicRoot, fullPath).split(path.sep).join("/");
  if (/\/hero\.(?:jpe?g|png|webp)$/i.test(relativePath) && !/(?:mobile|card|lcp)/i.test(relativePath)) {
    sources.add(relativePath);
  }
}

let written = 0;
let skipped = 0;
for (const relativePath of [...sources].sort()) {
  const sourceAbs = path.join(publicRoot, relativePath);
  if (!fs.existsSync(sourceAbs)) {
    console.warn(`skip missing ${relativePath}`);
    skipped += 1;
    continue;
  }
  const destRel = toCardRelative(relativePath);
  const destAbs = path.join(publicRoot, destRel);
  const before = fs.existsSync(destAbs) ? fs.statSync(destAbs).size : 0;
  const size = await writeWebpDerivative(sourceAbs, destAbs, {
    maxEdge: CARD_MAX_EDGE,
    quality: CARD_QUALITY,
    square: false,
  });
  written += 1;
  console.log(
    `/${destRel}: ${Math.ceil(before / 1024)} KB -> ${Math.ceil(size / 1024)} KB (from /${relativePath}, md5 ${md5(fs.readFileSync(destAbs)).slice(0, 8)})`,
  );
}

const avatarSource = path.join(publicRoot, "media/blog/grazhdanstvo-argentiny/hero.jpg");
const avatarDest = path.join(publicRoot, "media/blog/editorial-avatar.webp");
if (fs.existsSync(avatarSource)) {
  const size = await writeWebpDerivative(avatarSource, avatarDest, {
    maxEdge: AVATAR_EDGE,
    quality: 72,
    square: true,
  });
  console.log(`/media/blog/editorial-avatar.webp: ${Math.ceil(size / 1024)} KB`);
} else {
  console.warn("editorial avatar source missing");
}

console.log(`done: wrote ${written} card derivatives, skipped ${skipped}`);
