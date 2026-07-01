export type MapBasemapThemeId = "tourist" | "light" | "nature" | "satellite" | "contrast";

export interface MapBasemapTheme {
  id: MapBasemapThemeId;
  label: string;
  description: string;
  tiles: string[];
  attribution: string;
  backgroundColor: string;
}

export const MAP_BASEMAP_THEMES: Record<MapBasemapThemeId, MapBasemapTheme> = {
  tourist: {
    id: "tourist",
    label: "Туристическая",
    description: "Яркая карта с подписями — удобна для планирования маршрута",
    tiles: ["https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png"],
    attribution: "© OpenStreetMap · © CARTO",
    backgroundColor: "#e8eef4",
  },
  light: {
    id: "light",
    label: "Светлая",
    description: "Минималистичная светлая подложка — маркеры читаются лучше",
    tiles: ["https://basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}@2x.png"],
    attribution: "© OpenStreetMap · © CARTO",
    backgroundColor: "#f1f5f9",
  },
  nature: {
    id: "nature",
    label: "Природа",
    description: "Рельеф и зелёные зоны — для парков и активного отдыха",
    tiles: ["https://tile.opentopomap.org/{z}/{x}/{y}.png"],
    attribution: "© OpenStreetMap · © OpenTopoMap",
    backgroundColor: "#e5ebe0",
  },
  satellite: {
    id: "satellite",
    label: "Спутник",
    description: "Спутниковые снимки — ландшафт и застройка как на фото",
    tiles: [
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ],
    attribution: "© Esri · © Maxar · © OpenStreetMap",
    backgroundColor: "#1c1917",
  },
  contrast: {
    id: "contrast",
    label: "Контрастная",
    description: "Тёмная подложка — акцент на метках и маршрутах",
    tiles: ["https://basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}@2x.png"],
    attribution: "© OpenStreetMap · © CARTO",
    backgroundColor: "#1e293b",
  },
};

export const DEFAULT_MAP_BASEMAP_THEME: MapBasemapThemeId = "tourist";

export const MAP_BASEMAP_THEME_IDS = Object.keys(MAP_BASEMAP_THEMES) as MapBasemapThemeId[];

export function isMapBasemapThemeId(value: string): value is MapBasemapThemeId {
  return value in MAP_BASEMAP_THEMES;
}

export function parseMapBasemapTheme(raw: string | null): MapBasemapThemeId {
  const normalized = raw?.trim().toLowerCase();
  if (normalized && isMapBasemapThemeId(normalized)) return normalized;
  return DEFAULT_MAP_BASEMAP_THEME;
}
