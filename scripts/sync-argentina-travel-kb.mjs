#!/usr/bin/env node
/**
 * Парсинг Argentina.travel → база знаний (RU) + фото с атрибуцией.
 *
 * Источник: https://www.argentina.travel (INPROTUR, официальный туристический портал).
 * Фото: CDN api-inprotur-hom.turismo.gob.ar — не свободная лицензия CC;
 *       на сайте обязательна атрибуция (license: argentina.travel, source_page).
 *
 * Запуск:
 *   node scripts/sync-argentina-travel-kb.mjs --audit
 *   node scripts/sync-argentina-travel-kb.mjs --dry-run --limit=3
 *   node scripts/sync-argentina-travel-kb.mjs --slug=parque-provincial-aconcagua --download-media
 *   node scripts/sync-argentina-travel-kb.mjs --province=mendoza
 *   node scripts/sync-argentina-travel-kb.mjs --all-provinces --download-media --rebuild-kb-index
 *
 * После записи статей:
 *   python3 content/knowledge-base/_index/build_manifest.py
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import {
  auditCoverage,
  discoverAllActivitySlugs,
  fetchPageBySlug,
  fetchProvinceActivitySlugs,
  sleep,
  DELAY_MS,
} from "./lib/argentina-travel-client.mjs";
import {
  translateActivity,
  buildRussianBody,
} from "./lib/argentina-travel-translate.mjs";
import {
  findExistingKbFile,
  inferKbType,
  mergeKbArticle,
  slugToKbId,
} from "./lib/argentina-travel-kb.mjs";
import {
  buildKbToPlaceMap,
  downloadActivityImages,
  resolvePlaceIdForKb,
} from "./lib/argentina-travel-media.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const downloadMedia = args.includes("--download-media");
const rebuildIndex = args.includes("--rebuild-kb-index");
const allProvinces = args.includes("--all-provinces");
const auditMode = args.includes("--audit");
const slugArg = args.find((a) => a.startsWith("--slug="))?.split("=")[1];
const provinceArg = args.find((a) => a.startsWith("--province="))?.split("=")[1];
const limitArg = Number(args.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "0");

const provinceDefs = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data/argentina-travel-province-slugs.json"), "utf8")
);
const kbMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data/argentina-travel-kb-map.json"), "utf8")
);

function provincePathsForId(id) {
  const def = provinceDefs.find((p) => p.id === id);
  return def?.paths ?? [id];
}

async function loadPlaceToKb() {
  const mapPath = path.join(root, "src/data/kb-place-id-map.ts");
  const text = fs.readFileSync(mapPath, "utf8");
  const out = {};
  for (const m of text.matchAll(/"([^"]+)":\s*"([^"]+)"/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

function resolveKbId(activity, manualMap) {
  if (manualMap[activity.slugEs]) return manualMap[activity.slugEs];
  const fromEs = slugToKbId(activity.slugEs);
  if (findExistingKbFile(fromEs)) return fromEs;
  const fromEn = slugToKbId(activity.slugEn);
  if (findExistingKbFile(fromEn)) return fromEn;
  return fromEs;
}

async function processPage(slugEs, ctx) {
  const { manualMap, kbToPlace, stats, failures } = ctx;
  console.log(`\n→ ${slugEs}`);

  let page;
  try {
    page = await fetchPageBySlug(slugEs);
  } catch (err) {
    console.warn(`  ✗ fetch: ${err.message}`);
    stats.failed++;
    failures.push({ slug: slugEs, error: err.message });
    return;
  }

  console.log(`  type: ${page.pageType}, фото: ${page.imageCount}`);

  const kbId = resolveKbId(page, manualMap);
  const type = inferKbType(page);
  const existingPath = findExistingKbFile(kbId);

  console.log(`  kb: ${kbId} (${type})${existingPath ? " [exists]" : " [new]"}`);

  const translation = await translateActivity(page);
  translation.bodyMarkdown = buildRussianBody(translation, page);

  let images = page.images;
  stats.totalImages += page.imageCount;

  if (downloadMedia) {
    const placeId = resolvePlaceIdForKb(kbId, kbToPlace);
    images = await downloadActivityImages(page, { placeId, kbId, dryRun });
    const downloaded = images.filter((i) => i.localUrl && !i.failed).length;
    stats.mediaFiles += downloaded;
    console.log(`  media: ${downloaded}/${page.imageCount} файлов → manifest`);
  } else {
    images = images.map((img, i) => ({
      ...img,
      role: i === 0 ? "hero" : "gallery",
      alt: page.titleEs,
    }));
  }

  const result = mergeKbArticle({
    kbId,
    type,
    translation,
    activity: page,
    images,
    existingPath,
    dryRun,
  });

  if (result.created) stats.created++;
  else stats.updated++;
  if (result.enrichedMedia) stats.mediaArticles++;

  if (!manualMap[page.slugEs] && !dryRun) {
    manualMap[page.slugEs] = kbId;
  }

  console.log(
    `  ✓ ${dryRun ? "[dry-run] " : ""}${result.path}${result.skippedBody ? " (тело сохранено)" : ""}`
  );
  await sleep(DELAY_MS);
}

async function runAudit() {
  console.log("Аудит покрытия Argentina.travel (может занять несколько минут)…\n");
  const report = await auditCoverage(provinceDefs);
  console.log("--- Аудит ---");
  console.log(`Найдено slug (все провинции): ${report.discovered}`);
  console.log(`Успешно распарсено: ${report.fetchOk}`);
  console.log(`Ошибок парсинга: ${report.fetchFail}`);
  console.log(`Всего фото (только внутри статей, без related): ${report.totalImages}`);
  console.log(`Среднее фото на страницу: ${report.avgImagesPerPage}`);

  if (report.failures.length) {
    console.log("\nОшибки:");
    for (const f of report.failures.slice(0, 20)) {
      console.log(`  - ${f.es}: ${f.error}`);
    }
    if (report.failures.length > 20) {
      console.log(`  … и ещё ${report.failures.length - 20}`);
    }
  }

  const auditPath = path.join(__dirname, "data/argentina-travel-audit.json");
  fs.writeFileSync(auditPath, JSON.stringify(report, null, 2) + "\n");
  console.log(`\nОтчёт: ${auditPath}`);
}

async function main() {
  if (auditMode) {
    await runAudit();
    return;
  }

  const placeToKb = await loadPlaceToKb();
  const kbToPlace = buildKbToPlaceMap(placeToKb);
  const manualMap = { ...kbMap };
  delete manualMap._comment;

  const stats = {
    created: 0,
    updated: 0,
    mediaArticles: 0,
    mediaFiles: 0,
    skippedBody: 0,
    failed: 0,
    totalImages: 0,
  };
  const failures = [];
  const ctx = { manualMap, kbToPlace, stats, failures };

  let slugs = [];

  if (slugArg) {
    slugs = [{ es: slugArg }];
  } else if (provinceArg) {
    const paths = provincePathsForId(provinceArg);
    slugs = [];
    for (const p of paths) {
      const found = await fetchProvinceActivitySlugs(p);
      console.log(`  ${p}: ${found.length} страниц`);
      slugs.push(...found);
    }
    const unique = new Map(slugs.map((s) => [s.es, s]));
    slugs = [...unique.values()];
    console.log(`Провинция ${provinceArg}: ${slugs.length} уникальных страниц`);
  } else if (allProvinces) {
    console.log(`Обход ${provinceDefs.length} провинций…`);
    slugs = await discoverAllActivitySlugs(provinceDefs);
    console.log(`Найдено уникальных страниц: ${slugs.length}`);
  } else {
    console.log(`Использование:
  --audit                    полный отчёт покрытия (без записи)
  --slug=parque-provincial-aconcagua
  --province=mendoza         id из province-slugs.json
  --all-provinces [--limit=N] [--download-media] [--dry-run] [--rebuild-kb-index]`);
    process.exit(0);
  }

  if (limitArg > 0) slugs = slugs.slice(0, limitArg);

  for (const s of slugs) {
    await processPage(typeof s === "string" ? s : s.es, ctx);
  }

  if (!dryRun && !slugArg && failures.length) {
    const failPath = path.join(__dirname, "data/argentina-travel-failures.json");
    fs.writeFileSync(failPath, JSON.stringify(failures, null, 2) + "\n");
    console.log(`\nОшибки сохранены: ${failPath}`);
  }

  if (!dryRun && !slugArg) {
    const mapPath = path.join(__dirname, "data/argentina-travel-kb-map.json");
    fs.writeFileSync(
      mapPath,
      JSON.stringify({ _comment: kbMap._comment, ...manualMap }, null, 2) + "\n"
    );
    console.log(`\nКарта slug→kb обновлена: ${mapPath}`);
  }

  if (rebuildIndex && !dryRun) {
    console.log("\nСборка manifest KB…");
    execSync("python3 content/knowledge-base/_index/build_manifest.py", {
      cwd: root,
      stdio: "inherit",
    });
  }

  console.log("\n--- Итог ---");
  console.log(`Создано: ${stats.created}, обновлено: ${stats.updated}`);
  console.log(
    `Фото в статьях: ${stats.totalImages} (${stats.mediaFiles} скачано в manifest при --download-media)`
  );
  console.log(`Статей с media-блоком: ${stats.mediaArticles}, ошибок: ${stats.failed}`);
  if (dryRun) console.log("(dry-run — файлы не записаны)");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
