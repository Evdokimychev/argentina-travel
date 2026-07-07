import {
  MAP_THEMATIC_LAYERS,
  type MapThematicLayerId,
} from "@/lib/map-thematic-layers";

const THEMATIC_SOURCE_PREFIX = "thematic-src-";
const THEMATIC_LAYER_PREFIX = "thematic-";

export function thematicSourceId(layerId: MapThematicLayerId): string {
  if (layerId === "provinces") return "regions";
  return `${THEMATIC_SOURCE_PREFIX}${layerId}`;
}

export function thematicMapLayerIds(layerId: MapThematicLayerId): string[] {
  const meta = MAP_THEMATIC_LAYERS[layerId];
  if (meta.kind === "fill") {
    const ids = [`${THEMATIC_LAYER_PREFIX}${layerId}-fill`];
    if (meta.showOutline !== false) {
      ids.push(`${THEMATIC_LAYER_PREFIX}${layerId}-outline`);
    }
    if (layerId === "ba_neighborhoods" || layerId === "ba_recommended" || layerId === "provinces") {
      ids.push(`${THEMATIC_LAYER_PREFIX}${layerId}-label`);
    }
    return ids;
  }
  if (meta.kind === "line") {
    return [`${THEMATIC_LAYER_PREFIX}${layerId}-line`];
  }
  return [`${THEMATIC_LAYER_PREFIX}${layerId}-circle`];
}
