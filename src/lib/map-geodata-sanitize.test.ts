import { describe, expect, it } from "vitest";
import {
  isArgentinaProvinceIso,
  groupPolygonsByProvinceIso,
  sanitizeMapPolygonCollection,
} from "@/lib/map-geodata-sanitize";

describe("map-geodata-sanitize", () => {
  it("filters non-AR provinces", () => {
    expect(isArgentinaProvinceIso({ "ISO3166-2": "AR-M" })).toBe(true);
    expect(isArgentinaProvinceIso({ "ISO3166-2": "CL-MA" })).toBe(false);
  });

  it("splits MultiPolygon and drops oversized rings", () => {
    const huge = Array.from({ length: 200_000 }, (_, i) => [i * 0.001, -34] as [number, number]);
    const collection = sanitizeMapPolygonCollection({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Bad" },
          geometry: {
            type: "MultiPolygon",
            coordinates: [
              [huge],
              [
                [
                  [0, 0],
                  [0.05, 0],
                  [0.05, 0.05],
                  [0, 0.05],
                  [0, 0],
                ],
              ],
            ],
          },
        },
      ],
    });
    expect(collection.features).toHaveLength(1);
    expect(collection.features[0]?.geometry.type).toBe("Polygon");
  });

  it("groups fragments into one feature per province iso", () => {
    const collection = groupPolygonsByProvinceIso({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { "ISO3166-2": "AR-U", name: "Chubut" },
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
          properties: { "ISO3166-2": "AR-U", name: "Chubut" },
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
    expect(collection.features).toHaveLength(1);
    expect(collection.features[0]?.geometry.type).toBe("MultiPolygon");
  });

  it("splits ring at OSM jump chords", () => {
    const ring = [
      [-65, -46],
      [-65.08, -46],
      [-65.08, -45.92],
      [-67, -45.92],
      [-65.08, -45.84],
      [-65, -45.84],
      [-65, -46],
    ];
    const collection = sanitizeMapPolygonCollection({
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { "ISO3166-2": "AR-U" },
          geometry: { type: "Polygon", coordinates: [ring] },
        },
      ],
    });
    expect(collection.features.length).toBeGreaterThanOrEqual(1);
    for (const f of collection.features) {
      const outer = f.geometry?.type === "Polygon" ? f.geometry.coordinates[0] : [];
      for (let i = 1; i < outer.length; i++) {
        const jump = Math.hypot(
          outer[i]![0] - outer[i - 1]![0],
          outer[i]![1] - outer[i - 1]![1]
        );
        expect(jump).toBeLessThan(0.75);
      }
    }
  });
});
