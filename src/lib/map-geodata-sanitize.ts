import rewind from "@mapbox/geojson-rewind";
import type { Feature, FeatureCollection, Polygon, Position } from "geojson";

const MAX_RING_VERTICES = 120_000;
const MIN_RING_VERTICES = 4;
/** Отсечь OSM-осколки (прямоугольные «лучи» при hover). ~0.002° ≈ 200 км² на широте −40°. */
const MIN_BBOX_AREA_DEG2 = 0.002;
/** «Перемычка» OSM relation — сегмент длиннее порога не рисуем в outline (см. showOutline: false). */
const CHORD_EDGE_DEG = 0.75;
/** Замыкание кольца длиннее — битая сборка relation (Chubut и др.). */
const BAD_WRAP_DEG = 1.0;

function edgeDeg(a: Position, b: Position): number {
  return Math.hypot(b[0] - a[0], b[1] - a[1]);
}

function closeRing(pts: Position[]): Position[] {
  if (pts.length < 3) return pts;
  const first = pts[0]!;
  const last = pts[pts.length - 1]!;
  if (first[0] === last[0] && first[1] === last[1]) return pts;
  return [...pts, first];
}

function ringBboxArea(ring: Position[]): number {
  if (ring.length < 3) return 0;
  let minLon = Infinity;
  let maxLon = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  for (const [lon, lat] of ring) {
    minLon = Math.min(minLon, lon);
    maxLon = Math.max(maxLon, lon);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }
  return (maxLon - minLon) * (maxLat - minLat);
}

function ringMaxEdge(ring: Position[], closed: boolean): number {
  if (ring.length < 2) return 0;
  let max = 0;
  const limit = closed ? ring.length : ring.length - 1;
  for (let i = 0; i < limit; i++) {
    max = Math.max(max, edgeDeg(ring[i]!, ring[(i + 1) % ring.length]!));
  }
  return max;
}

/**
 * OSM иногда собирает admin relation в одно кольцо с «перемычкой» через середину провинции.
 * Разрезаем только по самым длинным хордам (>0.75°), сохраняя крупнейший замкнутый фрагмент.
 */
function splitRingAtChords(ring: Position[]): Position[][] {
  if (ring.length < 4) return [];

  const closed =
    ring[0]![0] === ring[ring.length - 1]![0] && ring[0]![1] === ring[ring.length - 1]![1];
  const vertices = closed ? ring.slice(0, -1) : [...ring];
  if (vertices.length < 3) return [];

  const wrapEdge = closed ? edgeDeg(vertices[vertices.length - 1]!, vertices[0]!) : 0;
  if (closed && wrapEdge > BAD_WRAP_DEG) {
    return splitOpenChainAtChords(vertices);
  }

  const result: Position[][] = [];
  const queue: Position[][] = [vertices];

  while (queue.length > 0) {
    const chain = queue.shift()!;
    if (chain.length < 3) continue;

    let maxEdge = 0;
    let splitAfter = 0;
    for (let i = 0; i < chain.length; i++) {
      const d = edgeDeg(chain[i]!, chain[(i + 1) % chain.length]!);
      if (d > maxEdge) {
        maxEdge = d;
        splitAfter = (i + 1) % chain.length;
      }
    }

    if (maxEdge <= CHORD_EDGE_DEG) {
      result.push(closeRing(chain));
      continue;
    }

    if (splitAfter === 0) {
      result.push(...splitOpenChainAtChords(chain));
      continue;
    }

    const part1 = chain.slice(0, splitAfter);
    const part2 = chain.slice(splitAfter);
    if (part1.length >= 3) queue.push(part1);
    if (part2.length >= 3) queue.push(part2);
  }

  return result.filter((part) => ringBboxArea(part) >= MIN_BBOX_AREA_DEG2);
}

function splitOpenChainAtChords(chain: Position[]): Position[][] {
  const result: Position[][] = [];
  const queue: Position[][] = [chain];

  while (queue.length > 0) {
    const part = queue.shift()!;
    if (part.length < 3) continue;

    let maxEdge = 0;
    let splitAt = 1;
    for (let i = 1; i < part.length; i++) {
      const d = edgeDeg(part[i - 1]!, part[i]!);
      if (d > maxEdge) {
        maxEdge = d;
        splitAt = i;
      }
    }

    if (maxEdge <= CHORD_EDGE_DEG) {
      const closeEdge = edgeDeg(part[0]!, part[part.length - 1]!);
      if (closeEdge <= CHORD_EDGE_DEG) result.push(closeRing(part));
      continue;
    }

    const left = part.slice(0, splitAt);
    const right = part.slice(splitAt);
    if (left.length >= 3) queue.push(left);
    if (right.length >= 3) queue.push(right);
  }

  return result.filter((part) => ringBboxArea(part) >= MIN_BBOX_AREA_DEG2);
}

function expandPolygonRings(rings: Position[][]): Position[][][] {
  if (!rings.length) return [];
  const outerParts = splitRingAtChords(rings[0] ?? []);
  if (!outerParts.length) return [];
  const holes = rings.slice(1);
  return outerParts.map((outer) => [outer, ...holes]);
}

function provinceIsoKey(properties: Record<string, unknown>): string {
  return String(
    properties["ISO3166-2"] ?? properties.iso3166_2 ?? properties.iso_3166_2 ?? ""
  ).toUpperCase();
}

function sanitizePolygonRings(rings: Position[][]): Position[][] | null {
  if (!rings.length) return null;
  const outer = rings[0];
  if (!outer || outer.length < MIN_RING_VERTICES || outer.length > MAX_RING_VERTICES) {
    return null;
  }
  if (ringBboxArea(outer) < MIN_BBOX_AREA_DEG2) return null;

  const holes = rings
    .slice(1)
    .filter((ring) => ring.length >= MIN_RING_VERTICES && ring.length <= MAX_RING_VERTICES);
  return [outer, ...holes];
}

function rewindPolygonFeature(feature: Feature<Polygon>): Feature<Polygon> {
  const copy: Feature<Polygon> = {
    type: "Feature",
    properties: feature.properties,
    geometry: {
      type: "Polygon",
      coordinates: feature.geometry.coordinates,
    },
  };
  rewind(copy, true);
  return copy;
}

/** Разбивает MultiPolygon, отбрасывает битые кольца, нормализует winding — для MapLibre fill. */
export function sanitizeMapPolygonCollection(collection: FeatureCollection): FeatureCollection {
  const features: Feature[] = [];

  for (const feature of collection.features) {
    const geom = feature.geometry;
    if (!geom) continue;

    if (geom.type === "Polygon") {
      for (const polyRings of expandPolygonRings(geom.coordinates)) {
        const rings = sanitizePolygonRings(polyRings);
        if (!rings) continue;
        features.push(
          rewindPolygonFeature({
            type: "Feature",
            properties: feature.properties,
            geometry: { type: "Polygon", coordinates: rings },
          })
        );
      }
      continue;
    }

    if (geom.type === "MultiPolygon") {
      for (const poly of geom.coordinates) {
        for (const polyRings of expandPolygonRings(poly)) {
          const rings = sanitizePolygonRings(polyRings);
          if (!rings) continue;
          features.push(
            rewindPolygonFeature({
              type: "Feature",
              properties: feature.properties,
              geometry: { type: "Polygon", coordinates: rings },
            })
          );
        }
      }
      continue;
    }

    features.push(feature);
  }

  return { type: "FeatureCollection", features };
}

/** Склеивает осколки MultiPolygon в одну фичу на провинцию — без «лучей» при hover. */
export function groupPolygonsByProvinceIso(collection: FeatureCollection): FeatureCollection {
  const groups = new Map<
    string,
    { properties: Record<string, unknown>; polygons: Position[][][] }
  >();

  for (const feature of collection.features) {
    if (feature.geometry?.type !== "Polygon") continue;
    const key = provinceIsoKey((feature.properties ?? {}) as Record<string, unknown>);
    if (!key) continue;

    const entry = groups.get(key);
    const poly = feature.geometry.coordinates;
    if (entry) {
      entry.polygons.push(poly);
    } else {
      groups.set(key, {
        properties: feature.properties ?? {},
        polygons: [poly],
      });
    }
  }

  const features: Feature[] = [];
  for (const [, { properties, polygons }] of groups) {
    if (polygons.length === 1) {
      const f: Feature<Polygon> = {
        type: "Feature",
        properties,
        geometry: { type: "Polygon", coordinates: polygons[0]! },
      };
      features.push(rewindPolygonFeature(f));
    } else {
      const f: Feature = {
        type: "Feature",
        properties,
        geometry: { type: "MultiPolygon", coordinates: polygons },
      };
      rewind(f, true);
      features.push(f);
    }
  }

  return { type: "FeatureCollection", features };
}

/** Подмена битых OSM-колец (wrap > 1°) — geoBoundaries ADM1, совпадает с картой на средних зумах. */
export function applyProvinceGeometryFixes(
  collection: FeatureCollection,
  fixes: FeatureCollection
): FeatureCollection {
  const fixByIso = new Map<string, Feature>();
  for (const feature of fixes.features) {
    const iso = provinceIsoKey((feature.properties ?? {}) as Record<string, unknown>);
    if (iso) fixByIso.set(iso, feature);
  }
  if (!fixByIso.size) return collection;

  const replaced = new Set<string>();
  const features = collection.features.map((feature) => {
    const iso = provinceIsoKey((feature.properties ?? {}) as Record<string, unknown>);
    const fix = iso ? fixByIso.get(iso) : undefined;
    if (!fix?.geometry) return feature;
    replaced.add(iso);
    return {
      ...feature,
      properties: { ...feature.properties, geometrySource: "province-fix" },
      geometry: fix.geometry,
    };
  });

  for (const [iso, fix] of fixByIso) {
    if (replaced.has(iso)) continue;
    features.push(fix);
  }

  return { type: "FeatureCollection", features };
}

/** Санитизация + только AR + одна фича на провинцию. */
export function prepareArgentinaProvinceGeometry(
  raw: FeatureCollection,
  fixes?: FeatureCollection
): FeatureCollection {
  const sanitized = sanitizeMapPolygonCollection(raw);
  const argentina = {
    type: "FeatureCollection" as const,
    features: sanitized.features.filter((f) =>
      isArgentinaProvinceIso((f.properties ?? {}) as Record<string, unknown>)
    ),
  };
  const grouped = groupPolygonsByProvinceIso(argentina);
  if (fixes?.features.length) {
    return applyProvinceGeometryFixes(grouped, fixes);
  }
  return grouped;
}

export function isArgentinaProvinceIso(properties: Record<string, unknown>): boolean {
  const iso = String(
    properties["ISO3166-2"] ?? properties.iso3166_2 ?? properties.iso_3166_2 ?? ""
  ).toUpperCase();
  return iso.startsWith("AR-");
}

/** Экспорт для тестов — максимальное ребро кольца. */
export function maxRingEdge(ring: Position[], closed = true): number {
  const vertices =
    closed &&
    ring[0]![0] === ring[ring.length - 1]![0] &&
    ring[0]![1] === ring[ring.length - 1]![1]
      ? ring.slice(0, -1)
      : ring;
  const wrap = closed ? edgeDeg(vertices[vertices.length - 1]!, vertices[0]!) : 0;
  return Math.max(ringMaxEdge(vertices, false), wrap);
}
