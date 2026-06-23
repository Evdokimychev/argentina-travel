import type { TourListing } from "@/types";
import type { PlaceCategory, PlaceListing } from "@/types/place";
import { ARGENTINA_AIRPORTS } from "@/data/argentina-airports";
import { ARGENTINA_TRANSPORT_HUBS } from "@/data/argentina-transport-hubs";
import { TOUR_PLACE_MAP } from "@/data/media-library/maps";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { getTourRoutePoints } from "@/data/tour-routes";
import { resolveTourCityDisplay } from "@/lib/argentina-cities";
import { hasValidTourMapCoordinates } from "@/lib/tour-map";
import { fetchPlacesServer, placeHref } from "@/lib/places-repository";
import type {
  MapMarkerKind,
  MapObject,
  MapObjectsPayload,
  MapRouteItem,
} from "@/lib/map-types";

const DEFAULT_LIMIT = 300;

export interface MapObjectsQuery {
  kinds?: MapMarkerKind[];
  bbox?: [number, number, number, number] | null;
  city?: string;
  q?: string;
  limit?: number;
}

function placeKind(category: PlaceCategory): MapMarkerKind {
  if (category === "city" || category === "town") return "city";
  if (category === "national_park") return "national_park";
  return "attraction";
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

function matchesQuery(text: string, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return text.toLowerCase().includes(needle);
}

function matchesCityFilter(haystack: string, city: string): boolean {
  const needle = city.trim().toLowerCase();
  if (!needle) return true;
  return haystack.toLowerCase().includes(needle);
}

function relatedToursForPlace(placeSlug: string, tours: TourListing[]): MapObject["relatedTours"] {
  const slugs = Object.entries(TOUR_PLACE_MAP)
    .filter(([, slug]) => slug === placeSlug)
    .map(([tourSlug]) => tourSlug);

  return tours
    .filter((tour) => slugs.includes(tour.slug))
    .slice(0, 4)
    .map((tour) => ({
      title: tour.title,
      href: `/tours/${tour.slug}`,
      image: tour.image,
    }));
}

function placeToMapObject(place: PlaceListing, tours: TourListing[]): MapObject {
  const kind = placeKind(place.category);
  return {
    id: `place:${place.id}`,
    slug: place.slug,
    kind,
    title: place.name,
    description: place.shortDescription,
    image: place.coverImage,
    latitude: place.latitude,
    longitude: place.longitude,
    region: place.region,
    href: placeHref(place.slug),
    meta: place.city ?? place.region,
    relatedTours: relatedToursForPlace(place.slug, tours),
    relatedArticles: [{ title: "Места на карте", href: `/places/${place.slug}` }],
  };
}

function tourToMapObject(tour: TourListing): MapObject {
  return {
    id: `tour:${tour.id}`,
    slug: tour.slug,
    kind: "tour",
    title: tour.title,
    description: `${resolveTourCityDisplay(tour)} · ${tour.durationDays} дн.`,
    image: tour.image,
    latitude: tour.latitude,
    longitude: tour.longitude,
    region: tour.region,
    href: `/tours/${tour.slug}`,
    meta: resolveTourCityDisplay(tour),
  };
}

function airportToMapObject(airport: (typeof ARGENTINA_AIRPORTS)[number]): MapObject {
  return {
    id: airport.id,
    slug: airport.slug,
    kind: "airport",
    title: airport.name,
    description: airport.description,
    latitude: airport.latitude,
    longitude: airport.longitude,
    region: airport.region,
    href: `/mapa-argentina?kind=airport&q=${encodeURIComponent(airport.iata)}`,
    meta: `${airport.iata} · ${airport.city}`,
  };
}

function transportHubToMapObject(hub: (typeof ARGENTINA_TRANSPORT_HUBS)[number]): MapObject {
  return {
    id: hub.id,
    slug: hub.slug,
    kind: "transport",
    title: hub.name,
    description: hub.description,
    latitude: hub.latitude,
    longitude: hub.longitude,
    region: hub.region,
    href: hub.placeSlug ? placeHref(hub.placeSlug) : `/destinations/${hub.citySlug}`,
    meta: hub.cityName,
    relatedArticles: hub.placeSlug
      ? [{ title: `Как добраться в ${hub.cityName}`, href: placeHref(hub.placeSlug) }]
      : undefined,
  };
}

function buildRouteItems(tours: TourListing[], query: MapObjectsQuery): MapRouteItem[] {
  const routes: MapRouteItem[] = [];
  for (const tour of tours) {
    const points = getTourRoutePoints(tour.slug);
    if (points.length < 2) continue;
    if (query.bbox && !points.some((p) => inBbox(p.lat, p.lng, query.bbox))) continue;
    routes.push({
      slug: tour.slug,
      title: tour.title,
      image: tour.image,
      points: points.map((p) => ({ lat: p.lat, lng: p.lng, name: p.name })),
    });
  }
  return routes;
}

function filterObject(obj: MapObject, query: MapObjectsQuery): boolean {
  if (!inBbox(obj.latitude, obj.longitude, query.bbox)) return false;
  if (query.kinds?.length && !query.kinds.includes(obj.kind)) return false;
  if (query.city) {
    const haystack = `${obj.title} ${obj.region} ${obj.meta ?? ""}`;
    if (!matchesCityFilter(haystack, query.city)) return false;
  }
  if (query.q) {
    const haystack = `${obj.title} ${obj.description ?? ""} ${obj.region} ${obj.meta ?? ""}`;
    if (!matchesQuery(haystack, query.q)) return false;
  }
  return true;
}

export async function fetchMapObjects(query: MapObjectsQuery = {}): Promise<MapObjectsPayload> {
  const limit = query.limit ?? DEFAULT_LIMIT;
  const activeKinds = query.kinds?.length ? query.kinds : undefined;

  const [tours, places] = await Promise.all([fetchMarketplaceTours(), fetchPlacesServer()]);

  const objects: MapObject[] = [];

  const includePlaces =
    !activeKinds ||
    activeKinds.some((k) => k === "city" || k === "national_park" || k === "attraction");
  if (includePlaces) {
    for (const place of places) {
      const obj = placeToMapObject(place, tours);
      if (activeKinds && !activeKinds.includes(obj.kind)) continue;
      objects.push(obj);
    }
  }

  if (!activeKinds || activeKinds.includes("tour")) {
    objects.push(
      ...tours
        .filter((tour) => hasValidTourMapCoordinates(tour.latitude, tour.longitude))
        .map(tourToMapObject)
    );
  }

  if (!activeKinds || activeKinds.includes("airport")) {
    objects.push(...ARGENTINA_AIRPORTS.map(airportToMapObject));
  }

  if (!activeKinds || activeKinds.includes("transport")) {
    objects.push(...ARGENTINA_TRANSPORT_HUBS.map(transportHubToMapObject));
  }

  const filtered = objects.filter((obj) => filterObject(obj, query)).slice(0, limit);

  const routes =
    !activeKinds || activeKinds.includes("route")
      ? buildRouteItems(tours, query).slice(0, 50)
      : [];

  const totals: Partial<Record<MapMarkerKind, number>> = {};
  for (const obj of filtered) {
    totals[obj.kind] = (totals[obj.kind] ?? 0) + 1;
  }
  if (routes.length) totals.route = routes.length;

  return { objects: filtered, routes, totals };
}

export function findMapObjectByQuery(
  objects: MapObject[],
  q: string
): MapObject | undefined {
  const needle = q.trim().toLowerCase();
  if (!needle) return undefined;
  return objects.find((obj) => {
    const haystack = `${obj.title} ${obj.slug} ${obj.meta ?? ""}`.toLowerCase();
    return haystack.includes(needle);
  });
}
