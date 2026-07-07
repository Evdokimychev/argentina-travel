import type { FeatureCollection } from "geojson";

/** Тематические слои карты — независимы от меток объектов. */
export const MAP_THEMATIC_LAYER_IDS = [
  "argentina_border",
  "patagonia",
  "climate_zones",
  "provinces",
  "popular_regions",
  "ba_neighborhoods",
  "ba_recommended",
  "national_parks_area",
  "wine_regions",
  "ruta_40",
  "ruta_3",
  "panamericana",
  "scenic_routes",
  "beaches",
  "ski_resorts",
  "whale_watching",
  "glacier_zones",
  "unesco",
  "biosphere",
  "patagonia_routes",
] as const;

export type MapThematicLayerId = (typeof MAP_THEMATIC_LAYER_IDS)[number];

export type MapThematicLayerKind = "fill" | "line" | "circle";

export interface MapThematicLayerMeta {
  id: MapThematicLayerId;
  label: string;
  description: string;
  group: MapThematicLayerGroup;
  kind: MapThematicLayerKind;
  fillColor?: string;
  fillOpacity?: number;
  lineColor?: string;
  lineWidth?: number;
  lineDash?: number[];
  /** Рисовать контур (мягкий) — для заливки страны отключено */
  showOutline?: boolean;
  /** Подсветка «рекомендуем» — другой оттенок */
  highlight?: boolean;
}

export type MapThematicLayerGroup =
  | "borders"
  | "regions"
  | "climate"
  | "cities"
  | "nature"
  | "routes"
  | "culture";

export const MAP_THEMATIC_GROUP_LABELS: Record<MapThematicLayerGroup, string> = {
  borders: "Границы",
  regions: "Регионы",
  climate: "Климат",
  cities: "Буэнос-Айрес",
  nature: "Природа",
  routes: "Маршруты",
  culture: "Культура",
};

export type MapThematicState = Record<MapThematicLayerId, boolean>;

export const DEFAULT_MAP_THEMATIC_STATE: MapThematicState = Object.fromEntries(
  MAP_THEMATIC_LAYER_IDS.map((id) => [id, false])
) as MapThematicState;

export const MAP_THEMATIC_LAYERS: Record<MapThematicLayerId, MapThematicLayerMeta> = {
  argentina_border: {
    id: "argentina_border",
    label: "Границы Аргентины",
    description: "Территория страны — общая заливка без деления на провинции",
    group: "borders",
    kind: "fill",
    fillColor: "#0369a1",
    fillOpacity: 0.06,
    showOutline: false,
  },
  patagonia: {
    id: "patagonia",
    label: "Патагония",
    description: "Южный туристический макрорегион",
    group: "regions",
    kind: "fill",
    fillColor: "#0369a1",
    fillOpacity: 0.09,
    lineColor: "#0284c7",
    lineWidth: 0.85,
    showOutline: false,
  },
  climate_zones: {
    id: "climate_zones",
    label: "Климатические зоны",
    description: "Основные климатические макрорегионы",
    group: "climate",
    kind: "fill",
    fillOpacity: 0.22,
  },
  provinces: {
    id: "provinces",
    label: "Провинции",
    description: "Административные регионы Аргентины",
    group: "regions",
    kind: "fill",
    fillColor: "#64748b",
    fillOpacity: 0.07,
    lineColor: "#475569",
    lineWidth: 0.85,
    showOutline: false,
  },
  popular_regions: {
    id: "popular_regions",
    label: "Популярные регионы",
    description: "Самые посещаемые туристические зоны",
    group: "regions",
    kind: "fill",
    fillColor: "#f59e0b",
    fillOpacity: 0.15,
    lineColor: "#d97706",
    lineWidth: 1.5,
  },
  ba_neighborhoods: {
    id: "ba_neighborhoods",
    label: "Районы Буэнос-Айреса",
    description: "Все 48 barrios CABA — границы OpenStreetMap",
    group: "cities",
    kind: "fill",
    fillColor: "#8b5cf6",
    fillOpacity: 0.1,
    lineColor: "#7c3aed",
    lineWidth: 0.65,
    showOutline: true,
  },
  ba_recommended: {
    id: "ba_recommended",
    label: "Рекомендуем для проживания",
    description: "Палермо, Реколета, Бельграно и другие — для туристов и релокации",
    group: "cities",
    kind: "fill",
    fillColor: "#22c55e",
    fillOpacity: 0.16,
    lineColor: "#16a34a",
    lineWidth: 0.85,
    highlight: true,
    showOutline: true,
  },
  national_parks_area: {
    id: "national_parks_area",
    label: "Нацпарки (территории)",
    description: "Границы национальных парков",
    group: "nature",
    kind: "fill",
    fillColor: "#15803d",
    fillOpacity: 0.12,
    lineColor: "#166534",
    lineWidth: 0.75,
  },
  wine_regions: {
    id: "wine_regions",
    label: "Винодельческие регионы",
    description: "Мендоса, Кафаяте, Сан-Хуан и др.",
    group: "culture",
    kind: "fill",
    fillColor: "#7f1d1d",
    fillOpacity: 0.1,
    lineColor: "#991b1b",
    lineWidth: 0.85,
    showOutline: false,
  },
  ruta_40: {
    id: "ruta_40",
    label: "Ruta 40",
    description: "Легендарная автомагистраль вдоль Анд (OSM)",
    group: "routes",
    kind: "line",
    lineColor: "#dc2626",
    lineWidth: 2.5,
    lineDash: [2, 1],
  },
  ruta_3: {
    id: "ruta_3",
    label: "Ruta 3",
    description: "Атлантическое побережье — от Буэнос-Айреса до Огненной Земли",
    group: "routes",
    kind: "line",
    lineColor: "#0d9488",
    lineWidth: 2.5,
    lineDash: [1.5, 1],
  },
  panamericana: {
    id: "panamericana",
    label: "Panamericana",
    description: "Pan-American Highway — Ruta 9, Ruta 34 и ключевые участки",
    group: "routes",
    kind: "line",
    lineColor: "#9333ea",
    lineWidth: 2.5,
  },
  scenic_routes: {
    id: "scenic_routes",
    label: "Живописные дороги",
    description: "Siete Lagos, RN 237, винная RN 68",
    group: "routes",
    kind: "line",
    lineColor: "#ea580c",
    lineWidth: 2,
  },
  beaches: {
    id: "beaches",
    label: "Пляжные зоны",
    description: "Мар-дель-Плата, Pinamar, Атлантика",
    group: "nature",
    kind: "fill",
    fillColor: "#38bdf8",
    fillOpacity: 0.22,
    lineColor: "#0ea5e9",
    lineWidth: 1,
  },
  ski_resorts: {
    id: "ski_resorts",
    label: "Горнолыжные курорты",
    description: "Барилоче, Лас-Леньяс, Кавiahue",
    group: "nature",
    kind: "circle",
    fillColor: "#6366f1",
    fillOpacity: 0.85,
    lineColor: "#4338ca",
    lineWidth: 2,
  },
  whale_watching: {
    id: "whale_watching",
    label: "Наблюдение за китами",
    description: "Полуостров Вальдес и заливы",
    group: "nature",
    kind: "fill",
    fillColor: "#0891b2",
    fillOpacity: 0.11,
    lineColor: "#0e7490",
    lineWidth: 0.75,
  },
  glacier_zones: {
    id: "glacier_zones",
    label: "Зоны ледников",
    description: "Патагония — ледниковые массивы",
    group: "nature",
    kind: "fill",
    fillColor: "#bae6fd",
    fillOpacity: 0.35,
    lineColor: "#7dd3fc",
    lineWidth: 1,
  },
  unesco: {
    id: "unesco",
    label: "Объекты ЮНЕСКО",
    description: "Всемирное наследие в Аргентине",
    group: "culture",
    kind: "circle",
    fillColor: "#ca8a04",
    fillOpacity: 0.85,
    lineColor: "#a16207",
    lineWidth: 1.5,
  },
  biosphere: {
    id: "biosphere",
    label: "Биосферные резерваты",
    description: "Резерваты UNESCO «Человек и биосфера»",
    group: "nature",
    kind: "fill",
    fillColor: "#86efac",
    fillOpacity: 0.18,
    lineColor: "#16a34a",
    lineWidth: 0.75,
  },
  patagonia_routes: {
    id: "patagonia_routes",
    label: "Маршруты по Патагонии",
    description: "Классические автомобильные маршруты",
    group: "routes",
    kind: "line",
    lineColor: "#2563eb",
    lineWidth: 2,
    lineDash: [1.5, 1],
  },
};

function isMapThematicLayerId(value: string): value is MapThematicLayerId {
  return value in MAP_THEMATIC_LAYERS;
}

export function parseMapThematicLayers(raw: string | null): MapThematicState {
  const state: MapThematicState = { ...DEFAULT_MAP_THEMATIC_STATE };
  if (!raw?.trim()) return state;
  for (const part of raw.split(",")) {
    const id = part.trim().toLowerCase();
    if (isMapThematicLayerId(id)) state[id] = true;
  }
  return state;
}

export function serializeMapThematicLayers(state: MapThematicState): string {
  return MAP_THEMATIC_LAYER_IDS.filter((id) => state[id]).join(",");
}

/** Слои с административными границами — только один активен (фильтр). */
export const EXCLUSIVE_ADMIN_BOUNDARY_LAYERS: MapThematicLayerId[] = [
  "argentina_border",
  "provinces",
  "patagonia",
];

export function toggleMapThematicLayer(
  state: MapThematicState,
  layerId: MapThematicLayerId
): MapThematicState {
  const turningOn = !state[layerId];
  const next: MapThematicState = { ...state, [layerId]: !state[layerId] };
  if (turningOn && EXCLUSIVE_ADMIN_BOUNDARY_LAYERS.includes(layerId)) {
    for (const id of EXCLUSIVE_ADMIN_BOUNDARY_LAYERS) {
      if (id !== layerId) next[id] = false;
    }
  }
  return next;
}

export function getThematicLayersByGroup(): Record<
  MapThematicLayerGroup,
  MapThematicLayerMeta[]
> {
  const groups = {} as Record<MapThematicLayerGroup, MapThematicLayerMeta[]>;
  for (const group of Object.keys(MAP_THEMATIC_GROUP_LABELS) as MapThematicLayerGroup[]) {
    groups[group] = [];
  }
  for (const layer of Object.values(MAP_THEMATIC_LAYERS)) {
    groups[layer.group].push(layer);
  }
  return groups;
}

export type ThematicGeoJsonRegistry = Record<MapThematicLayerId, FeatureCollection>;
