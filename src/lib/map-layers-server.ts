import type { TourListing } from "@/types";
import type { PlaceListing } from "@/types/place";
import { resolveArgentinaCityName, resolveTourCityDisplay } from "@/lib/argentina-cities";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { fetchPlacesServer } from "@/lib/places-repository";
import { getTourRoutePoints } from "@/data/tour-routes";
import type {
  MapLayersPayload,
  MapPlacePoint,
  MapRouteItem,
  MapTourPoint,
} from "@/lib/map-types";

const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

export interface MapLayersQuery {
  bbox?: [number, number, number, number] | null;
  city?: string;
  category?: string;
  limit?: number;
  includeTours?: boolean;
  includePlaces?: boolean;
  includeRoutes?: boolean;
}

function clampLimit(value: number | undefined): number {
  if (!value || Number.isNaN(value)) return DEFAULT_LIMIT;
  return Math.min(Math.max(1, Math.floor(value)), MAX_LIMIT);
}

export function parseMapLayersBbox(raw: string | null): [number, number, number, number] | null {
  if (!raw?.trim()) return null;
  const parts = raw.split(",").map((part) => Number(part.trim()));
  if (parts.length !== 4 || parts.some((value) => Number.isNaN(value))) return null;
  const [minLat, minLng, maxLat, maxLng] = parts;
  if (minLat > maxLat || minLng > maxLng) return null;
  return [minLat, minLng, maxLat, maxLng];
}

function inBbox(
  lat: number,
  lng: number,
  bbox: [number, number, number, number] | null | undefined
): boolean {
  if (!bbox) return true;
  const [minLat, minLng, maxLat, maxLng] = bbox;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

function serializeTourPoint(tour: TourListing): MapTourPoint {
  return {
    id: tour.id,
    slug: tour.slug,
    title: tour.title,
    image: tour.image,
    latitude: tour.latitude,
    longitude: tour.longitude,
    destination: resolveTourCityDisplay(tour),
    region: tour.region,
    priceUsd: tour.priceUsd,
    durationDays: tour.durationDays,
    featured: tour.featured,
  };
}

function serializePlacePoint(place: PlaceListing): MapPlacePoint {
  return {
    id: place.id,
    slug: place.slug,
    name: place.name,
    coverImage: place.coverImage,
    latitude: place.latitude,
    longitude: place.longitude,
    region: place.region,
    category: place.category,
  };
}

function matchesCityFilter(value: string, city: string): boolean {
  const needle = city.trim().toLowerCase();
  if (!needle) return true;
  return value.toLowerCase().includes(needle);
}

function filterTours(tours: TourListing[], query: MapLayersQuery): TourListing[] {
  return tours.filter((tour) => {
    if (!inBbox(tour.latitude, tour.longitude, query.bbox)) return false;
    if (query.city) {
      const cityName = resolveArgentinaCityName(tour.destination || tour.region);
      const haystack = `${cityName} ${tour.destination} ${tour.region}`.toLowerCase();
      if (!haystack.includes(query.city.trim().toLowerCase())) return false;
    }
    return true;
  });
}

function filterPlaces(places: PlaceListing[], query: MapLayersQuery): PlaceListing[] {
  return places.filter((place) => {
    if (!inBbox(place.latitude, place.longitude, query.bbox)) return false;
    if (query.category && place.category !== query.category) return false;
    if (query.city) {
      const haystack = `${place.name} ${place.region} ${place.city ?? ""}`.toLowerCase();
      if (!matchesCityFilter(haystack, query.city)) return false;
    }
    return true;
  });
}

function buildRouteItems(tours: TourListing[], query: MapLayersQuery): MapRouteItem[] {
  const routes: MapRouteItem[] = [];

  for (const tour of tours) {
    const points = getTourRoutePoints(tour.slug);
    if (points.length < 2) continue;

    const visiblePoints = points.filter((point) => inBbox(point.lat, point.lng, query.bbox));
    if (query.bbox && visiblePoints.length === 0) continue;

    routes.push({
      slug: tour.slug,
      title: tour.title,
      image: tour.image,
      points: points.map((point) => ({
        lat: point.lat,
        lng: point.lng,
        name: point.name,
      })),
    });
  }

  return routes;
}

export async function fetchMapLayers(query: MapLayersQuery = {}): Promise<MapLayersPayload> {
  const limit = clampLimit(query.limit);
  const [allTours, allPlaces] = await Promise.all([
    fetchMarketplaceTours(),
    fetchPlacesServer(),
  ]);

  const filteredTours = filterTours(allTours, query);
  const filteredPlaces = filterPlaces(allPlaces, query);
  const routes = query.includeRoutes === false ? [] : buildRouteItems(filteredTours, query);

  const tours =
    query.includeTours === false ? [] : filteredTours.slice(0, limit).map(serializeTourPoint);
  const places =
    query.includePlaces === false ? [] : filteredPlaces.slice(0, limit).map(serializePlacePoint);

  return {
    tours,
    places,
    routes: routes.slice(0, Math.min(limit, 50)),
    totals: {
      tours: filteredTours.length,
      places: filteredPlaces.length,
      routes: routes.length,
    },
  };
}

export async function fetchFeaturedMapTours(limit = 8): Promise<MapTourPoint[]> {
  const tours = await fetchMarketplaceTours();
  const featured = tours.filter((tour) => tour.featured);
  const source = featured.length > 0 ? featured : tours.slice(0, limit);
  return source.slice(0, limit).map(serializeTourPoint);
}
