import type { MapThematicLayerId } from "@/lib/map-thematic-layers";
import { isArgentinaProvinceIso } from "@/lib/map-geodata-sanitize";

export interface MapThematicLayerDataSpec {
  /** Файл в /geo/map/ — null если слой производный или без данных */
  dataFile: string | null;
  /** Откуда взяты границы — для атрибуции и доверия */
  source: string;
  sourceUrl?: string;
  /** Поле properties для подписи на карте */
  labelProperty: string;
  /** Поле для описания во всплывающей подсказке */
  descriptionProperty?: string;
  /** Производный слой — фильтр другого слоя */
  derivedFrom?: MapThematicLayerId;
  derivedFilter?: (properties: Record<string, unknown>) => boolean;
  /** Производный слой — трансформация родительской коллекции */
  derivedTransform?: "popular_regions" | "glacier_zones";
}

/** Реестр геоданных: только реальные источники, без схематичных заглушек. */
export const MAP_THEMATIC_DATA_REGISTRY: Record<MapThematicLayerId, MapThematicLayerDataSpec> = {
  argentina_border: {
    dataFile: null,
    source: "OpenStreetMap — заливка по провинциям (admin_level=4)",
    sourceUrl: "https://www.openstreetmap.org",
    labelProperty: "name",
    derivedFrom: "provinces",
    derivedFilter: (p) => isArgentinaProvinceIso(p),
  },
  provinces: {
    dataFile: "provinces.geojson",
    source: "OpenStreetMap — провинции (admin_level=4)",
    sourceUrl: "https://www.openstreetmap.org",
    labelProperty: "nameRu",
    descriptionProperty: "macroRegionRu",
  },
  patagonia: {
    dataFile: "patagonia.geojson",
    source: "OpenStreetMap — провинции Патагонии",
    labelProperty: "nameRu",
  },
  ba_neighborhoods: {
    dataFile: "ba-neighborhoods.geojson",
    source: "OpenStreetMap — 48 barrios CABA",
    sourceUrl: "https://www.openstreetmap.org",
    labelProperty: "nameRu",
    descriptionProperty: "description",
  },
  ba_recommended: {
    dataFile: null,
    source: "OpenStreetMap barrios — рекомендуемые для проживания",
    labelProperty: "nameRu",
    descriptionProperty: "description",
    derivedFrom: "ba_neighborhoods",
    derivedFilter: (p) => p.recommendedForStay === true || p.recommended === true,
  },
  national_parks_area: {
    dataFile: "national-parks.geojson",
    source: "OpenStreetMap — protected_area (национальные парки)",
    sourceUrl: "https://www.openstreetmap.org",
    labelProperty: "name",
    descriptionProperty: "category",
  },
  wine_regions: {
    dataFile: "wine-regions.geojson",
    source: "OpenStreetMap — винные провинции",
    labelProperty: "nameRu",
  },
  whale_watching: {
    dataFile: "whale-watching.geojson",
    source: "OpenStreetMap — Península Valdés",
    sourceUrl: "https://www.openstreetmap.org",
    labelProperty: "name",
  },
  unesco: {
    dataFile: "unesco-sites.geojson",
    source: "OpenStreetMap — объекты Всемирного наследия ЮНЕСКО",
    sourceUrl: "https://www.openstreetmap.org",
    labelProperty: "name",
    descriptionProperty: "category",
  },
  ruta_40: {
    dataFile: "ruta-40.geojson",
    source: "OpenStreetMap — RN 40",
    sourceUrl: "https://www.openstreetmap.org",
    labelProperty: "name",
  },
  ruta_3: {
    dataFile: "ruta-3.geojson",
    source: "OSRM / OpenStreetMap — RN 3",
    sourceUrl: "https://www.openstreetmap.org",
    labelProperty: "name",
    descriptionProperty: "description",
  },
  panamericana: {
    dataFile: "panamericana.geojson",
    source: "OSRM / OpenStreetMap — Panamericana (RN 9, RN 34)",
    sourceUrl: "https://www.openstreetmap.org",
    labelProperty: "name",
    descriptionProperty: "description",
  },
  scenic_routes: {
    dataFile: "scenic-routes.geojson",
    source: "OSRM / OpenStreetMap — rutas turísticas",
    sourceUrl: "https://www.openstreetmap.org",
    labelProperty: "name",
    descriptionProperty: "description",
  },
  patagonia_routes: {
    dataFile: "patagonia-routes.geojson",
    source: "OSM Ruta 40 + OSRM — маршруты Патагонии",
    sourceUrl: "https://www.openstreetmap.org",
    labelProperty: "name",
  },
  climate_zones: {
    dataFile: "climate-zones.geojson",
    source: "Климатические макрорегионы — упрощённая схема проекта",
    labelProperty: "name",
    descriptionProperty: "description",
  },
  biosphere: {
    dataFile: "biosphere-reserves.geojson",
    source: "UNESCO MAB — упрощённые зоны биосферных резерватов",
    labelProperty: "name",
    descriptionProperty: "description",
  },
  beaches: {
    dataFile: "beach-zones.geojson",
    source: "Атлантические курорты — упрощённые зоны проекта",
    labelProperty: "name",
    descriptionProperty: "description",
  },
  glacier_zones: {
    dataFile: null,
    source: "OpenStreetMap — нацпарки с ледниковыми ландшафтами",
    labelProperty: "name",
    descriptionProperty: "description",
    derivedFrom: "national_parks_area",
    derivedTransform: "glacier_zones",
  },
  popular_regions: {
    dataFile: null,
    source: "OpenStreetMap — макрорегионы по провинциям",
    labelProperty: "name",
    descriptionProperty: "description",
    derivedFrom: "provinces",
    derivedTransform: "popular_regions",
  },
  ski_resorts: {
    dataFile: "ski-resorts.geojson",
    source: "Горнолыжные центры — координаты курортов",
    labelProperty: "name",
    descriptionProperty: "region",
  },
};

export const MAP_GEODATA_BASE_PATH = "/geo/map";

export function getThematicLayerDataUrl(layerId: MapThematicLayerId): string | null {
  const spec = MAP_THEMATIC_DATA_REGISTRY[layerId];
  if (!spec.dataFile) return null;
  return `${MAP_GEODATA_BASE_PATH}/${spec.dataFile}`;
}
