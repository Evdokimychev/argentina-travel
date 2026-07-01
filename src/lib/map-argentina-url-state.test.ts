import { describe, expect, it } from "vitest";
import { parseMapBasemapTheme } from "@/lib/map-basemap-themes";
import {
  clearAllMapFilterKinds,
  parseMapArgentinaKindsParam,
  resetMapFilterKinds,
  selectAllMapFilterKinds,
  serializeMapArgentinaKinds,
  toggleMapArgentinaKind,
} from "@/lib/map-argentina-url-state";

describe("map-argentina-url-state", () => {
  it("allows clearing all marker kinds", () => {
    expect(parseMapArgentinaKindsParam("none")).toEqual([]);
    expect(serializeMapArgentinaKinds([])).toBe("none");
    expect(toggleMapArgentinaKind(["city"], "city")).toEqual([]);
  });

  it("select all and reset helpers", () => {
    expect(clearAllMapFilterKinds()).toEqual([]);
    expect(selectAllMapFilterKinds().length).toBeGreaterThan(4);
    expect(resetMapFilterKinds()).toContain("city");
  });

  it("parses basemap theme", () => {
    expect(parseMapBasemapTheme("nature")).toBe("nature");
    expect(parseMapBasemapTheme(null)).toBe("tourist");
  });
});
