#!/usr/bin/env node
/**
 * Ревизия фотографий раздела «Регионы и места»:
 * 1. Убирает дубликаты: каждое фото остаётся только у «своего» места
 *    (раньше фото Сальты лежало в галерее Мендосы, Ушуайя — у Эль-Чальтена и т.п.)
 * 2. Скачивает собственные hero-фото с Wikimedia Commons для мест без фотографий
 *    по курируемым запросам (точное название места, а не общий регион).
 *
 * Запуск: node scripts/fetch-place-media.mjs [--dry-run]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { searchWikimedia } from "./wikimedia-client.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "src/data/media-library/manifest.json");
const publicRoot = path.join(root, "public");
const dryRun = process.argv.includes("--dry-run");

const USER_AGENT = "argentina-travel-media-sync/1.0 (https://www.goargentina.ru)";
const DELAY_MS = 1200;

/**
 * Владелец каждого файла-дубликата: фото остаётся у этого placeId,
 * у остальных мест удаляется из манифеста.
 * Ключ — фрагмент sourceUrl (имя файла), значение — правильный placeId.
 */
const DUPLICATE_OWNERS = {
  "Caminito%2C_La_Boca.jpg": "buenos-aires",
  "Ushuaia_aerial_panorama.jpg": "ushuaia",
  "Aerial_view_of_Ushuaia_Prison": "ushuaia",
  "Parque_Nacional_Tierra_del_Fuego": "tierra-del-fuego-national-park",
  "El_Calafate_%2825825005237%29.jpg": "el-calafate",
  "Perito_Moreno_Glacier_2023.jpg": "perito-moreno-glacier",
  "SantaCruz-PeritoMoreno-P2140146b.jpg": "perito-moreno-glacier",
  "Fitz_Roy%2C_Patagonia%2C_Argentina.jpg": "fitz-roy",
  "El_Chalt%C3%A9n.jpg": "el-chalten",
  "Vista_a%C3%A9rea_de_Bariloche": "bariloche",
  "San_Carlos_de_Bariloche.jpg": "bariloche",
  "Catedral_desde_el_Lago_Nahuel_Huapi": "nahuel-huapi-national-park",
  "Bariloche_01.jpg": "bariloche",
  "Bariloche-_Argentina.jpg": "bariloche",
  "Panor%C3%A1mica_Ciudad_de_Salta.jpg": "salta",
  "Salta-Square1.jpg": "salta",
  "Vista_de_Puerto_Madryn": "puerto-madryn",
  "Southern_right_whale.jpg": "valdes-peninsula",
  "Peninsula_Vald%C3%A9s_STS-68.jpg": "valdes-peninsula",
  "Ballenafranca%2Balvina.jpg": "puerto-madryn",
  "Salta_Cathedral.jpg": "salta",
  "Iglesia_San_Francisco%2C_Salta": "salta",
  "Cerro_de_los_siete_colores.jpg": "cerro-de-los-7-colores",
  "Jujuy-Purmamarca-P3120100.JPG": "purmamarca",
  "Cerro_de_los_7_colores.jpg": "cerro-de-los-7-colores",
  "Glaciar_Perito_Moreno%2C_Bismarck": "perito-moreno-glacier",
  "153_-_Glacier_Perito_Moreno": "perito-moreno-glacier",
};

/**
 * Курируемые Commons-запросы: точное место, не регион.
 * needsHero — у места нет собственного hero после дедупликации.
 */
const HERO_TARGETS = [
  // Места, до сих пор заимствовавшие чужие обложки
  { slug: "maipu", name: "Майпу", query: "Maipú Mendoza Argentina" },
  { slug: "lujan-de-cuyo", name: "Лухан-де-Куйо", query: "Luján de Cuyo Mendoza vineyard" },
  { slug: "uco-valley", name: "Долина Уко", query: "Valle de Uco Mendoza vineyard Andes" },
  { slug: "potrerillos", name: "Потрерильос", query: "Potrerillos Mendoza embalse dique" },
  { slug: "aconcagua", name: "Аконкагуа", query: "Aconcagua mountain south face" },
  { slug: "cafayate", name: "Кафаяте", query: "Cafayate Argentina" },
  { slug: "tilcara", name: "Тилькара", query: "Pucará de Tilcara Jujuy" },
  { slug: "quebrada-de-humahuaca", name: "Ущелье Умауака", query: "Quebrada de Humahuaca Jujuy landscape" },
  { slug: "salinas-grandes", name: "Салинас-Грандес", query: "Salinas Grandes Jujuy salt flat" },
  { slug: "talampaya", name: "Талампая", query: "Talampaya Argentina" },
  { slug: "san-martin-de-los-andes", name: "Сан-Мартин-де-лос-Андес", query: "San Martín de los Andes lago Lácar" },
  { slug: "villa-la-angostura", name: "Вилья-Ла-Ангостура", query: "Villa La Angostura Neuquén" },
  { slug: "estero-ibera", name: "Эстерос-дель-Ибера", query: "Esteros del Iberá wetlands Corrientes" },
  { slug: "corrientes", name: "Корриентес", query: "Corrientes city Argentina costanera" },
  { slug: "posadas", name: "Посадас", query: "Costanera Posadas Misiones río Paraná" },
  { slug: "cordoba", name: "Кордова", query: "Córdoba Argentina city cathedral plaza" },
  { slug: "rosario", name: "Росарио", query: "Rosario Santa Fe Argentina" },
  { slug: "la-plata", name: "Ла-Плата", query: "Catedral de La Plata Argentina" },
  { slug: "bahia-blanca", name: "Баия-Бланка", query: "Bahía Blanca Argentina" },
  { slug: "tucuman", name: "Тукуман", query: "San Miguel de Tucumán Casa Histórica" },
  { slug: "san-salvador-de-jujuy", name: "Сан-Сальвадор-де-Жужуй", query: "Catedral San Salvador de Jujuy" },
  { slug: "neuquen", name: "Неукен", query: "Neuquén Argentina ciudad" },
  { slug: "san-juan", name: "Сан-Хуан", query: "San Juan Argentina city center" },
  { slug: "rio-gallegos", name: "Рио-Гальегос", query: "Río Gallegos Santa Cruz Argentina" },
  { slug: "trelew", name: "Трелью", query: "Trelew Chubut Argentina" },
  { slug: "esquel", name: "Эскель", query: "Esquel Chubut La Trochita" },
  { slug: "ischigualasto", name: "Исчигуаласто", query: "Ischigualasto Valle de la Luna San Juan" },
  { slug: "los-alerces-national-park", name: "Нацпарк Лос-Алерсес", query: "Parque Nacional Los Alerces Chubut lago Futalaufquen" },
  { slug: "quebrada-de-las-conchas", name: "Ущелье Лас-Кончас", query: "Quebrada de las Conchas Cafayate" },
  { slug: "puente-del-inca", name: "Пуэнте-дель-Инка", query: "Puente del Inca Mendoza" },
  // Места, потерявшие hero после дедупликации (фото было чужим)
  { slug: "purmamarca", name: "Пурмамарка", query: "Purmamarca village Jujuy street" },
  { slug: "el-chalten", name: "Эль-Чальтен", query: "El Chaltén village Santa Cruz Argentina" },
  { slug: "el-calafate", name: "Эль-Калафате", query: "El Calafate town Santa Cruz Argentina" },
  { slug: "los-glaciares-national-park", name: "Нацпарк Лос-Гласьярес", query: "Parque Nacional Los Glaciares lago Argentino glacier" },
  { slug: "ushuaia", name: "Ушуайя", query: "Ushuaia city port Beagle channel" },
];

function loadManifest() {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}

function saveManifest(manifest) {
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
}

function urlKey(sourceUrl) {
  for (const fragment of Object.keys(DUPLICATE_OWNERS)) {
    if (sourceUrl.includes(fragment)) return fragment;
  }
  return null;
}

/** Шаг 1: удаляем дубликаты из манифеста. */
function dedupeManifest(manifest) {
  const removed = [];
  manifest.assets = manifest.assets.filter((asset) => {
    if (!asset.placeId || !asset.sourceUrl) return true;
    const fragment = urlKey(asset.sourceUrl);
    if (!fragment) return true;
    const owner = DUPLICATE_OWNERS[fragment];
    if (asset.placeId === owner) return true;
    removed.push(`${asset.placeId}/${asset.role} (принадлежит ${owner})`);
    return false;
  });

  // Внутренние дубли одного места (одинаковый sourceUrl дважды)
  const seen = new Set();
  manifest.assets = manifest.assets.filter((asset) => {
    if (!asset.placeId || !asset.sourceUrl) return true;
    const key = `${asset.placeId}::${asset.sourceUrl}`;
    if (seen.has(key)) {
      removed.push(`${asset.placeId}/${asset.role} (дубль внутри места)`);
      return false;
    }
    seen.add(key);
    return true;
  });

  return removed;
}

/** Место лишилось hero — повышаем первое галерейное фото. */
function promoteGalleryHeroes(manifest) {
  const promoted = [];
  const byPlace = new Map();
  for (const asset of manifest.assets) {
    if (!asset.placeId) continue;
    if (!byPlace.has(asset.placeId)) byPlace.set(asset.placeId, []);
    byPlace.get(asset.placeId).push(asset);
  }
  for (const [placeId, assets] of byPlace) {
    if (assets.some((a) => a.role === "hero")) continue;
    const candidate = assets.find((a) => a.role === "gallery");
    if (candidate) {
      candidate.role = "hero";
      promoted.push(placeId);
    }
  }
  return promoted;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function downloadTo(url, destAbs) {
  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT }, redirect: "follow" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length < 10_000) throw new Error(`file too small (${buffer.length}b)`);
  fs.mkdirSync(path.dirname(destAbs), { recursive: true });
  fs.writeFileSync(destAbs, buffer);
  return buffer.length;
}

async function fetchHero(manifest, target, usedUrls) {
  const hasOwnHero = manifest.assets.some(
    (a) => a.placeId === target.slug && a.role === "hero"
  );
  if (hasOwnHero) return { slug: target.slug, status: "skip (hero exists)" };

  const results = await searchWikimedia(target.query, 10);
  const pick = results.find(
    (r) =>
      !usedUrls.has(r.downloadUrl) &&
      !/\.(svg|gif|tif|tiff|pdf)$/i.test(r.photoId) &&
      !/map|logo|escudo|coat|flag|bandera|diagram|locator/i.test(r.photoId)
  );
  if (!pick) return { slug: target.slug, status: "NOT FOUND" };

  const localPath = `media/places/${target.slug}/hero.jpg`;
  if (!dryRun) {
    const size = await downloadTo(pick.downloadUrl, path.join(publicRoot, localPath));
    manifest.assets.push({
      id: `place-${target.slug}-hero`,
      title: `${target.name} — обложка`,
      alt: `${target.name}, Аргентина`,
      caption: `${target.name}, Wikimedia Commons`,
      category: "attraction",
      tags: [target.slug, "hero"],
      source: "wikimedia",
      sourceUrl: pick.sourceUrl,
      license: pick.license || "CC BY-SA (Wikimedia Commons)",
      author: pick.author || "Wikimedia Commons contributors",
      localPath,
      placeId: target.slug,
      role: "hero",
    });
    usedUrls.add(pick.downloadUrl);
    await sleep(DELAY_MS);
    return { slug: target.slug, status: `OK ${Math.round(size / 1024)}kb — ${pick.photoId}` };
  }
  return { slug: target.slug, status: `would fetch: ${pick.photoId}` };
}

const manifest = loadManifest();

console.log("=== Шаг 1. Дедупликация ===");
const removed = dedupeManifest(manifest);
for (const r of removed) console.log("  −", r);
console.log(`Удалено дублей: ${removed.length}`);

const promoted = promoteGalleryHeroes(manifest);
if (promoted.length) console.log("Повышены до hero из галереи:", promoted.join(", "));

console.log("\n=== Шаг 2. Загрузка собственных hero ===");
const usedUrls = new Set(
  manifest.assets.filter((a) => a.sourceUrl).map((a) => a.sourceUrl)
);
const failures = [];
for (const target of HERO_TARGETS) {
  try {
    const result = await fetchHero(manifest, target, usedUrls);
    console.log(`  ${result.status.startsWith("OK") ? "✓" : "·"} ${result.slug}: ${result.status}`);
    if (result.status === "NOT FOUND") failures.push(target.slug);
  } catch (err) {
    console.log(`  ✗ ${target.slug}: ${err.message}`);
    failures.push(target.slug);
  }
}

if (!dryRun) {
  manifest.version = (manifest.version ?? 1) + 1;
  saveManifest(manifest);
  console.log(`\nManifest сохранён (version ${manifest.version}).`);
}
if (failures.length) {
  console.log(`\nБез фото остались (нужен fallback): ${failures.join(", ")}`);
}
