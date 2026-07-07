import { describe, expect, it } from "vitest";
import type { Feature, LineString } from "geojson";
import {
  filterRouteSegments,
  isMainHighway,
  isNationalRouteRef,
  isReasonableOsrmRoute,
  segmentLengthKm,
} from "../../scripts/lib/route-segment-filter.mjs";

describe("route-segment-filter", () => {
  it("accepts exact RN refs and rejects compound refs", () => {
    expect(isNationalRouteRef("RN 40", 40)).toBe(true);
    expect(isNationalRouteRef("RN40", 40)).toBe(true);
    expect(isNationalRouteRef("Ruta 40", 40)).toBe(true);
    expect(isNationalRouteRef("40", 40)).toBe(true);
    expect(isNationalRouteRef("RN3;RN40", 40)).toBe(false);
    expect(isNationalRouteRef("RN 3", 40)).toBe(false);
  });

  it("filters main highways only", () => {
    expect(isMainHighway("trunk")).toBe(true);
    expect(isMainHighway("primary_link")).toBe(false);
    expect(isMainHighway("tertiary")).toBe(false);
  });

  it("drops short spurs from route segments", () => {
    const features: Feature<LineString>[] = [
      {
        type: "Feature",
        properties: { ref: "RN40", highway: "trunk" },
        geometry: {
          type: "LineString",
          coordinates: [
            [-69, -41],
            [-69.01, -41.01],
          ],
        },
      },
      {
        type: "Feature",
        properties: { ref: "RN40", highway: "primary" },
        geometry: {
          type: "LineString",
          coordinates: [
            [-69, -41],
            [-69.05, -41.05],
            [-69.1, -41.1],
            [-69.15, -41.15],
          ],
        },
      },
    ];
    const filtered = filterRouteSegments(features, 40, { minPoints: 4, minKm: 0.5 });
    expect(filtered).toHaveLength(1);
    expect(
      segmentLengthKm((filtered[0]!.geometry as LineString).coordinates as [number, number][])
    ).toBeGreaterThan(0.5);
  });

  it("flags unreasonable OSRM detours", () => {
    const straight: Feature<LineString> = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: [
          [-58.4, -34.6],
          [-58.41, -34.61],
          [-58.42, -34.62],
        ],
      },
    };
    expect(isReasonableOsrmRoute(straight)).toBe(true);
  });
});
