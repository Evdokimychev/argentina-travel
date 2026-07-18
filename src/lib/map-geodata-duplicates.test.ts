import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { Feature, FeatureCollection, Geometry } from "geojson";

function readMapGeoJson(fileName: string): FeatureCollection {
  return JSON.parse(
    readFileSync(join(process.cwd(), "public/geo/map", fileName), "utf8"),
  ) as FeatureCollection;
}

function featuresNamed(collection: FeatureCollection, name: string): Feature[] {
  return collection.features.filter((feature) => feature.properties?.name === name);
}

function uniqueGeometryCount(features: Feature[]): number {
  return new Set(
    features.map((feature) => JSON.stringify(feature.geometry satisfies Geometry | null)),
  ).size;
}

describe("authoritative map feature duplicates", () => {
  it("preserves separately located UNESCO components instead of dropping them by label", () => {
    const unesco = readMapGeoJson("unesco-sites.geojson");
    for (const name of [
      "Ruinas Jesuíticas de Santa María la Mayor",
      "Camino del Inca sección 5",
      "Camino del Inca",
    ]) {
      const parts = featuresNamed(unesco, name);
      expect(parts.length).toBeGreaterThan(1);
      expect(uniqueGeometryCount(parts)).toBe(parts.length);
      expect(parts.every((feature) => feature.geometry?.type === "Point")).toBe(true);
    }
  });

  it("documents that the repeated Tierra del Fuego park boundaries are not exact geometry duplicates", () => {
    const parks = readMapGeoJson("national-parks.geojson");
    const boundaries = featuresNamed(parks, "Parque Nacional Tierra del Fuego");
    expect(boundaries).toHaveLength(2);
    expect(uniqueGeometryCount(boundaries)).toBe(2);
    expect(new Set(boundaries.map((feature) => feature.properties?.id)).size).toBe(2);
    expect(new Set(boundaries.map((feature) => feature.properties?.wikidata))).toEqual(
      new Set(["Q828709"]),
    );
  });
});
