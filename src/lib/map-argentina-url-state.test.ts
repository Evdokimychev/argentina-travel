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
  parseMapArgentinaUrlState,
  resetMapFilterKinds,
  selectAllMapFilterKinds,
  serializeMapArgentinaKinds,
  toggleMapArgentinaKind,
} from "@/lib/map-argentina-url-state";
import { DEFAULT_MAP_THEMATIC_STATE } from "@/lib/map-thematic-layers";

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
      thematic: { ...DEFAULT_MAP_THEMATIC_STATE },
    });
    expect(params.get("layers")).toBe("hillshade,labels");
  });

  it("serializes thematic layers in URL", () => {
    const params = mapArgentinaStateToSearchParams({
      kinds: ["city"],
      city: "",
      q: "",
      selected: "",
      theme: "tourist",
      overlays: {
        hillshade: false,
        terrain3d: false,
        contours: false,
        labels: false,
      },
      thematic: { ...DEFAULT_MAP_THEMATIC_STATE, patagonia: true, ruta_40: true },
    });
    expect(params.get("tl")).toBe("patagonia,ruta_40");
  });

  it("parses only public thematic layers from URL", () => {
    const params = new URLSearchParams(
      "tl=climate_zones,biosphere,beaches,ba_neighborhoods",
    );
    const state = parseMapArgentinaUrlState(params);
    expect(state.thematic.climate_zones).toBe(false);
    expect(state.thematic.biosphere).toBe(false);
    expect(state.thematic.beaches).toBe(false);
    expect(state.thematic.ba_neighborhoods).toBe(true);
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
