#!/usr/bin/env node
/** Обновляет ba-neighborhoods.geojson из data.buenosaires.gob.ar */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public/geo/map");

const BA_BARRIOS_GEOJSON_URL =
  "http://cdn.buenosaires.gob.ar/datosabiertos/datasets/barrios/barrios.geojson";

const OFFICIAL_BARRIO_ALIASES = {
  boca: "la boca",
  paternal: "la paternal",
  monserrat: "montserrat",
  "villa grl. mitre": "villa general mitre",
  "villa gral. mitre": "villa general mitre",
  saavedra: "saavedra",
};

function normalizeOsmBarrioName(value) {
  return String(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

function pickName(props) {
  return props.nameRu ?? props.name ?? props["name:es"] ?? "Barrio";
}

function normalizePolygonFeature(feature, extra = {}) {
  const geom = feature.geometry;
  if (!geom || (geom.type !== "Polygon" && geom.type !== "MultiPolygon")) return null;
  const name = pickName({ ...feature.properties, ...extra });
  return {
    type: "Feature",
    properties: { ...feature.properties, name, ...extra },
    geometry: geom,
  };
}

function matchBarrioFromRegistry(osmName, registry) {
  const normalized = normalizeOsmBarrioName(osmName);
  if (!normalized) return null;
  const alias = OFFICIAL_BARRIO_ALIASES[normalized] ?? normalized;
  for (const barrio of registry) {
    if (normalizeOsmBarrioName(barrio.nameEs) === alias) return barrio;
  }
  for (const barrio of registry) {
    if (barrio.osmKeys.some((key) => alias === key)) return barrio;
  }
  return null;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const registry = JSON.parse(
    await readFile(path.join(ROOT, "src/data/map-barrios/caba-barrios-registry.json"), "utf8")
  );

  const res = await fetch(BA_BARRIOS_GEOJSON_URL, {
    headers: { "User-Agent": "goargentina-map-geodata/1.0" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const geojson = await res.json();
  const bySlug = new Map();

  for (const feature of geojson.features ?? []) {
    const rawName = String(feature.properties?.BARRIO ?? "").trim();
    if (!rawName) continue;
    const barrio = matchBarrioFromRegistry(rawName, registry);
    const slug = barrio?.slug ?? normalizeOsmBarrioName(rawName).replace(/\s+/g, "-");
    const normalized = normalizePolygonFeature(feature, {
      slug,
      name: barrio?.nameRu ?? rawName,
      nameRu: barrio?.nameRu ?? rawName,
      nameEs: barrio?.nameEs ?? rawName,
      nameOriginal: rawName,
      comuna:
        barrio?.comuna ??
        (Number.parseInt(String(feature.properties?.COMUNA ?? "0"), 10) || 0),
      comunaLabel: barrio?.comunaLabel ?? `Коммуна ${feature.properties?.COMUNA ?? "?"}`,
      recommended: barrio?.recommendedForStay ?? false,
      recommendedForStay: barrio?.recommendedForStay ?? false,
      recommendedPriority: barrio?.recommendedPriority ?? 0,
      description: barrio?.description ?? `Barrio ${rawName}, CABA`,
      safetyNote: barrio?.safetyNote ?? "",
      audience: barrio?.audience ?? ["local"],
      priceLevel: barrio?.priceLevel ?? 2,
      source: "Buenos Aires Data — barrios oficiales (USIG)",
    });
    if (normalized?.geometry) bySlug.set(slug, normalized);
  }

  const features = [...bySlug.values()].sort((a, b) =>
    String(a.properties.nameRu).localeCompare(String(b.properties.nameRu), "ru")
  );

  await writeFile(
    path.join(OUT_DIR, "ba-neighborhoods.geojson"),
    JSON.stringify({ type: "FeatureCollection", features })
  );
  console.log(`✓ ${features.length} barrios → public/geo/map/ba-neighborhoods.geojson`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
