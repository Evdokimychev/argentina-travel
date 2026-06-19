export const MAP_LAYER_IDS = ["tours", "places", "regions", "routes"] as const;

export type MapLayerId = (typeof MAP_LAYER_IDS)[number];

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

export interface MapRegionFeatureProperties {
  id: string;
  slug: string;
  nameRu: string;
  macroRegionRu?: string;
}
