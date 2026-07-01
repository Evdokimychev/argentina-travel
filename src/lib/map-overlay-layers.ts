export type MapOverlayLayerId = "hillshade" | "terrain3d" | "labels" | "contours";

export interface MapOverlayLayerMeta {
  id: MapOverlayLayerId;
  label: string;
  description: string;
  attribution?: string;
}

export type MapOverlayState = Record<MapOverlayLayerId, boolean>;

export const MAP_OVERLAY_LAYER_IDS: MapOverlayLayerId[] = [
  "hillshade",
  "terrain3d",
  "contours",
  "labels",
];

export const MAP_OVERLAY_LAYERS: Record<MapOverlayLayerId, MapOverlayLayerMeta> = {
  hillshade: {
    id: "hillshade",
    label: "Рельеф",
    description: "Затенение склонов — видны горы и долины на любой подложке",
    attribution: "© Mapzen · AWS Open Data",
  },
  terrain3d: {
    id: "terrain3d",
    label: "3D-рельеф",
    description: "Объёмная модель местности — наклоните карту для обзора",
    attribution: "© Mapzen · AWS Open Data",
  },
  contours: {
    id: "contours",
    label: "Изолинии",
    description: "Топографический слой с высотами поверх текущей карты",
    attribution: "© OpenTopoMap · OpenStreetMap",
  },
  labels: {
    id: "labels",
    label: "Подписи",
    description: "Названия городов и дорог — удобно на спутниковой подложке",
    attribution: "© CARTO · OpenStreetMap",
  },
};

export const DEFAULT_MAP_OVERLAY_STATE: MapOverlayState = {
  hillshade: false,
  terrain3d: false,
  contours: false,
  labels: false,
};

/** Global Terrarium DEM tiles (Mapzen on AWS Open Data). */
export const MAP_DEM_TILES = [
  "https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png",
] as const;

export const MAP_DEM_ATTRIBUTION = "© Mapzen · AWS Open Data";

export const MAP_LABELS_OVERLAY_TILES = [
  "https://basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}@2x.png",
] as const;

export const MAP_TOPO_OVERLAY_TILES = ["https://tile.opentopomap.org/{z}/{x}/{y}.png"] as const;

function isMapOverlayLayerId(value: string): value is MapOverlayLayerId {
  return value in MAP_OVERLAY_LAYERS;
}

export function parseMapOverlayLayers(raw: string | null): MapOverlayState {
  const state: MapOverlayState = { ...DEFAULT_MAP_OVERLAY_STATE };
  if (!raw?.trim()) return state;

  for (const part of raw.split(",")) {
    const id = part.trim().toLowerCase();
    if (isMapOverlayLayerId(id)) state[id] = true;
  }
  return state;
}

export function serializeMapOverlayLayers(state: MapOverlayState): string {
  return MAP_OVERLAY_LAYER_IDS.filter((id) => state[id]).join(",");
}

export function toggleMapOverlayLayer(
  state: MapOverlayState,
  layerId: MapOverlayLayerId
): MapOverlayState {
  return { ...state, [layerId]: !state[layerId] };
}

export function collectMapOverlayAttributions(state: MapOverlayState): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const id of MAP_OVERLAY_LAYER_IDS) {
    if (!state[id]) continue;
    const attr = MAP_OVERLAY_LAYERS[id].attribution;
    if (!attr || seen.has(attr)) continue;
    seen.add(attr);
    result.push(attr);
  }
  return result;
}
