export const PLACE_CATEGORIES = [
  "national_park",
  "waterfall",
  "glacier",
  "lake",
  "mountain",
  "trekking",
  "city",
  "town",
  "beach",
  "winery",
  "museum",
  "historic",
  "viewpoint",
  "reserve",
  "wildlife",
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORIES)[number];

export const PLACE_CATEGORY_LABELS: Record<PlaceCategory, string> = {
  national_park: "Национальный парк",
  waterfall: "Водопад",
  glacier: "Ледник",
  lake: "Озеро",
  mountain: "Гора",
  trekking: "Треккинг",
  city: "Город",
  town: "Посёлок",
  beach: "Пляж",
  winery: "Винодельня",
  museum: "Музей",
  historic: "Историческое место",
  viewpoint: "Смотровая площадка",
  reserve: "Заповедник",
  wildlife: "Дикая природа",
};

export type PlaceSource =
  | "manual"
  | "openstreetmap"
  | "overpass"
  | "wikimedia"
  | "wikipedia"
  | "wikidata"
  | "geonames";

export type PlaceRelationType = "geographic" | "tag" | "category" | "region" | "distance";

export type PlaceFaqItem = {
  question: string;
  answer: string;
};

export interface PlaceListing {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  category: PlaceCategory;
  region: string;
  province?: string;
  city?: string;
  latitude: number;
  longitude: number;
  coverImage?: string;
  tags: string[];
  rating?: number;
  visitDuration?: string;
  season?: string;
  ticketPrice?: string;
  popularity: number;
}

export interface PlaceDetail extends PlaceListing {
  fullDescription: string;
  gallery: string[];
  website?: string;
  source: PlaceSource;
  relatedPlaces: PlaceListing[];
  collections: PlaceCollectionRef[];
  itineraryReferences: PlaceItineraryRef[];
  /** Расширенный контент (опционально, из enrichment или CMS) */
  history?: string;
  interestingFacts?: string[];
  howToGetThere?: string;
  nearbyHighlights?: string[];
  faq?: PlaceFaqItem[];
}

export interface PlaceCollectionRef {
  slug: string;
  title: string;
  coverImage?: string;
}

export interface PlaceItineraryRef {
  slug: string;
  title: string;
  durationDays: number;
  coverImage?: string;
}

export interface PlaceRelation {
  place: PlaceListing;
  type: PlaceRelationType;
  score: number;
  distanceKm?: number;
  reason?: string;
}

export interface PlaceCollection {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImage?: string;
  tags: string[];
  places: PlaceListing[];
}

export interface ItineraryStop {
  id: string;
  dayNumber: number;
  sortOrder: number;
  title: string;
  description?: string;
  note?: string;
  place?: PlaceListing;
}

export interface PlaceItinerary {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImage?: string;
  durationDays: number;
  season?: string;
  difficulty?: string;
  tags: string[];
  stops: ItineraryStop[];
}

export type PlaceSortOption = "popular" | "rating" | "name_asc" | "name_desc";

export interface PlaceCatalogFilters {
  query: string;
  category: PlaceCategory | "";
  region: string;
  province: string;
  season: string;
  tag: string;
  sort: PlaceSortOption;
}
