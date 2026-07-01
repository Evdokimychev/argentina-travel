import { describe, expect, it } from "vitest";
import { parseMapBasemapTheme } from "@/lib/map-basemap-themes";
import {
  collectMapOverlayAttributions,
  parseMapOverlayLayers,
  serializeMapOverlayLayers,
  toggleMapOverlayLayer,
} from "@/lib/map-overlay-layers";
import {
  clearAllMapFilterKinds,
  mapArgentinaStateToSearchParams,
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
    expect(parseMapBasemapTheme("satellite")).toBe("satellite");
    expect(parseMapBasemapTheme(null)).toBe("tourist");
  });

  it("serializes overlay layers in URL", () => {
    const params = mapArgentinaStateToSearchParams({
      kinds: ["city"],
      city: "",
      q: "",
      selected: "",
      theme: "tourist",
      overlays: {
        hillshade: true,
        terrain3d: false,
        contours: false,
        labels: true,
      },
    });
    expect(params.get("layers")).toBe("hillshade,labels");
  });
});

describe("map-overlay-layers", () => {
  it("parses and toggles overlay layers", () => {
    expect(parseMapOverlayLayers("hillshade,terrain3d").hillshade).toBe(true);
    expect(parseMapOverlayLayers("hillshade,terrain3d").terrain3d).toBe(true);
    expect(parseMapOverlayLayers(null).labels).toBe(false);
    expect(serializeMapOverlayLayers(parseMapOverlayLayers("contours"))).toBe("contours");
    expect(toggleMapOverlayLayer(parseMapOverlayLayers(null), "hillshade").hillshade).toBe(true);
  });

  it("collects attributions for active overlays", () => {
    const attrs = collectMapOverlayAttributions({
      hillshade: true,
      terrain3d: true,
      contours: true,
      labels: true,
    });
    expect(attrs.length).toBeGreaterThanOrEqual(3);
  });
});
