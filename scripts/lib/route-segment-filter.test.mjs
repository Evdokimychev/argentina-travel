import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  filterRouteSegments,
  isMainHighway,
  isNationalRouteRef,
  segmentLengthKm,
} from "./route-segment-filter.mjs";

describe("route-segment-filter", () => {
  it("accepts exact RN 40 refs", () => {
    assert.equal(isNationalRouteRef("RN 40", 40), true);
    assert.equal(isNationalRouteRef("RN40", 40), true);
    assert.equal(isNationalRouteRef("RN3;RN40", 40), false);
  });

  it("filters link and short segments", () => {
    assert.equal(isMainHighway("primary_link"), false);
    assert.equal(isMainHighway("primary"), true);

    const features = [
      {
        type: "Feature",
        properties: { ref: "RN 40", highway: "primary" },
        geometry: {
          type: "LineString",
          coordinates: [
            [-70, -40],
            [-70.1, -40.1],
            [-70.2, -40.2],
            [-70.3, -40.3],
          ],
        },
      },
      {
        type: "Feature",
        properties: { ref: "RN3;RN40", highway: "primary" },
        geometry: { type: "LineString", coordinates: [[-70, -40], [-70.01, -40.01]] },
      },
    ];

    const out = filterRouteSegments(features, 40);
    assert.equal(out.length, 1);
    assert.ok(segmentLengthKm(out[0].geometry.coordinates) > 0);
  });
});
