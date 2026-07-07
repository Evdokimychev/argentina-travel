import type { Feature, FeatureCollection, MultiPolygon } from "geojson";
import { enrichProvinceProperties } from "@/data/map-thematic/province-labels";

const GLACIER_NAME_HINTS = [
  "glaciar",
  "glacier",
  "los glaciares",
  "huapi",
  "lanín",
  "lanin",
  "los alerces",
  "tierra del fuego",
  "lago puelo",
  "patagonia",
  "moreno",
];

function isGlacierParkName(name: string): boolean {
  const hay = name.toLowerCase();
  return GLACIER_NAME_HINTS.some((hint) => hay.includes(hint));
}

/** Группирует провинции по macroRegionRu → MultiPolygon на макрорегион. */
export function buildPopularRegionsFromProvinces(
  provinces: FeatureCollection
): FeatureCollection {
  const groups = new Map<string, Feature[]>();

  for (const feature of provinces.features) {
    const props = enrichProvinceProperties((feature.properties ?? {}) as Record<string, unknown>);
    const macro = String(props.macroRegionRu ?? "Регион");
    const enriched = { ...feature, properties: { ...feature.properties, ...props, name: macro } };
    const list = groups.get(macro) ?? [];
    list.push(enriched);
    groups.set(macro, list);
  }

  const features: Feature[] = [];
  for (const [macro, parts] of groups) {
    const polygons: number[][][][] = [];
    for (const part of parts) {
      const geom = part.geometry;
      if (!geom) continue;
      if (geom.type === "Polygon") polygons.push(geom.coordinates);
      else if (geom.type === "MultiPolygon") polygons.push(...geom.coordinates);
    }
    if (!polygons.length) continue;
    const geometry: MultiPolygon = { type: "MultiPolygon", coordinates: polygons };
    features.push({
      type: "Feature",
      properties: {
        name: macro,
        macroRegionRu: macro,
        description: `Популярный туристический макрорегион: ${macro}`,
      },
      geometry,
    });
  }

  return { type: "FeatureCollection", features };
}

export function buildGlacierZonesFromParks(parks: FeatureCollection): FeatureCollection {
  const features = parks.features.filter((f) => {
    const name = String(f.properties?.name ?? f.properties?.["name:es"] ?? "");
    return isGlacierParkName(name);
  });
  return {
    type: "FeatureCollection",
    features: features.map((f) => ({
      ...f,
      properties: {
        ...f.properties,
        name: f.properties?.name ?? "Зона ледников",
        description: "Национальный парк с ледниковыми ландшафтами",
      },
    })),
  };
}

export function isGlacierZoneProperties(properties: Record<string, unknown>): boolean {
  return isGlacierParkName(String(properties.name ?? properties["name:es"] ?? ""));
}
