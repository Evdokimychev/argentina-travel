#!/usr/bin/env node
/**
 * Полная интеграция импорта Argentina.travel в экосистему сайта:
 * редакторская вычитка, медиатека, карта мест ↔ KB, новые места, related-ссылки.
 *
 *   node scripts/integrate-argentina-travel.mjs --all
 *   node scripts/integrate-argentina-travel.mjs --editorial --limit=20
 *   node scripts/integrate-argentina-travel.mjs --sync-media
 *   node scripts/integrate-argentina-travel.mjs --expand-place-map --generate-places
 *   node scripts/integrate-argentina-travel.mjs --retranslate --limit=50
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import {
  fetchPageBySlug,
  resolveSlugAlias,
  sleep,
  DELAY_MS,
} from "./lib/argentina-travel-client.mjs";
import {
  editorialEnhanceArticle,
  hasCyrillic,
  isVaSourced,
  parseCoordinates,
  spanishRatio,
  translateTags,
} from "./lib/argentina-travel-editorial.mjs";
import { kbRoot, TYPE_DIRS } from "./lib/argentina-travel-kb.mjs";
import { buildKbToPlaceMap } from "./lib/argentina-travel-media.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const runAll = args.includes("--all");
const runEditorial = runAll || args.includes("--editorial");
const runSyncMedia = runAll || args.includes("--sync-media");
const runRestoreMedia = runAll || args.includes("--restore-media");
const runExpandMap = runAll || args.includes("--expand-place-map");
const runGeneratePlaces = runAll || args.includes("--generate-places");
const runRelated = runAll || args.includes("--related-links");
const runRebuild = runAll || args.includes("--rebuild-index");
const retranslate = args.includes("--retranslate");
const cacheOnly = args.includes("--from-cache-only");
const dryRun = args.includes("--dry-run");
const limitArg = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "0");
const slugArg = args.find((a) => a.startsWith("--slug="))?.split("=")[1];

const manifestPath = path.join(root, "src/data/media-library/manifest.json");
const kbMapPath = path.join(root, "scripts/data/argentina-travel-kb-map.json");
const placeMapOut = path.join(root, "src/data/kb-place-id-map.ts");
const placesSeedPath = path.join(root, "src/data/places-seed.ts");
const placesImportOut = path.join(root, "src/data/places-kb-import.generated.ts");
const siteIdMapOut = path.join(root, "content/knowledge-base/_index/site-id-map.json");

const REGION_LABEL = {
  noa: "Северо-запад",
  patagonia: "Патагония",
  cuyo: "Куйо",
  litoral: "Северо-восток",
  pampa: "Центр и Пампа",
  "buenos-aires-province": "Центр и Пампа",
  caba: "Центр и Пампа",
  "tierra-del-fuego": "Огненная Земля",
};

const REGION_DESTINATION = {
  noa: "noa",
  patagonia: "patagonia",
  cuyo: "cuyo",
  litoral: "litoral",
  pampa: "ba",
  "buenos-aires-province": "ba",
  caba: "ba",
  "tierra-del-fuego": "patagonia",
};

const KB_TYPE_TO_PLACE_CATEGORY = {
  city: "city",
  national_park: "national_park",
  attraction: "historic",
};

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadPlaceSlugs() {
  const text = fs.readFileSync(placesSeedPath, "utf8");
  return new Set([...text.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]));
}

function loadPlaceToKb() {
  const text = fs.readFileSync(placeMapOut, "utf8");
  const out = {};
  for (const m of text.matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

function listVaKbFiles() {
  const files = [];
  for (const dir of Object.values(TYPE_DIRS)) {
    const folder = path.join(kbRoot, dir);
    if (!fs.existsSync(folder)) continue;
    for (const file of fs.readdirSync(folder)) {
      if (!file.endsWith(".md")) continue;
      const full = path.join(folder, file);
      const text = fs.readFileSync(full, "utf8");
      if (text.includes("argentina.travel") || text.includes("INPROTUR")) {
        files.push(full);
      }
    }
  }
  return files.sort();
}

function parseMdFile(filePath) {
  const text = fs.readFileSync(filePath, "utf8");
  if (!text.startsWith("---")) return null;
  const parts = text.split("---", 3);
  if (parts.length < 3) return null;
  try {
    const fm = JSON.parse(
      execSync("python3 -c \"import yaml,json,sys; print(json.dumps(yaml.safe_load(sys.stdin)))\"", {
        input: parts[1],
        encoding: "utf8",
      })
    );
    return { fm: fm ?? {}, body: parts[2].trimStart(), path: filePath, rawFm: parts[1] };
  } catch {
    return parseFrontmatterYamlFallback(text, filePath);
  }
}

function dumpFrontmatter(fm) {
  return execSync(
    "python3 -c \"import yaml,json,sys; print(yaml.safe_dump(json.loads(sys.stdin.read()), allow_unicode=True, default_flow_style=False, sort_keys=False))\"",
    { input: JSON.stringify(fm), encoding: "utf8" }
  ).trimEnd();
}

function parseFrontmatterYamlFallback(text, filePath) {
  const parts = text.split("---", 3);
  if (parts.length < 3) return null;
  const fm = {};
  for (const line of parts[1].split("\n")) {
    const m = line.match(/^([a-z_0-9]+):\s*(.*)$/i);
    if (!m) continue;
    let val = m[2].trim().replace(/^["']|["']$/g, "");
    if (val === "true") fm[m[1]] = true;
    else if (val === "false") fm[m[1]] = false;
    else if (val.startsWith("{") && val.includes("lat")) {
      const lat = val.match(/lat:\s*([-0-9.]+)/)?.[1];
      const lng = val.match(/lng:\s*([-0-9.]+)/)?.[1];
      if (lat && lng) fm[m[1]] = { lat: Number(lat), lng: Number(lng) };
    } else fm[m[1]] = val;
  }
  return { fm, body: parts[2].trimStart(), path: filePath };
}

function sanitizeFm(fm) {
  if (typeof fm.coordinates === "string" && fm.coordinates.includes("[object Object]")) {
    delete fm.coordinates;
  }
  if (typeof fm.site_sections === "string") {
    try {
      fm.site_sections = JSON.parse(fm.site_sections.replace(/\\"/g, '"'));
    } catch {
      fm.site_sections = ["puteshestviya-po-argentine", "goroda-i-regiony"];
    }
  }
  const coords = parseCoordinates(fm);
  if (coords) fm.coordinates = coords;
  delete fm.coordinatesLat;
  delete fm.coordinatesLng;
  return fm;
}

function writeMd(filePath, fm, body) {
  if (dryRun) return;
  const content = `---\n${dumpFrontmatter(sanitizeFm({ ...fm }))}\n---\n\n${body}\n`;
  fs.writeFileSync(filePath, content, "utf8");
}

function normalizeSlug(s) {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function reverseKbMap() {
  const kbMap = loadJson(kbMapPath);
  const esToKb = {};
  for (const [es, kb] of Object.entries(kbMap)) {
    if (es.startsWith("_")) continue;
    esToKb[kb] = esToKb[kb] ?? es;
  }
  for (const [es, kb] of Object.entries(kbMap)) {
    if (es.startsWith("_")) continue;
    esToKb[kb] = esToKb[kb] ?? es;
  }
  return { kbMap, esByKb: esToKb };
}

async function runEditorialPass() {
  const files = listVaKbFiles().filter((f) => !slugArg || f.endsWith(`/${slugArg}.md`));
  const limited = limitArg > 0 ? files.slice(0, limitArg) : files;
  const { kbMap, esByKb } = reverseKbMap();

  let updated = 0;
  let promoted = 0;

  console.log(`[editorial] ${limited.length} VA-статей${retranslate ? " (retranslate)" : ""}`);

  for (const filePath of limited) {
    const parsed = parseMdFile(filePath);
    if (!parsed) continue;
    const { fm, body } = parsed;
    if (!isVaSourced(fm)) continue;

    let activity = null;
    if (retranslate) {
      const esSlug = esByKb[fm.id] ?? fm.id;
      try {
        activity = await fetchPageBySlug(resolveSlugAlias(esSlug));
        await sleep(DELAY_MS);
      } catch (e) {
        console.warn(`[editorial] skip fetch ${fm.id}: ${e.message}`);
      }
    }

    const result = await editorialEnhanceArticle({
      fm,
      body,
      activity,
      forceRetranslate: retranslate && Boolean(activity),
      cacheOnly: cacheOnly || !retranslate,
    });

    if (result.fm.related?.length) {
      /* keep */
    } else if (fm.region_id) {
      result.fm.related = result.fm.related ?? [];
    }

    writeMd(filePath, result.fm, result.body);
    updated++;
    if (result.promoted) promoted++;
    if (updated % 25 === 0) console.log(`[editorial] ${updated}/${limited.length}…`);
  }

  console.log(`[editorial] обновлено ${updated}, опубликовано ${promoted}`);
}

function restoreMediaFrontmatter() {
  const manifest = loadJson(manifestPath);
  const byKb = new Map();
  for (const asset of manifest.assets) {
    if (asset.source !== "argentina.travel") continue;
    const kbId = asset.kbArticleId ?? asset.id?.match(/^at-(.+?)-(hero|gallery)/)?.[1];
    if (!kbId) continue;
    if (!byKb.has(kbId)) byKb.set(kbId, { hero: null, gallery: [] });
    const entry = byKb.get(kbId);
    const img = {
      url: `/${asset.localPath.replace(/^\/+/, "")}`,
      alt: asset.alt,
      author: asset.author ?? "INPROTUR / Visit Argentina",
      license: "argentina.travel",
      source_page: asset.attributionPage ?? asset.sourceUrl,
    };
    if (asset.role === "hero") entry.hero = img;
    else entry.gallery.push(img);
  }

  let restored = 0;
  for (const filePath of listVaKbFiles()) {
    const parsed = parseMdFile(filePath);
    if (!parsed) continue;
    const pack = byKb.get(parsed.fm.id);
    if (!pack?.hero) continue;
    if (parsed.fm.media?.hero?.url?.includes("argentina-travel")) continue;
    parsed.fm.media = {
      hero: pack.hero,
      gallery: pack.gallery.slice(0, 6),
    };
    writeMd(filePath, parsed.fm, parsed.body);
    restored++;
  }
  console.log(`[restore-media] восстановлен media-блок в ${restored} статьях`);
}

function syncMediaManifest() {
  const manifest = loadJson(manifestPath);
  const placeToKb = loadPlaceToKb();
  const kbToPlace = buildKbToPlaceMap(placeToKb);
  const kbMeta = new Map();
  for (const filePath of listVaKbFiles()) {
    const parsed = parseMdFile(filePath);
    if (!parsed?.fm?.id) continue;
    kbMeta.set(parsed.fm.id, {
      title: parsed.fm.title ?? parsed.fm.id,
      regionId: parsed.fm.region_id,
    });
  }

  let updated = 0;

  for (const asset of manifest.assets) {
    if (asset.source !== "argentina.travel" && !asset.id?.startsWith("at-")) continue;

    const m = asset.id?.match(/^at-(.+?)-(hero|gallery)/);
    const kbId = asset.kbArticleId ?? (m ? m[1] : null);
    if (!kbId) continue;

    const meta = kbMeta.get(kbId);
    const placeId = kbToPlace[kbId] ?? kbId;
    const ruTitle = meta?.title;
    let changed = false;

    if (asset.kbArticleId !== kbId) {
      asset.kbArticleId = kbId;
      changed = true;
    }
    if (placeId && asset.placeId !== placeId) {
      asset.placeId = placeId;
      changed = true;
    } else if (!placeId && asset.placeId !== kbId) {
      asset.placeId = kbId;
      changed = true;
    }

    if (ruTitle && asset.alt !== ruTitle) {
      asset.alt = ruTitle;
      changed = true;
    }
    if (ruTitle && asset.title !== `${ruTitle} — ${asset.role}`) {
      asset.title = `${ruTitle} — ${asset.role}`;
      changed = true;
    }

    const destId = meta?.regionId ? REGION_DESTINATION[meta.regionId] : null;
    if (destId && asset.destinationId !== destId) {
      asset.destinationId = destId;
      changed = true;
    }

    if (!asset.tags?.includes("argentina-travel")) {
      asset.tags = [...new Set([...(asset.tags ?? []), kbId, "argentina-travel", asset.role].filter(Boolean))];
      changed = true;
    }

    if (changed) updated++;
  }

  if (!dryRun) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }
  console.log(`[media] обновлено ${updated} ассетов (всего VA: ${manifest.assets.filter((a) => a.source === "argentina.travel").length})`);
}

/** Привязать VA-hero к местам из PLACE_TO_KB_ID, если у места нет собственного hero. */
function backfillPlaceHeroesFromVa() {
  const manifest = loadJson(manifestPath);
  const placeToKb = loadPlaceToKb();
  let linked = 0;

  for (const [placeSlug, kbId] of Object.entries(placeToKb)) {
    const hasOwnHero = manifest.assets.some(
      (a) => a.placeId === placeSlug && a.role === "hero" && !a.id?.startsWith("at-")
    );
    if (hasOwnHero) continue;

    const vaHero = manifest.assets.find(
      (a) => a.kbArticleId === kbId && a.role === "hero" && a.source === "argentina.travel"
    );
    if (!vaHero) continue;

    if (vaHero.placeId !== placeSlug) {
      vaHero.placeId = placeSlug;
      linked++;
    }
  }

  if (!dryRun && linked) {
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
  }
  console.log(`[media] привязано VA-hero к ${linked} местам каталога`);
}

function expandPlaceMap() {
  const placeToKb = loadPlaceToKb();
  const placeSlugs = loadPlaceSlugs();
  const files = listVaKbFiles();
  let added = 0;

  for (const filePath of files) {
    const parsed = parseMdFile(filePath);
    if (!parsed) continue;
    const { fm } = parsed;
    const kbId = fm.id;
    if (!kbId) continue;

    const existingKb = Object.entries(placeToKb).find(([, v]) => v === kbId);
    if (existingKb) continue;

    const candidates = [
      kbId,
      normalizeSlug(fm.title_es ?? ""),
      normalizeSlug(fm.title_en ?? ""),
    ].filter(Boolean);

    for (const cand of candidates) {
      if (placeSlugs.has(cand) && !placeToKb[cand]) {
        placeToKb[cand] = kbId;
        added++;
        break;
      }
    }
  }

  const lines = [
    "// АВТОГЕНЕРАЦИЯ (scripts/integrate-argentina-travel.mjs) — карта «slug места ↔ id базы знаний».",
    "// База знаний — источник текста; место хранит кураторский слой (фото/enrichment/коллекции).",
    "export const PLACE_TO_KB_ID: Record<string, string> = {",
  ];
  for (const [place, kb] of Object.entries(placeToKb).sort(([a], [b]) => a.localeCompare(b))) {
    lines.push(`  "${place}": "${kb}",`);
  }
  lines.push("};", "", "export const KB_ID_TO_PLACE: Record<string, string> = Object.fromEntries(");
  lines.push("  Object.entries(PLACE_TO_KB_ID).map(([slug, id]) => [id, slug]),");
  lines.push(");", "");

  if (!dryRun) {
    fs.writeFileSync(placeMapOut, lines.join("\n"));
    fs.writeFileSync(
      siteIdMapOut,
      JSON.stringify(
        {
          generated: new Date().toISOString().slice(0, 10),
          note: "KB id <-> place slug bridge; KB is source of text, place keeps curated overlay",
          place_to_kb: placeToKb,
        },
        null,
        2
      ) + "\n"
    );
  }

  console.log(`[place-map] записей ${Object.keys(placeToKb).length} (+${added} новых)`);
  return placeToKb;
}

function generatePlacesImport(placeToKb) {
  const placeSlugs = loadPlaceSlugs();
  const kbToPlace = buildKbToPlaceMap(placeToKb);
  const files = listVaKbFiles();
  const imports = [];

  for (const filePath of files) {
    const parsed = parseMdFile(filePath);
    if (!parsed) continue;
    const { fm, body } = parsed;
    if (!fm.site_ready && fm.status !== "published") continue;
    if (!["city", "national_park"].includes(fm.type)) continue;
    if (!hasCyrillic(fm.title)) continue;
    if (!hasCyrillic(fm.summary ?? "")) continue;
    if (spanishRatio(fm.summary ?? "") > 0.08) continue;
    if (/[áéíóúñ¿¡]/i.test(fm.summary ?? "")) continue;

    const coords = parseCoordinates(fm);
    if (!coords) continue;

    let slug = kbToPlace[fm.id];
    if (slug && placeSlugs.has(slug)) continue;

    slug = slug ?? fm.id;
    if (placeSlugs.has(slug)) continue;

    const desc =
      body.match(/##\s+Описание\s*\n+([\s\S]*?)(?=\n##\s|$)/)?.[1]?.trim() ??
      fm.summary ??
      "";
    if (spanishRatio(desc) > 0.08) continue;
    if (/[áéíóúñ¿¡]/i.test(desc)) continue;
    if (!hasCyrillic(desc)) continue;

    imports.push({
      id: `place-kb-${slug}`,
      slug,
      name: fm.title,
      shortDescription: fm.summary ?? desc,
      fullDescription: desc || fm.summary || fm.title,
      category: KB_TYPE_TO_PLACE_CATEGORY[fm.type] ?? "historic",
      region: REGION_LABEL[fm.region_id] ?? "Аргентина",
      province: fm.province ?? undefined,
      latitude: coords.lat,
      longitude: coords.lng,
      tags: translateTags(fm.tags ?? []),
      source: "argentina-travel",
      popularity: fm.type === "city" ? 40 : fm.type === "national_park" ? 55 : 25,
      kbSlug: fm.id,
    });
    placeSlugs.add(slug);
  }

  const lines = [
    "// АВТОГЕНЕРАЦИЯ — места из базы знаний (Argentina.travel), без дублирования places-seed.",
    "import type { PlaceDetail } from \"@/types/place\";",
    "import { getPlaceCoverImage, getPlaceGallery } from \"@/lib/media-resolver\";",
    "",
    "type KbImportPlace = Omit<PlaceDetail, \"relatedPlaces\" | \"collections\" | \"itineraryReferences\">;",
    "",
    "function kbPlaceMedia(slug: string) {",
    "  return { coverImage: getPlaceCoverImage(slug), gallery: getPlaceGallery(slug) };",
    "}",
    "",
    "export const PLACES_KB_IMPORT: KbImportPlace[] = [",
  ];

  for (const p of imports.sort((a, b) => a.slug.localeCompare(b.slug))) {
    lines.push("  {");
    lines.push(`    id: ${JSON.stringify(p.id)},`);
    lines.push(`    slug: ${JSON.stringify(p.slug)},`);
    lines.push(`    name: ${JSON.stringify(p.name)},`);
    lines.push(`    shortDescription: ${JSON.stringify(p.shortDescription)},`);
    lines.push(`    fullDescription: ${JSON.stringify(p.fullDescription)},`);
    lines.push(`    category: ${JSON.stringify(p.category)},`);
    lines.push(`    region: ${JSON.stringify(p.region)},`);
    if (p.province) lines.push(`    province: ${JSON.stringify(p.province)},`);
    lines.push(`    latitude: ${p.latitude},`);
    lines.push(`    longitude: ${p.longitude},`);
    lines.push(`    ...kbPlaceMedia(${JSON.stringify(p.slug)}),`);
    lines.push(`    tags: ${JSON.stringify(p.tags)},`);
    lines.push(`    source: "argentina-travel",`);
    lines.push(`    popularity: ${p.popularity},`);
    lines.push(`    kbSlug: ${JSON.stringify(p.kbSlug)},`);
    lines.push("  },");
  }

  lines.push("];", "");

  if (!dryRun) {
    fs.writeFileSync(placesImportOut, lines.join("\n"));
  }
  console.log(`[places] сгенерировано ${imports.length} KB-мест → places-kb-import.generated.ts`);
}

function addRelatedLinks() {
  const byProvince = new Map();
  const byRegion = new Map();
  const fileData = [];

  for (const filePath of listVaKbFiles()) {
    const parsed = parseMdFile(filePath);
    if (!parsed) continue;
    fileData.push({ ...parsed, filePath });
    const { fm } = parsed;
    if (fm.province) {
      const arr = byProvince.get(fm.province) ?? [];
      arr.push(fm.id);
      byProvince.set(fm.province, arr);
    }
    if (fm.region_id) {
      const arr = byRegion.get(fm.region_id) ?? [];
      arr.push(fm.id);
      byRegion.set(fm.region_id, arr);
    }
  }

  let updated = 0;
  for (const { fm, body, filePath } of fileData) {
    if (fm.related?.length >= 2) continue;
    const pool = [
      ...(byProvince.get(fm.province) ?? []),
      ...(byRegion.get(fm.region_id) ?? []),
    ].filter((id) => id !== fm.id);
    const related = [...new Set([...(fm.related ?? []), ...pool.slice(0, 4)])].slice(0, 5);
    if (related.length < 2) continue;
    fm.related = related;
    writeMd(filePath, fm, body);
    updated++;
  }
  console.log(`[related] добавлены связи в ${updated} статьях`);
}

function rebuildKbIndex() {
  if (dryRun) return;
  execSync("python3 content/knowledge-base/_index/build_manifest.py", {
    cwd: root,
    stdio: "inherit",
  });
}

async function main() {
  if (
    !runEditorial &&
    !runSyncMedia &&
    !runExpandMap &&
    !runGeneratePlaces &&
    !runRestoreMedia &&
    !runRebuild
  ) {
    console.log(`Usage: node scripts/integrate-argentina-travel.mjs --all [--retranslate] [--limit=N] [--dry-run]`);
    process.exit(1);
  }

  let placeToKb = loadPlaceToKb();

  if (runEditorial) await runEditorialPass();
  if (runExpandMap) placeToKb = expandPlaceMap();
  if (runRestoreMedia) restoreMediaFrontmatter();
  if (runSyncMedia) {
    syncMediaManifest();
    backfillPlaceHeroesFromVa();
  }
  if (runGeneratePlaces) generatePlacesImport(placeToKb);
  if (runRelated) addRelatedLinks();
  if (runRebuild) rebuildKbIndex();

  console.log("[integrate] готово");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
