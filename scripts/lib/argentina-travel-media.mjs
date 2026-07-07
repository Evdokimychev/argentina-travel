/**
 * Скачивание фото Argentina.travel → public/media + манифест мест.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sleep } from "./argentina-travel-client.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");
const publicRoot = path.join(root, "public");

const USER_AGENT = "argentina-travel-kb-sync/1.0 (https://www.goargentina.ru)";
const DELAY_MS = 800;

function loadManifest() {
  if (!fs.existsSync(manifestPath)) return { version: 1, assets: [] };
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function saveManifest(manifest) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}

function extFromUrl(url) {
  const m = url.match(/\.(jpe?g|png|webp)(\?|$)/i);
  return m ? `.${m[1].toLowerCase().replace("jpeg", "jpg")}` : ".jpg";
}

function safeFilename(url) {
  return url
    .split("/")
    .pop()
    ?.replace(/[^a-zA-Z0-9._-]+/g, "-")
    .slice(0, 80) ?? "photo.jpg";
}

export async function downloadActivityImages(activity, { placeId, kbId, dryRun }) {
  const results = [];
  const manifest = loadManifest();

  for (let i = 0; i < activity.images.length; i++) {
    const img = activity.images[i];
    const role = i === 0 ? "hero" : "gallery";
    const relDir = `media/argentina-travel/${kbId}`;
    const localFile = safeFilename(img.url);
    const localPath = `${relDir}/${localFile}`;
    const dest = path.join(publicRoot, localPath);
    const assetId = `at-${kbId}-${role}${role === "gallery" ? `-${i}` : ""}`;

    const existingAsset = manifest.assets.find(
      (a) => a.sourceUrl === img.url || a.id === assetId
    );

    if (existingAsset) {
      results.push({
        ...img,
        role,
        localUrl: `/${existingAsset.localPath}`,
        localPath: existingAsset.localPath,
        skipped: true,
      });
      continue;
    }

    if (!dryRun) {
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      if (!fs.existsSync(dest)) {
        const res = await fetch(img.url, { headers: { "User-Agent": USER_AGENT } });
        if (!res.ok) {
          console.warn(`[media] skip ${img.url}: HTTP ${res.status}`);
          results.push({ ...img, role, localUrl: img.url, failed: true });
          await sleep(DELAY_MS);
          continue;
        }
        const buf = Buffer.from(await res.arrayBuffer());
        if (buf.length < 512) {
          console.warn(`[media] skip ${img.url}: too small`);
          results.push({ ...img, role, localUrl: img.url, failed: true });
          continue;
        }
        fs.writeFileSync(dest, buf);
        await sleep(DELAY_MS);
      }
    }

    const author = img.author ?? "INPROTUR / Visit Argentina";
    const caption = `Фото: ${author} · Argentina.travel (INPROTUR)`;

    if (!dryRun) {
      manifest.assets.push({
        id: assetId,
        title: `${activity.titleEs ?? kbId} — ${role}`,
        alt: activity.titleEs ?? kbId,
        caption,
        category: "place",
        tags: [kbId, "argentina-travel", role],
        source: "argentina.travel",
        sourceUrl: img.url,
        license: "Argentina.travel / INPROTUR — указать источник на сайте",
        author,
        localPath,
        placeId: placeId ?? kbId,
        role,
        attributionRequired: true,
        attributionPage: img.sourcePage,
      });
    }

    results.push({
      ...img,
      role,
      localUrl: `/${localPath}`,
      localPath,
      alt: activity.titleEs,
    });
  }

  if (!dryRun) saveManifest(manifest);
  return results;
}

/** placeId из карты PLACE_TO_KB_ID (обратный поиск). */
export function resolvePlaceIdForKb(kbId, kbToPlaceMap) {
  return kbToPlaceMap[kbId] ?? null;
}

export function buildKbToPlaceMap(placeToKb) {
  const out = {};
  for (const [place, kb] of Object.entries(placeToKb)) {
    out[kb] = place;
  }
  return out;
}
