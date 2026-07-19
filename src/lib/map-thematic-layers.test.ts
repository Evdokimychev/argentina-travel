import { describe, expect, it } from "vitest";
import {
  DEFAULT_MAP_THEMATIC_STATE,
  NON_PUBLIC_MAP_THEMATIC_LAYER_IDS,
  PUBLIC_MAP_THEMATIC_LAYER_IDS,
  getThematicLayersByGroup,
  parseMapThematicLayers,
  serializeMapThematicLayers,
  toggleMapThematicLayer,
} from "@/lib/map-thematic-layers";

describe("map-thematic-layers", () => {
  it("parses comma-separated public layer ids", () => {
    const state = parseMapThematicLayers("patagonia,ba_neighborhoods");
    expect(state.patagonia).toBe(true);
    expect(state.ba_neighborhoods).toBe(true);
    expect(state.unesco).toBe(false);
  });

  it("rejects schematic layers from public URL state", () => {
    const state = parseMapThematicLayers("climate_zones,biosphere,beaches,patagonia");
    expect(state.patagonia).toBe(true);
    for (const id of NON_PUBLIC_MAP_THEMATIC_LAYER_IDS) {
      expect(state[id]).toBe(false);
    }
  });

  it("returns defaults for empty param", () => {
    expect(parseMapThematicLayers(null)).toEqual(DEFAULT_MAP_THEMATIC_STATE);
    expect(parseMapThematicLayers("")).toEqual(DEFAULT_MAP_THEMATIC_STATE);
  });

  it("serializes active layers", () => {
    const state = { ...DEFAULT_MAP_THEMATIC_STATE, patagonia: true, ruta_40: true };
    expect(serializeMapThematicLayers(state)).toBe("patagonia,ruta_40");
  });

  it("never serializes schematic layers", () => {
    const state = {
      ...DEFAULT_MAP_THEMATIC_STATE,
      climate_zones: true,
      biosphere: true,
      beaches: true,
      ruta_40: true,
    };
    expect(serializeMapThematicLayers(state)).toBe("ruta_40");
  });

  it("toggles a layer", () => {
    const next = toggleMapThematicLayer(DEFAULT_MAP_THEMATIC_STATE, "wine_regions");
    expect(next.wine_regions).toBe(true);
    expect(toggleMapThematicLayer(next, "wine_regions").wine_regions).toBe(false);
  });

  it("does not toggle schematic layers into public state", () => {
    for (const id of NON_PUBLIC_MAP_THEMATIC_LAYER_IDS) {
      expect(toggleMapThematicLayer(DEFAULT_MAP_THEMATIC_STATE, id)[id]).toBe(false);
    }
  });

  it("does not expose schematic layers in public groups", () => {
    const publicIds = Object.values(getThematicLayersByGroup())
      .flat()
      .map((layer) => layer.id);
    expect(publicIds).toEqual(expect.arrayContaining(PUBLIC_MAP_THEMATIC_LAYER_IDS));
    for (const id of NON_PUBLIC_MAP_THEMATIC_LAYER_IDS) {
      expect(publicIds).not.toContain(id);
    }
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
