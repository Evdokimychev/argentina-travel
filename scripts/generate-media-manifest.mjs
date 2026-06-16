#!/usr/bin/env node
/**
 * One-time helper: fetch Wikipedia media-list and write manifest.json.
 * Run manually when curating new assets: node scripts/generate-media-manifest.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outPath = path.join(root, "src/data/media-library/manifest.json");

const USER_AGENT = "argentina-travel-media/1.0 (https://github.com/argentina-travel)";

/** @typedef {{ id: string; title: string; alt: string; caption: string; category: string; tags: string[]; source: string; sourceUrl: string; license: string; author: string; localPath: string; placeId?: string; destinationId?: string; blogCategory?: string }} MediaEntry */

const PLACE_WIKI = {
  "buenos-aires": "Buenos_Aires",
  ushuaia: "Ushuaia",
  "el-calafate": "El_Calafate",
  "el-chalten": "El_Chaltén",
  bariloche: "San_Carlos_de_Bariloche",
  mendoza: "Mendoza,_Argentina",
  "puerto-madryn": "Puerto_Madryn",
  salta: "Salta,_Argentina",
  purmamarca: "Purmamarca",
  "iguazu-falls": "Iguazu_Falls",
  "perito-moreno-glacier": "Perito_Moreno_Glacier",
  "fitz-roy": "Monte_Fitz_Roy",
  "los-glaciares-national-park": "Los_Glaciares_National_Park",
  "nahuel-huapi-national-park": "Nahuel_Huapi_National_Park",
  "valdes-peninsula": "Valdes_Peninsula",
  "cerro-de-los-7-colores": "Cerro_de_los_Siete_Colores",
  "tren-de-las-nubes": "Tren_a_las_Nubes",
  "cueva-de-las-manos": "Cueva_de_las_Manos",
  "mar-del-plata": "Mar_del_Plata",
  "tierra-del-fuego-national-park": "Tierra_del_Fuego_National_Park",
};

const PLACE_NAMES = {
  "buenos-aires": "Буэнос-Айрес",
  ushuaia: "Ушуайя",
  "el-calafate": "Эль-Калафате",
  "el-chalten": "Эль-Чалтен",
  bariloche: "Барилоче",
  mendoza: "Мендоса",
  "puerto-madryn": "Пуэрто-Мадрин",
  salta: "Сальта",
  purmamarca: "Пурмамарка",
  "iguazu-falls": "Водопады Игуасу",
  "perito-moreno-glacier": "Ледник Перито-Морено",
  "fitz-roy": "Фиц Roy",
  "los-glaciares-national-park": "Нацпарк Los Glaciares",
  "nahuel-huapi-national-park": "Нацпарк Nahuel Huapi",
  "valdes-peninsula": "Полуостров Вальдес",
  "cerro-de-los-7-colores": "Cerro de los Siete Colores",
  "tren-de-las-nubes": "Поезд в облака",
  "cueva-de-las-manos": "Cueva de las Manos",
  "mar-del-plata": "Мар-дель-Плата",
  "tierra-del-fuego-national-park": "Нацпарк Tierra del Fuego",
};

const DESTINATION_WIKI = {
  ba: "Buenos_Aires",
  bariloche: "San_Carlos_de_Bariloche",
  calafate: "El_Calafate",
  ushuaia: "Ushuaia",
  iguazu: "Iguazu_Falls",
  mendoza: "Mendoza,_Argentina",
  salta: "Salta,_Argentina",
  patagonia: "Patagonia",
};

const DESTINATION_NAMES = {
  ba: "Буэнос-Айрес",
  bariloche: "Барилоче",
  calafate: "Эль-Калафате",
  ushuaia: "Ушуайя",
  iguazu: "Игуасу",
  mendoza: "Мендоса",
  salta: "Сальта",
  patagonia: "Патагония",
};

const BLOG_WIKI = {
  travel: "Tourism_in_Argentina",
  "buenos-aires": "Buenos_Aires",
  patagonia: "Patagonian_Desert",
  north: "Quebrada_de_Humahuaca",
  iguazu: "Iguazu_Falls",
  "national-parks": "National_parks_of_Argentina",
  trekking: "Monte_Fitz_Roy",
  wineries: "Mendoza_wine",
  wildlife: "Valdes_Peninsula",
  food: "Argentine_cuisine",
  transport: "Buenos_Aires_Underground",
  safety: "Buenos_Aires",
  money: "Argentine_peso",
  internet: "Telecommunications_in_Argentina",
  "ba-neighborhoods": "Palermo,_Buenos_Aires",
  relocation: "Immigration_to_Argentina",
};

const BLOG_NAMES = {
  travel: "Путешествия по Аргентине",
  "buenos-aires": "Буэнос-Айрес",
  patagonia: "Патагония",
  north: "Север Аргентины",
  iguazu: "Водопады Игуасу",
  "national-parks": "Национальные парки",
  trekking: "Горы и треккинг",
  wineries: "Винодельни",
  wildlife: "Животные Аргентины",
  food: "Кухня Аргентины",
  transport: "Транспорт",
  safety: "Безопасность",
  money: "Деньги и обмен",
  internet: "Интернет и связь",
  "ba-neighborhoods": "Районы Буэнос-Айреса",
  relocation: "Переезд и релокация",
};

/** Fallback direct URLs when Wikipedia page has no images */
const FALLBACK_IMAGES = {
  "buenos-aires": [
    "https://upload.wikimedia.org/wikipedia/commons/b/b7/Obelisco_Buenos_Aires.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/dd/Caminito%2C_La_Boca.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/a/a5/Buenos_Aires_Obelisk_4.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/1e/Puerto_Madero%2C_Buenos_Aires_%2840689219792%29_%28cropped%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/f9/Torre_Monumental_%28Buenos_Aires%29_edit.jpg",
  ],
  mendoza: [
    "https://upload.wikimedia.org/wikipedia/commons/8/8a/Mendoza%2C_Argentina_-_panoramio.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/d/d0/Vineyards_in_Mendoza%2C_Argentina.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/1e/Aconcagua.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4e/Bodega_Salentein%2C_Uco_Valley%2C_Mendoza.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/9c/Plaza_Independencia%2C_Mendoza.jpg",
  ],
  "puerto-madryn": [
    "https://upload.wikimedia.org/wikipedia/commons/4/4d/Puerto_Madryn%2C_Argentina.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/e/e2/Southern_right_whale.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/1a/Punta_Tombo_penguins.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8f/Pen%C3%ADnsula_Vald%C3%A9s_-_panoramio.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3d/Orca_hunting_in_Pen%C3%ADnsula_Vald%C3%A9s.jpg",
  ],
  purmamarca: [
    "https://upload.wikimedia.org/wikipedia/commons/4/4c/Purmamarca%2C_Jujuy%2C_Argentina.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/8/8e/Cerro_de_los_Siete_Colores%2C_Purmamarca.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5a/Purmamarca_-_panoramio.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/f1/Cerro_de_los_7_colores.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/2d/Quebrada_de_Humahuaca%2C_Purmamarca.jpg",
  ],
  "cerro-de-los-7-colores": [
    "https://upload.wikimedia.org/wikipedia/commons/8/8e/Cerro_de_los_Siete_Colores%2C_Purmamarca.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/f/f1/Cerro_de_los_7_colores.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4c/Purmamarca%2C_Jujuy%2C_Argentina.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/2/2d/Quebrada_de_Humahuaca%2C_Purmamarca.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5a/Purmamarca_-_panoramio.jpg",
  ],
  "tren-de-las-nubes": [
    "https://upload.wikimedia.org/wikipedia/commons/6/6e/Tren_a_las_Nubes.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/9a/La_Polvorilla_viaduct.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/3/3e/Tren_de_las_Nubes_Salta.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/54/Panor%C3%A1mica_Ciudad_de_Salta.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/7/72/Iglesia_San_Francisco%2C_Salta%2C_Argentina_-_panoramio.jpg",
  ],
  "cueva-de-las-manos": [
    "https://upload.wikimedia.org/wikipedia/commons/5/5a/Cueva_de_las_Manos_-_Argentina.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/9/9c/Cueva_de_las_Manos_painting.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/4/4b/Cueva_de_las_Manos%2C_R%C3%ADo_Pinturas.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/1c/Cueva_de_las_Manos_stencil.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/c/c8/Perito_Moreno_Glacier_2023.jpg",
  ],
  food: [
    "https://upload.wikimedia.org/wikipedia/commons/4/45/Asado_argentino.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/6/6f/Empanadas_argentinas.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/1/1a/Mate_drink.jpg",
  ],
  money: [
    "https://upload.wikimedia.org/wikipedia/commons/1/1a/Argentine_peso_%28series_B%29.jpg",
    "https://upload.wikimedia.org/wikipedia/commons/5/5f/Banco_Central_de_la_Rep%C3%BAblica_Argentina.jpg",
  ],
};

function thumbToOriginal(url) {
  if (!url) return null;
  const full = url.startsWith("//") ? `https:${url}` : url;
  const thumbMatch = full.match(
    /\/wikipedia\/commons\/thumb\/([a-f0-9]\/[a-f0-9]{2})\/([^/]+)\/\d+px-[^/]+$/
  );
  if (thumbMatch) {
    return `https://upload.wikimedia.org/wikipedia/commons/${thumbMatch[1]}/${decodeURIComponent(thumbMatch[2])}`;
  }
  if (full.includes("/wikipedia/commons/") && !full.includes("/thumb/")) {
    return full;
  }
  return null;
}

function extFromUrl(url) {
  const base = url.split("?")[0];
  const ext = path.extname(decodeURIComponent(base)).slice(1).toLowerCase();
  return ext === "jpeg" ? "jpg" : ext || "jpg";
}

async function fetchWikiImages(pageTitle, limit = 8) {
  const api = `https://en.wikipedia.org/api/rest_v1/page/media-list/${encodeURIComponent(pageTitle)}`;
  const res = await fetch(api, { headers: { "User-Agent": USER_AGENT } });
  if (!res.ok) return [];
  const data = await res.json();
  const urls = [];
  for (const item of data.items ?? []) {
    const src = item.original?.source ?? item.srcset?.[item.srcset.length - 1]?.src;
    const original = thumbToOriginal(src);
    if (original && !urls.includes(original)) urls.push(original);
    if (urls.length >= limit) break;
  }
  return urls;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function makeEntry(partial) {
  return {
    source: "wikimedia",
    license: "CC BY-SA / CC BY (Wikimedia Commons)",
    author: "Wikimedia Commons contributors",
    ...partial,
  };
}

/** @returns {MediaEntry[]} */
async function buildManifest() {
  /** @type {MediaEntry[]} */
  const entries = [];

  for (const [slug, wikiPage] of Object.entries(PLACE_WIKI)) {
    let urls = await fetchWikiImages(wikiPage, 6);
    if (urls.length < 5 && FALLBACK_IMAGES[slug]) {
      urls = [...new Set([...FALLBACK_IMAGES[slug], ...urls])];
    }
    while (urls.length < 5) {
      await sleep(1500);
      const extra = await fetchWikiImages(wikiPage, 10);
      urls = [...new Set([...urls, ...extra])];
      if (extra.length === 0) break;
    }
    urls = urls.slice(0, 5);
    const name = PLACE_NAMES[slug];

    const roles = ["hero", "gallery-1", "gallery-2", "gallery-3", "gallery-4"];
    urls.forEach((sourceUrl, i) => {
      const role = roles[i];
      const ext = extFromUrl(sourceUrl);
      entries.push(
        makeEntry({
          id: `place-${slug}-${role}`,
          title: `${name} — ${role === "hero" ? "обложка" : `фото ${i}`}`,
          alt: role === "hero" ? `${name}, Аргентина` : `${name} — вид ${i}`,
          caption: `${name}, Wikimedia Commons`,
          category: "place",
          tags: [role === "hero" ? "hero" : "gallery", slug],
          sourceUrl,
          localPath: `places/${slug}/${role}.${ext}`,
          placeId: slug,
        })
      );
    });
    await sleep(1200);
  }

  for (const [destId, wikiPage] of Object.entries(DESTINATION_WIKI)) {
    let urls = await fetchWikiImages(wikiPage, 5);
    if (urls.length < 4 && FALLBACK_IMAGES[destId]) {
      urls = [...new Set([...FALLBACK_IMAGES[destId], ...urls])];
    }
    urls = urls.slice(0, 4);
    const name = DESTINATION_NAMES[destId];

    const roles = ["cover", "gallery-1", "gallery-2", "gallery-3"];
    urls.forEach((sourceUrl, i) => {
      const role = roles[i] ?? `gallery-${i}`;
      const ext = extFromUrl(sourceUrl);
      entries.push(
        makeEntry({
          id: `dest-${destId}-${role}`,
          title: `${name} — ${role}`,
          alt: `${name}, популярное направление`,
          caption: name,
          category: "destination",
          tags: [role === "cover" ? "cover" : "gallery", destId],
          sourceUrl,
          localPath: `destinations/${destId}/${role}.${ext}`,
          destinationId: destId,
        })
      );
    });
    await sleep(1200);
  }

  for (const [catKey, wikiPage] of Object.entries(BLOG_WIKI)) {
    let urls = await fetchWikiImages(wikiPage, 2);
    if (urls.length === 0 && FALLBACK_IMAGES[catKey]) {
      urls = FALLBACK_IMAGES[catKey];
    }
    const sourceUrl = urls[0] ?? FALLBACK_IMAGES.travel?.[0];
    if (!sourceUrl) continue;
    const ext = extFromUrl(sourceUrl);
    const name = BLOG_NAMES[catKey];
    entries.push(
      makeEntry({
        id: `blog-${catKey}`,
        title: name,
        alt: `${name} — тематическая иллюстрация`,
        caption: name,
        category: "blog",
        tags: ["category", catKey],
        sourceUrl,
        localPath: `blog/${catKey}.${ext}`,
        blogCategory: catKey,
      })
    );
    await sleep(1200);
  }

  return entries;
}

const entries = await buildManifest();
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ version: 1, assets: entries }, null, 2) + "\n", "utf8");
console.log(`Wrote ${entries.length} assets to ${outPath}`);
