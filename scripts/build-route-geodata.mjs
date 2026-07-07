#!/usr/bin/env node
/**
 * Маршруты для тематических слоёв — OSRM (OSM-граф) + фильтр ruta-40.geojson.
 * Запуск: node scripts/build-route-geodata.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  filterRouteSegments,
  isReasonableOsrmRoute,
} from "./lib/route-segment-filter.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT_DIR = path.join(ROOT, "public/geo/map");

const ROUTE_FILTER_OPTS = { minPoints: 4, minKm: 0.5 };
const PATAGONIA_BBOX = [-72, -52, -58, -40];

function fc(features) {
  return { type: "FeatureCollection", features };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function loadWaypoints() {
  const raw = await readFile(path.join(ROOT, "src/data/map-routes/route-waypoints.json"), "utf8");
  return JSON.parse(raw);
}

const OSRM = "https://router.project-osrm.org/route/v1/driving";

async function osrmLine(waypoints, props) {
  const coords = waypoints.map(([lon, lat]) => `${lon},${lat}`).join(";");
  const url = `${OSRM}/${coords}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url, {
    headers: { "User-Agent": "goargentina-map-geodata/1.0" },
  });
  if (!res.ok) throw new Error(`OSRM ${res.status}`);
  const data = await res.json();
  const route = data.routes?.[0]?.geometry;
  if (!route?.coordinates?.length) return null;
  return {
    type: "Feature",
    properties: {
      ...props,
      source: "OSRM / OpenStreetMap road graph",
    },
    geometry: route,
  };
}

async function osrmChainedSegments(waypoints, props, segmentProps = () => ({})) {
  const features = [];
  for (let i = 0; i < waypoints.length - 1; i += 1) {
    await sleep(1200);
    const segment = await osrmLine([waypoints[i], waypoints[i + 1]], {
      ...props,
      ...segmentProps(i, waypoints.length - 1),
      segmentIndex: i,
    });
    if (segment && isReasonableOsrmRoute(segment)) {
      features.push(segment);
    }
  }
  return features;
}

function lineInBbox(feature, [minLon, minLat, maxLon, maxLat]) {
  const coords =
    feature.geometry?.type === "LineString" ? feature.geometry.coordinates : [];
  return coords.some(
    ([lon, lat]) => lon >= minLon && lon <= maxLon && lat >= minLat && lat <= maxLat
  );
}

function clipFeaturesToBbox(features, bbox) {
  return features.filter((f) => lineInBbox(f, bbox));
}

function loadAndFilterRuta40() {
  const filePath = path.join(OUT_DIR, "ruta-40.geojson");
  if (!existsSync(filePath)) return [];
  const raw = JSON.parse(readFileSync(filePath, "utf8"));
  return filterRouteSegments(raw.features ?? [], 40, ROUTE_FILTER_OPTS).map((f) => ({
    ...f,
    properties: {
      ...f.properties,
      name: f.properties?.name ?? "Ruta 40",
      routeGroup: "Ruta 40",
      source: "OpenStreetMap — RN 40 (filtered)",
    },
  }));
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

function filterOsmRouteSegments(features, routeNumber) {
  return filterRouteSegments(features, routeNumber, ROUTE_FILTER_OPTS);
}

async function tryFetchRn3OsmSegments() {
  return [];
}

async function buildFromWaypoints(spec, extra = {}) {
  await sleep(1200);
  const feature = await osrmLine(spec.waypoints, {
    name: spec.nameRu,
    nameEs: spec.name,
    description: spec.description,
    routeKey: spec.key,
    ...extra,
  });
  if (feature && !isReasonableOsrmRoute(feature)) return null;
  return feature;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const WAYPOINTS = await loadWaypoints();

  console.log("→ Filter ruta-40.geojson…");
  const ruta40Filtered = loadAndFilterRuta40();
  if (ruta40Filtered.length) {
    await writeFile(path.join(OUT_DIR, "ruta-40.geojson"), JSON.stringify(fc(ruta40Filtered)));
    console.log(`  ${ruta40Filtered.length} segment(s)`);
  } else {
    console.warn("  ruta-40.geojson missing or empty after filter");
  }

  console.log("→ OSRM: Ruta 3 (chained coastal segments)…");
  const ruta3Spec = { ...WAYPOINTS.ruta_3, key: "ruta_3" };
  let ruta3Features = await osrmChainedSegments(ruta3Spec.waypoints, {
    name: ruta3Spec.nameRu,
    nameEs: ruta3Spec.name,
    description: ruta3Spec.description,
    routeKey: "ruta_3",
    ref: "RN 3",
    route: "ruta_3",
  });
  console.log(`  OSRM chained: ${ruta3Features.length} segment(s)`);

  const rn3Osm = await tryFetchRn3OsmSegments();
  if (rn3Osm.length > ruta3Features.length) {
    console.log(`  Using OSM RN3 (${rn3Osm.length} segments) instead of OSRM`);
    ruta3Features = rn3Osm.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        name: ruta3Spec.nameRu,
        nameEs: ruta3Spec.name,
        description: ruta3Spec.description,
        routeKey: "ruta_3",
      },
    }));
  }

  await writeFile(path.join(OUT_DIR, "ruta-3.geojson"), JSON.stringify(fc(ruta3Features)));
  console.log(`  ruta-3.geojson: ${ruta3Features.length} segment(s)`);

  console.log("→ OSRM: Panamericana…");
  const pan9 = await buildFromWaypoints({ ...WAYPOINTS.panamericana_rn9, key: "panamericana_rn9" }, {
    ref: "RN 9",
    route: "panamericana",
  });
  const pan34 = await buildFromWaypoints(
    { ...WAYPOINTS.panamericana_rn34, key: "panamericana_rn34" },
    { ref: "RN 34", route: "panamericana" }
  );
  await writeFile(
    path.join(OUT_DIR, "panamericana.geojson"),
    JSON.stringify(fc([pan9, pan34].filter(Boolean)))
  );
  console.log(`  ${[pan9, pan34].filter(Boolean).length} line(s)`);

  console.log("→ OSRM: живописные дороги…");
  const siete = await buildFromWaypoints(
    { ...WAYPOINTS.scenic_siete_lagos, key: "scenic_siete_lagos" },
    { route: "scenic" }
  );
  const rn237 = await buildFromWaypoints(
    { ...WAYPOINTS.scenic_rn237, key: "scenic_rn237" },
    { route: "scenic", ref: "RN 237" }
  );
  let rn68 = await buildFromWaypoints(
    { ...WAYPOINTS.scenic_rn68, key: "scenic_rn68" },
    { route: "scenic", ref: "RN 68" }
  );
  // RN 68 — замкнутый винный маршрут; допускаем петлю без проверки detour ratio
  if (!rn68) {
    await sleep(1200);
    rn68 = await osrmLine(WAYPOINTS.scenic_rn68.waypoints, {
      name: WAYPOINTS.scenic_rn68.nameRu,
      nameEs: WAYPOINTS.scenic_rn68.name,
      description: WAYPOINTS.scenic_rn68.description,
      routeKey: "scenic_rn68",
      route: "scenic",
      ref: "RN 68",
    });
  }
  const scenicFeatures = [siete, rn237, rn68].filter(Boolean);
  await writeFile(path.join(OUT_DIR, "scenic-routes.geojson"), JSON.stringify(fc(scenicFeatures)));
  console.log(`  ${scenicFeatures.length} line(s)`);

  console.log("→ Патагония: filtered Ruta 40 + Ruta 3 + RN 237…");
  const ruta40Pat = clipFeaturesToBbox(ruta40Filtered, PATAGONIA_BBOX).map((f) => ({
    ...f,
    properties: {
      ...f.properties,
      name: "Ruta 40 (Patagonia)",
      routeGroup: "Ruta 40 (Patagonia)",
    },
  }));

  const ruta3Pat = clipFeaturesToBbox(ruta3Features, PATAGONIA_BBOX).map((f) => ({
    ...f,
    properties: {
      ...f.properties,
      name: "Ruta 3 (Patagonia)",
      routeGroup: "Ruta 3 (Patagonia)",
    },
  }));

  const rn237Pat = rn237
    ? clipFeaturesToBbox(
        [
          {
            ...rn237,
            properties: {
              ...rn237.properties,
              name: "Ruta 237 (Patagonia)",
              routeGroup: "Ruta 237",
            },
          },
        ],
        PATAGONIA_BBOX
      )
    : [];

  const patagoniaFeatures = [...ruta40Pat, ...ruta3Pat, ...rn237Pat];
  await writeFile(
    path.join(OUT_DIR, "patagonia-routes.geojson"),
    JSON.stringify(fc(patagoniaFeatures))
  );
  console.log(
    `  ${patagoniaFeatures.length} segment(s) (RN40: ${ruta40Pat.length}, RN3: ${ruta3Pat.length}, RN237: ${rn237Pat.length})`
  );

  console.log("\n✓ Route GeoJSON in public/geo/map/");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
