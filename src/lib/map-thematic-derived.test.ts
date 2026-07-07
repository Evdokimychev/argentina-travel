import { describe, expect, it } from "vitest";
import {
  buildGlacierZonesFromParks,
  buildPopularRegionsFromProvinces,
} from "@/lib/map-thematic-derived";

describe("map-thematic-derived", () => {
  it("groups provinces into macro regions", () => {
    const result = buildPopularRegionsFromProvinces({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { "ISO3166-2": "AR-M", name: "Mendoza" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [0, 0],
                [1, 0],
                [1, 1],
                [0, 1],
                [0, 0],
              ],
            ],
          },
        },
        {
          type: "Feature",
          properties: { "ISO3166-2": "AR-J", name: "San Juan" },
          geometry: {
            type: "Polygon",
            coordinates: [
              [
                [2, 0],
                [3, 0],
                [3, 1],
                [2, 1],
                [2, 0],
              ],
            ],
          },
        },
      ],
    });
    expect(result.features.length).toBeGreaterThan(0);
    const cuyo = result.features.find((f) => String(f.properties?.name).includes("Куйо"));
    expect(cuyo?.geometry.type).toBe("MultiPolygon");
  });

  it("filters glacier parks from national parks", () => {
    const result = buildGlacierZonesFromParks({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Parque Nacional Los Glaciares" },
          geometry: { type: "Polygon", coordinates: [] },
        },
        {
          type: "Feature",
          properties: { name: "Parque Nacional Chaco" },
          geometry: { type: "Polygon", coordinates: [] },
        },
      ],
    });
    expect(result.features).toHaveLength(1);
    expect(result.features[0]?.properties?.name).toContain("Glaciares");
  });
});
