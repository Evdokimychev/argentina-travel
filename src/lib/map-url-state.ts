import type { ReadonlyURLSearchParams } from "next/navigation";
import { MAP_LAYER_IDS, type MapLayerId } from "@/lib/map-types";

export const DEFAULT_MAP_LAYERS: MapLayerId[] = ["tours"];

export interface MapUrlState {
  layers: MapLayerId[];
  city: string;
  category: string;
  highlight: string;
}

function isMapLayerId(value: string): value is MapLayerId {
  return (MAP_LAYER_IDS as readonly string[]).includes(value);
}

export function parseMapLayersParam(raw: string | null): MapLayerId[] {
  if (!raw?.trim()) return [...DEFAULT_MAP_LAYERS];
  const parsed = raw
    .split(",")
    .map((part) => part.trim().toLowerCase())
    .filter(isMapLayerId);
  return parsed.length > 0 ? [...new Set(parsed)] : [...DEFAULT_MAP_LAYERS];
}

export function parseMapUrlState(
  params: ReadonlyURLSearchParams | URLSearchParams
): MapUrlState {
  return {
    layers: parseMapLayersParam(params.get("layer")),
    city: params.get("city")?.trim() ?? "",
    category: params.get("category")?.trim() ?? "",
    highlight: params.get("highlight")?.trim() ?? "",
  };
}

export function mapUrlStateToSearchParams(state: MapUrlState): URLSearchParams {
  const params = new URLSearchParams();
  const layers =
    state.layers.length === DEFAULT_MAP_LAYERS.length &&
    DEFAULT_MAP_LAYERS.every((layer) => state.layers.includes(layer)) &&
    state.layers.length === DEFAULT_MAP_LAYERS.length
      ? null
      : state.layers.join(",");

  if (layers) params.set("layer", layers);
  if (state.city) params.set("city", state.city);
  if (state.category) params.set("category", state.category);
  if (state.highlight) params.set("highlight", state.highlight);
  return params;
}

export function buildMapPath(state: MapUrlState): string {
  const qs = mapUrlStateToSearchParams(state).toString();
  return qs ? `/map?${qs}` : "/map";
}

export function toggleMapLayer(layers: MapLayerId[], layer: MapLayerId): MapLayerId[] {
  if (layers.includes(layer)) {
    const next = layers.filter((item) => item !== layer);
    return next.length > 0 ? next : [...DEFAULT_MAP_LAYERS];
  }
  return [...layers, layer];
}
