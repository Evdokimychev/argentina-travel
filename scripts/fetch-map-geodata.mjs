#!/usr/bin/env node
/**
 * GeoJSON для тематических слоёв — только OpenStreetMap (совпадает с CARTO/OSM тайлами).
 * Запуск: npm run map:fetch-geodata
 */
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import osmtogeojson from "osmtogeojson";
import { filterRouteSegments } from "./lib/route-segment-filter.mjs";

const ROUTE_FILTER_OPTS = { minPoints: 4, minKm: 0.5 };
const BA_BARRIOS_GEOJSON_URL =
  "http://cdn.buenosaires.gob.ar/datosabiertos/datasets/barrios/barrios.geojson";

/** Официальные названия barrios CABA → ключи registry. */
const OFFICIAL_BARRIO_ALIASES = {
  boca: "la boca",
  paternal: "la paternal",
  monserrat: "montserrat",
  "villa grl. mitre": "villa general mitre",
  "villa gral. mitre": "villa general mitre",
  saavedra: "saavedra",
};
import {
  filterRouteSegments,
  normalizeRouteFeature,
} from "./lib/route-segment-filter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public/geo/map");

const OVERPASS_ENDPOINTS = [
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];

/** @deprecated — см. src/data/map-barrios/caba-barrios-registry.json */
async function loadCabaBarrioRegistry() {
  const path = new URL("../src/data/map-barrios/caba-barrios-registry.json", import.meta.url);
  const raw = await readFile(path, "utf8");
  return JSON.parse(raw);
}

function normalizeOsmBarrioName(value) {
  return String(value)
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
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

const PATAGONIA_PROVINCE_NAMES = [
  "neuquén",
  "neuquen",
  "río negro",
  "rio negro",
  "chubut",
  "santa cruz",
  "tierra del fuego",
];

const WINE_PROVINCE_NAMES = [
  "mendoza",
  "san juan",
  "salta",
  "la rioja",
  "neuquén",
  "neuquen",
  "río negro",
  "rio negro",
];

const NATIONAL_PARK_NAME_HINTS = [
  "parque nacional",
  "los glaciares",
  "iguazú",
  "iguazu",
  "tierra del fuego",
  "nahuel huapi",
  "lanín",
  "lanin",
  "talampaya",
  "el palmar",
  "baritú",
  "baritu",
  "los alerces",
  "lago puelo",
];

function fc(features) {
  return { type: "FeatureCollection", features };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function overpass(query) {
  let lastError;
  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const url = `${endpoint}?data=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "goargentina-map-geodata/1.0", Accept: "application/json" },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    } catch (err) {
      lastError = err;
      await sleep(1500);
    }
  }
  throw lastError;
}

async function overpassToGeoJson(query) {
  const osm = await overpass(query);
  return osmtogeojson(osm, { flatProperties: true });
}

/** После (._;>;); osmtogeojson отдаёт и ways — оставляем только полигоны relation. */
function relationPolygonsOnly(geojson, filter = () => true) {
  const features = geojson.features.filter((feature) => {
    const geom = feature.geometry;
    if (!geom || (geom.type !== "Polygon" && geom.type !== "MultiPolygon")) return false;
    const props = feature.properties ?? {};
    if (props.type === "way") return false;
    return filter(props);
  });
  return fc(features);
}

function adminRelationFilter(props, adminLevel) {
  if (String(props.admin_level) !== String(adminLevel)) return false;
  return props.boundary === "administrative" || props.boundary === "region";
}

function isArgentinaProvinceProps(props) {
  const iso = String(props["ISO3166-2"] ?? props.iso3166_2 ?? "").toUpperCase();
  return iso.startsWith("AR-");
}

function pickName(props) {
  return (
    props.nameRu ??
    props.name ??
    props["name:es"] ??
    props["name:en"] ??
    "Territorio"
  );
}

function normalizePolygonFeature(feature, extra = {}) {
  const geom = feature.geometry;
  if (!geom || (geom.type !== "Polygon" && geom.type !== "MultiPolygon")) return null;
  const name = pickName(feature.properties ?? {});
  return {
    type: "Feature",
    properties: { ...feature.properties, name, ...extra },
    geometry: geom,
  };
}

function matchNormalizedName(name, list) {
  const n = name.toLowerCase();
  return list.some((item) => n.includes(item));
}

async function writeGeoJsonIfNonEmpty(fileName, collection) {
  if (!collection?.features?.length) {
    console.warn(`  Skip empty ${fileName}`);
    return false;
  }
  await writeFile(path.join(OUT_DIR, fileName), JSON.stringify(collection, null, 0));
  return true;
}

function bboxArea(feature) {
  const geom = feature.geometry;
  if (!geom) return 0;
  const coords =
    geom.type === "Polygon"
      ? geom.coordinates[0]
      : geom.type === "MultiPolygon"
        ? geom.coordinates[0]?.[0] ?? []
        : [];
  if (coords.length < 2) return 0;
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of coords) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return (maxLon - minLon) * (maxLat - minLat);
}

function pickLargestFeature(features) {
  if (features.length <= 1) return features;
  return [features.sort((a, b) => bboxArea(b) - bboxArea(a))[0]];
}

async function fetchArgentinaBorder() {
  /** Relation 286393 — единая страна; out geom без (._;>;) даёт один MultiPolygon без way-фрагментов. */
  const query = `
    [out:json][timeout:300];
    relation(id:286393);
    out geom;
  `;
  const geojson = await overpassToGeoJson(query);
  const filtered = relationPolygonsOnly(geojson, (props) =>
    adminRelationFilter(props, 2) || props["ISO3166-1"] === "AR"
  );
  const features = pickLargestFeature(
    filtered.features
      .map((f) => normalizePolygonFeature(f, { source: "OpenStreetMap admin_level=2" }))
      .filter(Boolean)
  );
  return fc(features);
}

async function fetchProvinces() {
  const query = `
    [out:json][timeout:300];
    area["ISO3166-1"="AR"]->.ar;
    relation["boundary"="administrative"]["admin_level"="4"](area.ar);
    (._;>;);
    out geom;
  `;
  const geojson = await overpassToGeoJson(query);
  const filtered = relationPolygonsOnly(geojson, (props) => adminRelationFilter(props, 4));
  const features = filtered.features
    .map((f) => {
      const iso = f.properties?.["ISO3166-2"] ?? f.properties?.ref ?? "";
      return normalizePolygonFeature(f, {
        iso3166_2: iso,
        source: "OpenStreetMap admin_level=4",
      });
    })
    .filter(Boolean)
    .filter((f) => isArgentinaProvinceProps(f.properties ?? {}));
  return fc(features);
}

async function fetchBaNeighborhoodsOfficial() {
  const registry = await loadCabaBarrioRegistry();
  const res = await fetch(BA_BARRIOS_GEOJSON_URL, {
    headers: { "User-Agent": "goargentina-map-geodata/1.0" },
  });
  if (!res.ok) throw new Error(`BA barrios HTTP ${res.status}`);
  const geojson = await res.json();
  const bySlug = new Map();

  for (const feature of geojson.features ?? []) {
    const rawName = String(feature.properties?.BARRIO ?? feature.properties?.barrio ?? "").trim();
    if (!rawName) continue;

    const barrio = matchBarrioFromRegistry(rawName, registry);
    const slug = barrio?.slug ?? normalizeOsmBarrioName(rawName).replace(/\s+/g, "-");
    const normalizedFeature = normalizePolygonFeature(feature, {
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
    if (!normalizedFeature?.geometry) continue;
    bySlug.set(slug, normalizedFeature);
  }

  const features = [...bySlug.values()].sort((a, b) =>
    String(a.properties.nameRu).localeCompare(String(b.properties.nameRu), "ru")
  );
  console.log(`  Official BA barrios: ${features.length}/${registry.length}`);
  return fc(features);
}

async function fetchBaNeighborhoodsOsm() {
  const registry = await loadCabaBarrioRegistry();
  const bySlug = new Map();

  /** Официальные границы GCBA — 48 barrios, надёжнее Overpass. */
  try {
    const official = await fetchBaBarriosFromOfficial(registry);
    for (const feature of official.features) {
      bySlug.set(feature.properties.slug, feature);
    }
    console.log(`  Official GCBA: ${official.features.length} barrios`);
    if (official.features.length >= 45) {
      return official;
    }
  } catch (err) {
    console.warn("  Official BA barrios failed:", err.message);
  }

  /** Fallback: OpenStreetMap */
  try {
    const query = `
      [out:json][timeout:300];
      area["ISO3166-2"="AR-C"]->.caba;
      (
        relation["boundary"]["admin_level"~"9|10"](area.caba);
        relation["boundary"="neighbourhood"](area.caba);
      );
      (._;>;);
      out geom;
    `;
    const geojson = await overpassToGeoJson(query);
    mergeBaBarrioFeatures(relationPolygonsOnly(geojson).features, registry, bySlug);
  } catch (err) {
    console.warn("  Bulk BA barrios query failed, fetching individually:", err.message);
  }

  const missing = registry.filter((barrio) => !bySlug.has(barrio.slug));
  for (const barrio of missing) {
    const name = barrio.nameEs.replace(/"/g, '\\"');
    const query = `
      [out:json][timeout:90];
      area["ISO3166-2"="AR-C"]->.caba;
      (
        relation["boundary"]["name"="${name}"](area.caba);
        relation["boundary"="neighbourhood"]["name"="${name}"](area.caba);
      );
      out geom;
    `;
    try {
      const geojson = await overpassToGeoJson(query);
      mergeBaBarrioFeatures(geojson.features, registry, bySlug, barrio.slug);
      await sleep(600);
    } catch {
      console.warn(`  Skip barrio ${barrio.nameEs} (Overpass)`);
    }
  }

  const features = [...bySlug.values()].sort((a, b) =>
    String(a.properties.nameRu).localeCompare(String(b.properties.nameRu), "ru")
  );
  console.log(`  Matched ${features.length}/${registry.length} barrios`);
  return fc(features);
}

function mergeBaBarrioFeatures(rawFeatures, registry, bySlug, onlySlug = null) {
  for (const feature of rawFeatures) {
    const rawName = String(
      feature.properties?.name ??
        feature.properties?.["name:es"] ??
        feature.properties?.["name:en"] ??
        ""
    ).trim();
    if (!rawName) continue;

    const barrio = matchBarrioFromRegistry(rawName, registry);
    if (!barrio || (onlySlug && barrio.slug !== onlySlug)) continue;

    const normalizedFeature = normalizePolygonFeature(feature, {
      slug: barrio.slug,
      name: barrio.nameRu,
      nameRu: barrio.nameRu,
      nameEs: barrio.nameEs,
      nameOriginal: rawName,
      comuna: barrio.comuna,
      comunaLabel: barrio.comunaLabel,
      recommended: barrio.recommendedForStay,
      recommendedForStay: barrio.recommendedForStay,
      recommendedPriority: barrio.recommendedPriority,
      description: barrio.description,
      safetyNote: barrio.safetyNote ?? "",
      audience: barrio.audience,
      priceLevel: barrio.priceLevel,
      source: "OpenStreetMap — barrios CABA",
    });
    if (!normalizedFeature?.geometry) continue;

    const existing = bySlug.get(barrio.slug);
    if (!existing || bboxArea(normalizedFeature) > bboxArea(existing)) {
      bySlug.set(barrio.slug, normalizedFeature);
    }
  }
}

async function fetchProtectedAreas(filterFn) {
  const query = `
    [out:json][timeout:300];
    area["ISO3166-1"="AR"]->.ar;
    relation["boundary"="protected_area"](area.ar);
    (._;>;);
    out geom;
  `;
  const geojson = await overpassToGeoJson(query);
  const filtered = relationPolygonsOnly(geojson, (props) => props.boundary === "protected_area");
  const features = filtered.features
    .map((f) => {
      const name = pickName(f.properties ?? {});
      if (filterFn && !filterFn(name, f.properties ?? {})) return null;
      return normalizePolygonFeature(f, {
        category: f.properties?.protect_class ?? f.properties?.boundary ?? "protected_area",
        source: "OpenStreetMap protected_area",
      });
    })
    .filter(Boolean);
  return fc(features);
}

async function fetchBaBarriosFromOfficial(registry) {
  const url = "https://cdn.buenosaires.gob.ar/datosabiertos/datasets/barrios/barrios.geojson";
  const res = await fetch(url, {
    headers: { "User-Agent": "goargentina-map-geodata/1.0" },
  });
  if (!res.ok) throw new Error(`GCBA barrios HTTP ${res.status}`);
  const geojson = await res.json();
  const features = [];

  for (const feature of geojson.features ?? []) {
    const rawName = String(
      feature.properties?.nombre ??
        feature.properties?.BARRIO ??
        feature.properties?.name ??
        ""
    ).trim();
    if (!rawName) continue;

    const barrio = matchBarrioFromRegistry(rawName, registry);
    if (!barrio) continue;

    const normalizedFeature = normalizePolygonFeature(feature, {
      slug: barrio.slug,
      name: barrio.nameRu,
      nameRu: barrio.nameRu,
      nameEs: barrio.nameEs,
      nameOriginal: rawName,
      comuna: barrio.comuna,
      comunaLabel: barrio.comunaLabel,
      recommended: barrio.recommendedForStay,
      recommendedForStay: barrio.recommendedForStay,
      recommendedPriority: barrio.recommendedPriority,
      description: barrio.description,
      safetyNote: barrio.safetyNote ?? "",
      audience: barrio.audience,
      priceLevel: barrio.priceLevel,
      source: "GCBA datos abiertos — barrios oficiales",
    });
    if (normalizedFeature?.geometry) features.push(normalizedFeature);
  }

  features.sort((a, b) =>
    String(a.properties.nameRu).localeCompare(String(b.properties.nameRu), "ru")
  );
  return fc(features);
}

async function fetchWhaleWatching() {
  const query = `
    [out:json][timeout:180];
    (
      relation["name"~"Península Valdés|Peninsula Valdes",i]["boundary"];
      relation["name"~"Golfo San José|San José Gulf",i]["boundary"];
    );
    (._;>;);
    out geom;
  `;
  const geojson = await overpassToGeoJson(query);
  const filtered = relationPolygonsOnly(geojson);
  const features = filtered.features
    .map((f) =>
      normalizePolygonFeature(f, {
        source: "OpenStreetMap — Península Valdés",
      })
    )
    .filter(Boolean);
  return fc(features);
}

async function fetchRoutes() {
  await sleep(2000);
  const ruta40Query = `
    [out:json][timeout:180];
    area["ISO3166-1"="AR"]->.ar;
    (
      way["ref"="RN 40"]["highway"~"primary|secondary|tertiary|trunk"](area.ar);
      way["ref"="Ruta 40"]["highway"](area.ar);
      way["ref:AR:national"="RN 40"]["highway"](area.ar);
      relation["route"="road"]["ref"~"^RN ?40"]["network"="AR:national"](area.ar);
    );
    (._;>;);
    out geom;
  `;
  await sleep(2000);
  const scenicQuery = `
    [out:json][timeout:180];
    area["ISO3166-1"="AR"]->.ar;
    (
      way["name"~"Siete Lagos",i]["highway"~"primary|secondary|tertiary|trunk"](area.ar);
      way["ref"="RN 237"]["highway"](area.ar);
      way["name"~"Ruta de los Siete Lagos",i]["highway"](area.ar);
      way["name"~"Camino de los Siete Lagos",i]["highway"](area.ar);
      way["ref"="RN 68"]["highway"](area.ar);
      way["name"~"Ruta del Vino",i]["highway"](-70,-34,-66,-28);
    );
    (._;>;);
    out geom;
  `;
  await sleep(2000);
  const patagoniaQuery = `
    [out:json][timeout:180];
    (
      way["ref"="RN 237"]["highway"](-71,-42,-68,-38);
      way["ref"="RN 3"]["highway"](-66,-48,-58,-44);
      way["name"~"Siete Lagos",i]["highway"](-73,-42,-70,-39);
      way["name"~"Carretera Austral",i]["highway"](-75,-48,-71,-42);
      way["ref"~"RN 40"]["highway"](-72,-52,-66,-40);
      relation["route"="road"]["name"~"Carretera Austral",i](-75,-48,-71,-42);
    );
    (._;>;);
    out geom;
  `;

  const ruta40 = await overpassToGeoJson(ruta40Query);
  const scenic = await overpassToGeoJson(scenicQuery);
  const patagonia = await overpassToGeoJson(patagoniaQuery);

  const ruta40Lines = extractLineFeatures(ruta40, { route: "Ruta 40" });
  const scenicLines = extractLineFeatures(scenic, { route: "scenic" });
  const patagoniaLines = extractLineFeatures(patagonia, { route: "patagonia" });

  return {
    ruta40: fc(
      filterRouteSegments(ruta40Lines, 40, ROUTE_FILTER_OPTS).map((f) => ({
        ...f,
        properties: {
          ...f.properties,
          source: "OpenStreetMap — RN 40 (filtered)",
        },
      }))
    ),
    scenic: fc(scenicLines),
    patagonia: fc(patagoniaLines),
  };
}

function extractLineFeatures(collection, extraProps = {}) {
  const out = [];
  for (const feature of collection.features ?? []) {
    const geom = feature.geometry;
    const name =
      feature.properties?.name ??
      feature.properties?.["name:es"] ??
      feature.properties?.ref ??
      "Маршрут";
    const props = { ...feature.properties, name, ...extraProps };
    if (geom?.type === "LineString") {
      out.push({ type: "Feature", properties: props, geometry: geom });
    } else if (geom?.type === "MultiLineString") {
      for (const coords of geom.coordinates) {
        out.push({
          type: "Feature",
          properties: props,
          geometry: { type: "LineString", coordinates: coords },
        });
      }
    }
  }
  return out;
}

async function fetchUnescoSites() {
  const query = `
    [out:json][timeout:120];
    area["ISO3166-1"="AR"]->.ar;
    (
      node["heritage"="1"]["heritage:operator"="whc"](area.ar);
      way["heritage"="1"]["heritage:operator"="whc"](area.ar);
      relation["heritage"="1"]["heritage:operator"="whc"](area.ar);
    );
    out center tags;
  `;
  const osm = await overpass(query);
  const features = [];
  for (const el of osm.elements ?? []) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null) continue;
    const name =
      el.tags?.name ?? el.tags?.["name:es"] ?? el.tags?.["name:en"] ?? "UNESCO";
    features.push({
      type: "Feature",
      properties: {
        name,
        category: "UNESCO World Heritage",
        source: "OpenStreetMap heritage=1",
      },
      geometry: { type: "Point", coordinates: [lon, lat] },
    });
  }
  return fc(features);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  console.log("→ OSM: граница Аргентины — заливка строится из провинций (см. argentina_border layer)");
  // admin_level=2 relation даёт битый MultiPolygon (~200k точек) — не используем для fill

  console.log("→ OSM: провинции (admin_level=4)…");
  const provinces = await fetchProvinces();
  await writeFile(path.join(OUT_DIR, "provinces.geojson"), JSON.stringify(provinces, null, 0));
  console.log(`  ${provinces.features.length} provinces`);

  const patagonia = fc(
    provinces.features.filter((f) => matchNormalizedName(f.properties.name, PATAGONIA_PROVINCE_NAMES))
  );
  await writeFile(path.join(OUT_DIR, "patagonia.geojson"), JSON.stringify(patagonia, null, 0));

  const wine = fc(
    provinces.features.filter((f) => matchNormalizedName(f.properties.name, WINE_PROVINCE_NAMES))
  );
  await writeFile(path.join(OUT_DIR, "wine-regions.geojson"), JSON.stringify(wine, null, 0));

  console.log("→ Barrios CABA (official open data)…");
  try {
    const ba = await fetchBaNeighborhoodsOfficial();
    if (await writeGeoJsonIfNonEmpty("ba-neighborhoods.geojson", ba)) {
      console.log(`  ${ba.features.length} barrios`);
    }
  } catch (err) {
    console.warn("  Official BA barrios failed, trying OSM:", err.message);
    try {
      const ba = await fetchBaNeighborhoodsOsm();
      if (await writeGeoJsonIfNonEmpty("ba-neighborhoods.geojson", ba)) {
        console.log(`  ${ba.features.length} barrios (OSM fallback)`);
      }
    } catch (osmErr) {
      console.warn("  BA barrios OSM fallback failed:", osmErr.message);
    }
  }

  console.log("→ OSM: protected areas (national parks)…");
  try {
    const parks = await fetchProtectedAreas((name, tags) => {
      const hay = `${name} ${tags.name ?? ""} ${tags["name:es"] ?? ""}`.toLowerCase();
      return NATIONAL_PARK_NAME_HINTS.some((hint) => hay.includes(hint));
    });
    await writeGeoJsonIfNonEmpty("national-parks.geojson", parks);
    console.log(`  ${parks.features.length} parks`);
  } catch (err) {
    console.warn("  National parks failed:", err.message);
  }

  console.log("→ OSM: whale watching…");
  try {
    const whales = await fetchWhaleWatching();
    await writeGeoJsonIfNonEmpty("whale-watching.geojson", whales);
    console.log(`  ${whales.features.length} area(s)`);
  } catch (err) {
    console.warn("  Whale watching failed:", err.message);
  }

  console.log("→ OSM: routes…");
  try {
    const routes = await fetchRoutes();
    const ruta40Filtered = filterRouteSegments(routes.ruta40.features ?? [], 40).map((f) =>
      normalizeRouteFeature(f, {
        name: "Ruta Nacional 40",
        route: "ruta_40",
        ref: "RN 40",
        source: "OpenStreetMap — RN 40 (filtered)",
      })
    );
    await writeGeoJsonIfNonEmpty("ruta-40.geojson", fc(ruta40Filtered));
    console.log(`  Ruta 40: ${ruta40Filtered.length} filtered segments (raw ${routes.ruta40.features.length})`);
  } catch (err) {
    console.warn("  Routes failed:", err.message);
  }

  console.log("→ OSM: UNESCO…");
  try {
    const unesco = await fetchUnescoSites();
    await writeGeoJsonIfNonEmpty("unesco-sites.geojson", unesco);
    console.log(`  ${unesco.features.length} site(s)`);
  } catch (err) {
    console.warn("  UNESCO failed:", err.message);
  }

  console.log("→ Static + OSRM thematic layers…");
  try {
    const { execSync } = await import("node:child_process");
    execSync("node scripts/build-static-map-geodata.mjs", { cwd: ROOT, stdio: "inherit" });
    execSync("node scripts/build-route-geodata.mjs", { cwd: ROOT, stdio: "inherit" });
  } catch (err) {
    console.warn("  Build thematic failed:", err.message);
  }

  const manifest = {
    version: 2,
    generatedAt: new Date().toISOString(),
    basemapAlignment: "OpenStreetMap — совпадает с CARTO/OSM тайлами (© OpenStreetMap contributors)",
    attribution: "© OpenStreetMap contributors — ODbL",
    layers: {
      argentina_border: { file: null, source: "OSM provinces union (derived)" },
      provinces: { file: "provinces.geojson", source: "OSM admin_level=4" },
      patagonia: { file: "patagonia.geojson", source: "OSM provinces subset" },
      ba_neighborhoods: { file: "ba-neighborhoods.geojson", source: "OSM barrios CABA" },
      national_parks_area: { file: "national-parks.geojson", source: "OSM protected_area" },
      wine_regions: { file: "wine-regions.geojson", source: "OSM provinces subset" },
      whale_watching: { file: "whale-watching.geojson", source: "OSM Península Valdés" },
      ruta_40: { file: "ruta-40.geojson", source: "OSM RN 40" },
      ruta_3: { file: "ruta-3.geojson", source: "OSRM RN 3" },
      panamericana: { file: "panamericana.geojson", source: "OSRM Panamericana" },
      scenic_routes: { file: "scenic-routes.geojson", source: "OSRM scenic" },
      patagonia_routes: { file: "patagonia-routes.geojson", source: "OSM+OSRM Patagonia" },
      unesco: { file: "unesco-sites.geojson", source: "OSM UNESCO WHC" },
      climate_zones: { file: "climate-zones.geojson", source: "Climate macro zones" },
      biosphere: { file: "biosphere-reserves.geojson", source: "UNESCO MAB" },
      beaches: { file: "beach-zones.geojson", source: "Atlantic resorts" },
      ski_resorts: { file: "ski-resorts.geojson", source: "Ski centers" },
      popular_regions: { file: null, source: "Derived from provinces" },
      glacier_zones: { file: null, source: "Derived from national parks" },
    },
  };

  await writeFile(path.join(OUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("\n✓ OSM-aligned GeoJSON in public/geo/map/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
