import type { FeatureCollection } from "geojson";
import {
  MAP_THEMATIC_DATA_REGISTRY,
  getThematicLayerDataUrl,
  MAP_GEODATA_BASE_PATH,
} from "@/data/map-thematic/layer-registry";
import { enrichProvinceProperties } from "@/data/map-thematic/province-labels";
import { enrichBarrioProperties } from "@/data/map-barrios/caba-barrios";
import {
  buildGlacierZonesFromParks,
  buildPopularRegionsFromProvinces,
} from "@/lib/map-thematic-derived";
import {
  prepareArgentinaProvinceGeometry,
  sanitizeMapPolygonCollection,
} from "@/lib/map-geodata-sanitize";
import {
  MAP_THEMATIC_LAYER_IDS,
  type MapThematicLayerId,
} from "@/lib/map-thematic-layers";

const cache = new Map<MapThematicLayerId, FeatureCollection>();
const availability = new Map<MapThematicLayerId, boolean>();
const loading = new Map<MapThematicLayerId, Promise<FeatureCollection | null>>();

const PROVINCE_FIXES_URL = `${MAP_GEODATA_BASE_PATH}/province-fixes/broken-osm-rings.geojson`;

let provinceFixesCache: FeatureCollection | null = null;

function prepareProvinceGeometry(raw: FeatureCollection): FeatureCollection {
  return prepareArgentinaProvinceGeometry(raw, provinceFixesCache ?? undefined);
}

async function loadProvinceFixes(): Promise<void> {
  if (provinceFixesCache) return;
  provinceFixesCache = await fetchGeoJson(PROVINCE_FIXES_URL);
}

function emptyCollection(): FeatureCollection {
  return { type: "FeatureCollection", features: [] };
}

function normalizeCollection(
  layerId: MapThematicLayerId,
  data: FeatureCollection
): FeatureCollection {
  const spec = MAP_THEMATIC_DATA_REGISTRY[layerId];
  return {
    type: "FeatureCollection",
    features: data.features.map((feature) => {
      const props = feature.properties ?? {};
      const enriched =
        layerId === "provinces" || layerId === "patagonia" || layerId === "wine_regions"
          ? enrichProvinceProperties(props as Record<string, unknown>)
          : layerId === "ba_neighborhoods" || layerId === "ba_recommended"
            ? enrichBarrioProperties(props as Record<string, unknown>)
            : props;
      const name =
        layerId === "argentina_border"
          ? "Argentina"
          : ((enriched[spec.labelProperty] as string | undefined) ??
            (enriched.name as string | undefined) ??
            (enriched.nombre as string | undefined) ??
            (enriched.BARRIO as string | undefined) ??
            "Territorio");
      return {
        ...feature,
        properties: {
          ...enriched,
          name,
          layerId,
          source: spec.source,
        },
      };
    }),
  };
}

async function fetchGeoJson(url: string): Promise<FeatureCollection | null> {
  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return null;
    const data = (await res.json()) as FeatureCollection;
    if (data.type !== "FeatureCollection" || !Array.isArray(data.features)) return null;
    return data;
  } catch {
    return null;
  }
}

export async function checkThematicLayerAvailable(layerId: MapThematicLayerId): Promise<boolean> {
  if (availability.has(layerId)) return availability.get(layerId)!;

  const spec = MAP_THEMATIC_DATA_REGISTRY[layerId];
  if (spec.derivedFrom) {
    const parentOk = await checkThematicLayerAvailable(spec.derivedFrom);
    if (!parentOk) {
      availability.set(layerId, false);
      return false;
    }
    if (spec.derivedTransform) {
      const data = await loadThematicLayerGeoJson(layerId);
      const ok = data !== null && data.features.length > 0;
      availability.set(layerId, ok);
      return ok;
    }
    availability.set(layerId, parentOk);
    return parentOk;
  }

  const url = getThematicLayerDataUrl(layerId);
  if (!url) {
    availability.set(layerId, false);
    return false;
  }

  const data = await fetchGeoJson(url);
  const ok = data !== null && data.features.length > 0;
  availability.set(layerId, ok);
  return ok;
}

export async function loadThematicLayerGeoJson(
  layerId: MapThematicLayerId
): Promise<FeatureCollection | null> {
  if (cache.has(layerId)) return cache.get(layerId)!;
  if (loading.has(layerId)) return loading.get(layerId)!;

  const promise = (async () => {
    const spec = MAP_THEMATIC_DATA_REGISTRY[layerId];

    if (spec.derivedFrom && spec.derivedFilter) {
      const parent = await loadThematicLayerGeoJson(spec.derivedFrom);
      if (!parent) return null;
      const filtered = {
        type: "FeatureCollection" as const,
        features: parent.features.filter((f) => spec.derivedFilter!(f.properties ?? {})),
      };
      const normalized = normalizeCollection(layerId, filtered);
      cache.set(layerId, normalized);
      availability.set(layerId, normalized.features.length > 0);
      return normalized;
    }

    if (spec.derivedFrom && spec.derivedTransform) {
      const parent = await loadThematicLayerGeoJson(spec.derivedFrom);
      if (!parent) return null;
      const transformed =
        spec.derivedTransform === "popular_regions"
          ? buildPopularRegionsFromProvinces(parent)
          : buildGlacierZonesFromParks(parent);
      const normalized = normalizeCollection(layerId, transformed);
      cache.set(layerId, normalized);
      availability.set(layerId, normalized.features.length > 0);
      return normalized;
    }

    const url = getThematicLayerDataUrl(layerId);
    if (!url) {
      availability.set(layerId, false);
      return null;
    }

    const raw = await fetchGeoJson(url);
    if (!raw || raw.features.length === 0) {
      availability.set(layerId, false);
      return null;
    }

    if (layerId === "provinces" || layerId === "patagonia" || layerId === "wine_regions") {
      await loadProvinceFixes();
    }

    const argentinaOnly =
      layerId === "provinces" || layerId === "patagonia" || layerId === "wine_regions"
        ? prepareProvinceGeometry(raw)
        : spec.dataFile && raw.features[0]?.geometry?.type &&
            (raw.features[0].geometry.type === "Polygon" ||
              raw.features[0].geometry.type === "MultiPolygon")
          ? sanitizeMapPolygonCollection(raw)
          : raw;

    if (argentinaOnly.features.length === 0) {
      availability.set(layerId, false);
      return null;
    }

    const normalized = normalizeCollection(layerId, argentinaOnly);
    cache.set(layerId, normalized);
    availability.set(layerId, true);
    return normalized;
  })();

  loading.set(layerId, promise);
  const result = await promise;
  loading.delete(layerId);
  return result;
}

export async function probeThematicLayerAvailability(): Promise<Record<MapThematicLayerId, boolean>> {
  const entries = await Promise.all(
    MAP_THEMATIC_LAYER_IDS.map(async (id) => [id, await checkThematicLayerAvailable(id)] as const)
  );
  return Object.fromEntries(entries) as Record<MapThematicLayerId, boolean>;
}

export function getCachedThematicLayerGeoJson(layerId: MapThematicLayerId): FeatureCollection {
  return cache.get(layerId) ?? emptyCollection();
}

export function clearThematicLayerCache(): void {
  cache.clear();
  availability.clear();
  loading.clear();
}

export function isThematicLayerAvailableSync(layerId: MapThematicLayerId): boolean {
  return availability.get(layerId) ?? false;
}
