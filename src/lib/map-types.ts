export const MAP_LAYER_IDS = ["tours", "places", "regions", "routes"] as const;

export type MapLayerId = (typeof MAP_LAYER_IDS)[number];

/** User-facing marker categories on /mapa-argentina */
export const MAP_MARKER_KINDS = [
  "city",
  "national_park",
  "attraction",
  "tour",
  "excursion",
  "airport",
  "route",
  "region",
  "transport",
] as const;

export type MapMarkerKind = (typeof MAP_MARKER_KINDS)[number];

export const MAP_DISCOVERY_MODES = [
  "highlights",
  "things_to_do",
  "nature",
  "culture",
  "getting_around",
  "all",
] as const;

export type MapDiscoveryMode = (typeof MAP_DISCOVERY_MODES)[number];

export const MAP_MARKER_KIND_LABELS: Record<MapMarkerKind, string> = {
  city: "Города",
  national_park: "Национальные парки",
  attraction: "Достопримечательности",
  tour: "Туры",
  excursion: "Экскурсии",
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

/** Направление прямого рейса из аэропорта (для карточки аэропорта на карте). */
export interface MapFlightDestination {
  iata: string;
  city: string;
  airportName: string;
  latitude: number;
  longitude: number;
  /** id объекта-аэропорта на карте, чтобы перейти к нему по клику */
  mapObjectId: string;
  service: "regular" | "seasonal_or_limited";
  durationMinutes?: number;
  airlines?: string[];
  frequencyNote?: string;
  verifiedAt: string;
  sourceUrl: string;
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
  importance?: number;
  featured?: boolean;
  editorialPriority?: number;
  qualityScore?: number;
  source?: string;
  sourceUrl?: string;
  sourceVerifiedAt?: string;
  minZoom?: number;
  maxZoom?: number;
  tags?: string[];
  /** Исходная категория места: ледник, винодельня, музей и т. п. */
  category?: string;
  /** Редакционная популярность 0–100, если она есть в каталоге мест. */
  popularity?: number;
  status?: "published" | "hidden" | "needs_review";
  curatorNote?: string;
  airportDetails?: {
    iata: string;
    city: string;
    role: string;
    domesticRoutes: number;
    internationalNote: string;
    seasonalityNote: string;
  };
  /** Только для kind === "airport": куда можно улететь прямым рейсом */
  flightDestinations?: MapFlightDestination[];
}

export function formatMapObjectListSubtitle(
  object: Pick<MapObject, "region" | "meta" | "kind">,
): string {
  const region = object.region.trim();
  const meta = object.meta?.trim();
  if (!meta || meta.localeCompare(region, "ru", { sensitivity: "base" }) === 0) {
    return region || MAP_MARKER_KIND_LABELS[object.kind];
  }
  return region ? `${region} · ${meta}` : meta;
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
