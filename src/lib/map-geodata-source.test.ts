import { describe, expect, it } from "vitest";
import { BOUNDARY_GEOJSON_SOURCE, boundaryGeoJsonSource } from "@/lib/map-geodata-source";

describe("map-geodata-source", () => {
  it("disables Douglas–Peucker simplification for boundary alignment", () => {
    expect(BOUNDARY_GEOJSON_SOURCE.tolerance).toBe(0);
    expect(BOUNDARY_GEOJSON_SOURCE.buffer).toBe(0);
  });

  it("builds geojson source spec with empty collection", () => {
    const spec = boundaryGeoJsonSource({ type: "FeatureCollection", features: [] });
    expect(spec.type).toBe("geojson");
    expect(spec.tolerance).toBe(0);
    expect(spec.generateId).toBe(true);
  });
});
