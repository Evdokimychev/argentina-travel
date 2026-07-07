import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAP_THEMATIC_STATE,
  parseMapThematicLayers,
  serializeMapThematicLayers,
  toggleMapThematicLayer,
} from "@/lib/map-thematic-layers";

describe("map-thematic-layers", () => {
  it("parses comma-separated layer ids", () => {
    const state = parseMapThematicLayers("patagonia,climate_zones,ba_neighborhoods");
    expect(state.patagonia).toBe(true);
    expect(state.climate_zones).toBe(true);
    expect(state.ba_neighborhoods).toBe(true);
    expect(state.unesco).toBe(false);
  });

  it("returns defaults for empty param", () => {
    expect(parseMapThematicLayers(null)).toEqual(DEFAULT_MAP_THEMATIC_STATE);
    expect(parseMapThematicLayers("")).toEqual(DEFAULT_MAP_THEMATIC_STATE);
  });

  it("serializes active layers", () => {
    const state = { ...DEFAULT_MAP_THEMATIC_STATE, patagonia: true, ruta_40: true };
    expect(serializeMapThematicLayers(state)).toBe("patagonia,ruta_40");
  });

  it("toggles a layer", () => {
    const next = toggleMapThematicLayer(DEFAULT_MAP_THEMATIC_STATE, "wine_regions");
    expect(next.wine_regions).toBe(true);
    expect(toggleMapThematicLayer(next, "wine_regions").wine_regions).toBe(false);
  });

  it("keeps only one admin boundary layer active", () => {
    let state = toggleMapThematicLayer(DEFAULT_MAP_THEMATIC_STATE, "provinces");
    expect(state.provinces).toBe(true);
    state = toggleMapThematicLayer(state, "patagonia");
    expect(state.patagonia).toBe(true);
    expect(state.provinces).toBe(false);
    expect(state.argentina_border).toBe(false);
  });
});
