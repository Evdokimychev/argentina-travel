#!/usr/bin/env node
/** Resolve Wikimedia Commons thumb URLs via API */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

async function resolveThumb(fileTitle, width = 1280) {
  const params = new URLSearchParams({
    action: "query",
    titles: `File:${fileTitle}`,
    prop: "imageinfo",
    iiprop: "url|extmetadata",
    iiurlwidth: String(width),
    format: "json",
  });
  const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params}`, {
    headers: { "User-Agent": "argentina-travel-media-sync/1.0" },
  });
  const data = await res.json();
  const pages = data.query?.pages ?? {};
  const page = Object.values(pages)[0];
  if (!page?.imageinfo?.[0]) return null;
  const info = page.imageinfo[0];
  const meta = info.extmetadata ?? {};
  return {
    sourceUrl: info.thumburl ?? info.url,
    license: meta.LicenseShortName?.value ?? "See Wikimedia Commons",
    author: meta.Artist?.value?.replace(/<[^>]+>/g, "").trim(),
  };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Verified Commons file titles for Argentina */
const FILES = {
  "buenos-aires": {
    hero: "Obelisco Buenos Aires.jpg",
    gallery: [
      "Caminito, Buenos Aires.jpg",
      "Casa Rosada, Buenos Aires.jpg",
      "Recoleta Cemetery - Buenos Aires - Argentina.jpg",
      "Teatro Colón, Buenos Aires, Argentina.jpg",
    ],
  },
  ushuaia: {
    hero: "Ushuaia - Canal Beagle.jpg",
    gallery: [
      "Ushuaia harbour.jpg",
      "Ushuaia - Fin del Mundo.jpg",
      "Glaciar Martial, Ushuaia.jpg",
      "Tierra del Fuego National Park - Patagonia - Argentina.jpg",
    ],
  },
  "el-calafate": {
    hero: "Perito Moreno Glacier Patagonia Argentina Luca Galuzzi 2005.jpg",
    gallery: [
      "Perito Moreno Glacier Patagonia Argentina Luca Galuzzi 2005.jpg",
      "El Calafate, Argentina.jpg",
      "Iceberg in Lago Argentino.jpg",
      "Perito Moreno Glacier Patagonia Argentina Luca Galuzzi 2005.jpg",
    ],
  },
  "el-chalten": {
    hero: "Fitz Roy sunrise.jpg",
    gallery: [
      "Fitz Roy sunrise.jpg",
      "Laguna de los Tres, El Chalten.jpg",
      "Cerro Torre, Patagonia.jpg",
      "Fitz Roy sunrise.jpg",
    ],
  },
  bariloche: {
    hero: "Nahuel Huapi Lake, Bariloche, Argentina.jpg",
    gallery: [
      "Nahuel Huapi Lake, Bariloche, Argentina.jpg",
      "Cerro Catedral Bariloche.jpg",
      "San Carlos de Bariloche center.jpg",
      "Nahuel Huapi Lake, Bariloche, Argentina.jpg",
    ],
  },
  mendoza: {
    hero: "Vineyards in Mendoza, Argentina.jpg",
    gallery: [
      "Vineyards in Mendoza, Argentina.jpg",
      "Aconcagua from Punta de Vacas.jpg",
      "Plaza Independencia Mendoza.jpg",
      "Vineyards in Mendoza, Argentina.jpg",
    ],
  },
  "puerto-madryn": {
    hero: "Southern right whale.jpg",
    gallery: [
      "Southern right whale.jpg",
      "Magellanic penguin (Spheniscus magellanicus).jpg",
      "Southern Elephant Seal (Mirounga leonina).jpg",
      "Southern right whale.jpg",
    ],
  },
  salta: {
    hero: "Quebrada de Humahuaca.jpg",
    gallery: [
      "Quebrada de Humahuaca.jpg",
      "Cerro de los Siete Colores, Purmamarca.jpg",
      "La Polvorilla viaduct.jpg",
      "Quebrada de Humahuaca.jpg",
    ],
  },
  purmamarca: {
    hero: "Cerro de los Siete Colores, Purmamarca.jpg",
    gallery: [
      "Cerro de los Siete Colores, Purmamarca.jpg",
      "Quebrada de Humahuaca.jpg",
      "Cerro de los Siete Colores, Purmamarca.jpg",
      "Quebrada de Humahuaca.jpg",
    ],
  },
  "iguazu-falls": {
    hero: "Iguazu falls.jpg",
    gallery: [
      "Iguazu falls.jpg",
      "Iguazu Cataratas2.jpg",
      "Iguazu falls.jpg",
      "Iguazu Cataratas2.jpg",
    ],
  },
  "perito-moreno-glacier": {
    hero: "Perito Moreno Glacier Patagonia Argentina Luca Galuzzi 2005.jpg",
    gallery: [
      "Perito Moreno Glacier Patagonia Argentina Luca Galuzzi 2005.jpg",
      "Perito Moreno Glacier Patagonia Argentina Luca Galuzzi 2005.jpg",
      "Perito Moreno Glacier Patagonia Argentina Luca Galuzzi 2005.jpg",
      "Perito Moreno Glacier Patagonia Argentina Luca Galuzzi 2005.jpg",
    ],
  },
  "fitz-roy": {
    hero: "Fitz Roy sunrise.jpg",
    gallery: [
      "Fitz Roy sunrise.jpg",
      "Laguna de los Tres, El Chalten.jpg",
      "Cerro Torre, Patagonia.jpg",
      "Fitz Roy sunrise.jpg",
    ],
  },
  "los-glaciares-national-park": {
    hero: "Perito Moreno Glacier Patagonia Argentina Luca Galuzzi 2005.jpg",
    gallery: [
      "Perito Moreno Glacier Patagonia Argentina Luca Galuzzi 2005.jpg",
      "Upsala Glacier.jpg",
      "Viedma Glacier.jpg",
      "Perito Moreno Glacier Patagonia Argentina Luca Galuzzi 2005.jpg",
    ],
  },
  "nahuel-huapi-national-park": {
    hero: "Nahuel Huapi Lake, Bariloche, Argentina.jpg",
    gallery: [
      "Nahuel Huapi Lake, Bariloche, Argentina.jpg",
      "Cerro Tronador.jpg",
      "Nahuel Huapi Lake, Bariloche, Argentina.jpg",
      "Cerro Catedral Bariloche.jpg",
    ],
  },
  "valdes-peninsula": {
    hero: "Southern right whale.jpg",
    gallery: [
      "Southern right whale.jpg",
      "Magellanic penguin (Spheniscus magellanicus).jpg",
      "Southern Elephant Seal (Mirounga leonina).jpg",
      "Southern right whale.jpg",
    ],
  },
  "cerro-de-los-7-colores": {
    hero: "Cerro de los Siete Colores, Purmamarca.jpg",
    gallery: [
      "Cerro de los Siete Colores, Purmamarca.jpg",
      "Quebrada de Humahuaca.jpg",
      "Cerro de los Siete Colores, Purmamarca.jpg",
      "Quebrada de Humahuaca.jpg",
    ],
  },
  "tren-de-las-nubes": {
    hero: "La Polvorilla viaduct.jpg",
    gallery: [
      "La Polvorilla viaduct.jpg",
      "Quebrada de Humahuaca.jpg",
      "La Polvorilla viaduct.jpg",
      "Quebrada de Humahuaca.jpg",
    ],
  },
  "cueva-de-las-manos": {
    hero: "Cueva de las Manos, Santa Cruz, Argentina.jpg",
    gallery: [
      "Cueva de las Manos, Santa Cruz, Argentina.jpg",
      "Cueva de las Manos - Río Pinturas.jpg",
      "Cueva de las Manos, Santa Cruz, Argentina.jpg",
      "Cueva de las Manos - Río Pinturas.jpg",
    ],
  },
  "mar-del-plata": {
    hero: "Mar del Plata - panorámica.jpg",
    gallery: [
      "Mar del Plata - panorámica.jpg",
      "Mar del Plata beach.jpg",
      "Mar del Plata - panorámica.jpg",
      "Mar del Plata beach.jpg",
    ],
  },
  "tierra-del-fuego-national-park": {
    hero: "Tierra del Fuego National Park - Patagonia - Argentina.jpg",
    gallery: [
      "Tierra del Fuego National Park - Patagonia - Argentina.jpg",
      "Tren del Fin del Mundo.jpg",
      "Ushuaia - Canal Beagle.jpg",
      "Tierra del Fuego National Park - Patagonia - Argentina.jpg",
    ],
  },
};

const thumbCache = new Map();

async function getResolved(fileTitle) {
  if (thumbCache.has(fileTitle)) return thumbCache.get(fileTitle);
  const resolved = await resolveThumb(fileTitle);
  await sleep(300);
  if (resolved) thumbCache.set(fileTitle, resolved);
  return resolved;
}

async function main() {
  const assets = [];

  for (const [placeId, { hero, gallery }] of Object.entries(FILES)) {
    const heroResolved = await getResolved(hero);
    if (heroResolved) {
      assets.push({
        id: `place-${placeId}-hero`,
        title: hero.replace(/\.jpg$/i, ""),
        alt: `${hero.replace(/\.jpg$/i, "")}, Argentina`,
        category: "destination",
        tags: [placeId, "argentina"],
        source: "wikimedia",
        sourceUrl: heroResolved.sourceUrl,
        license: heroResolved.license,
        author: heroResolved.author,
        localPath: `/media/places/${placeId}/hero.jpg`,
        placeId,
        role: "hero",
      });
    } else {
      console.warn(`No hero for ${placeId}: ${hero}`);
    }

    for (let i = 0; i < gallery.length; i++) {
      const file = gallery[i];
      const resolved = await getResolved(file);
      if (!resolved) {
        console.warn(`No gallery ${i + 1} for ${placeId}: ${file}`);
        continue;
      }
      assets.push({
        id: `place-${placeId}-g${i + 1}`,
        title: file.replace(/\.jpg$/i, ""),
        alt: `${file.replace(/\.jpg$/i, "")}, Argentina`,
        category: "destination",
        tags: [placeId, "argentina"],
        source: "wikimedia",
        sourceUrl: resolved.sourceUrl,
        license: resolved.license,
        author: resolved.author,
        localPath: `/media/places/${placeId}/gallery-${i + 1}.jpg`,
        placeId,
        role: "gallery",
      });
    }
  }

  const out = {
    version: 1,
    generatedAt: new Date().toISOString(),
    assets,
  };

  const outPath = path.join(root, "src/data/media-library/manifest.json");
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2));
  console.log(`Wrote ${assets.length} resolved assets to ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
