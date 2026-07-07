import { describe, expect, it } from "vitest";
import { MAP_THEMATIC_DATA_REGISTRY } from "@/data/map-thematic/layer-registry";

describe("map-thematic layer registry", () => {
  it("does not point schematic inline geojson module", () => {
    for (const spec of Object.values(MAP_THEMATIC_DATA_REGISTRY)) {
      expect(spec.source.length).toBeGreaterThan(10);
    }
  });

  it("marks ba_recommended as derived from official barrios", () => {
    const spec = MAP_THEMATIC_DATA_REGISTRY.ba_recommended;
    expect(spec.derivedFrom).toBe("ba_neighborhoods");
    expect(spec.dataFile).toBeNull();
  });

  it("marks argentina_border as derived from provinces", () => {
    const spec = MAP_THEMATIC_DATA_REGISTRY.argentina_border;
    expect(spec.derivedFrom).toBe("provinces");
    expect(spec.dataFile).toBeNull();
  });
});
