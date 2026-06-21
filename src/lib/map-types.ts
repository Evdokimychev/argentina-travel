export const MAP_LAYER_IDS = ["tours", "places", "regions", "routes"] as const;

export type MapLayerId = (typeof MAP_LAYER_IDS)[number];

/** User-facing marker categories on /mapa-argentina */
export const MAP_MARKER_KINDS = [
  "city",
  "national_park",
  "attraction",
  "tour",
  "airport",
  "route",
  "region",
  "transport",
] as const;

export type MapMarkerKind = (typeof MAP_MARKER_KINDS)[number];

export const MAP_MARKER_KIND_LABELS: Record<MapMarkerKind, string> = {
  city: "Города",
  national_park: "Национальные парки",
  attraction: "Достопримечательности",
  tour: "Экскурсии",
  airport: "Аэропорты",
  route: "Маршруты",
  region: "Регионы",
  transport: "Как добраться",
};

export interface MapRelatedLink {
  title: string;
  href: string;
  image?: string;
}

export interface MapObject {
  id: string;
  slug: string;
  kind: MapMarkerKind;
  title: string;
  description?: string;
  image?: string;
  latitude: number;
  longitude: number;
  region: string;
  href: string;
  meta?: string;
  relatedArticles?: MapRelatedLink[];
  relatedTours?: MapRelatedLink[];
}

export interface MapTourPoint {
  id: string;
  slug: string;
  title: string;
  image: string;
  latitude: number;
  longitude: number;
  destination: string;
  region: string;
  priceUsd: number;
  durationDays: number;
  featured?: boolean;
}

export interface MapPlacePoint {
  id: string;
  slug: string;
  name: string;
  coverImage?: string;
  latitude: number;
  longitude: number;
  region: string;
  category: string;
}

export interface MapRoutePoint {
  lat: number;
  lng: number;
  name: string;
}

export interface MapRouteItem {
  slug: string;
  title: string;
  image: string;
  points: MapRoutePoint[];
}

export interface MapLayersPayload {
  tours: MapTourPoint[];
  places: MapPlacePoint[];
  routes: MapRouteItem[];
  totals: {
    tours: number;
    places: number;
    routes: number;
  };
}

export interface MapObjectsPayload {
  objects: MapObject[];
  routes: MapRouteItem[];
  totals: Partial<Record<MapMarkerKind, number>>;
}

export interface MapRegionFeatureProperties {
  id: string;
  slug: string;
  nameRu: string;
  macroRegionRu?: string;
}
