import type { TourListing } from "@/types";
import type { PlaceCategory, PlaceListing } from "@/types/place";
import { ARGENTINA_AIRPORTS } from "@/data/argentina-airports";
import { getFlightDestinations } from "@/data/argentina-flight-routes";
import { ARGENTINA_TRANSPORT_HUBS } from "@/data/argentina-transport-hubs";
import { TOUR_PLACE_MAP } from "@/data/media-library/maps";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { getTourRoutePoints } from "@/data/tour-routes";
import { resolveTourCityDisplay } from "@/lib/argentina-cities";
import { hasValidTourMapCoordinates } from "@/lib/tour-map";
import { fetchPlacesServer, placeHref } from "@/lib/places-repository";
import { MEDIA_LOGO_FALLBACK } from "@/lib/media-resolver";
import { findBestMapObjectMatch } from "@/lib/map-search";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { buildSupplementaryCityObjects } from "@/lib/map-supplementary-cities";
import { buildKbAttractionObjects } from "@/lib/map-kb-attractions";
import type {
  MapMarkerKind,
  MapObject,
  MapObjectsPayload,
  MapRouteItem,
} from "@/lib/map-types";

const DEFAULT_LIMIT = 240;

const MAP_SOURCE = "Редакционная база GoArgentina";
const AIRPORT_SOURCE_URL = "https://www.argentina.gob.ar/anac/catalogo-de-datos";
const AIRPORTS_VERIFIED_AT = "2026-07-14";

function mapEditorialFields(input: {
  kind: MapMarkerKind;
  featured?: boolean;
  source?: string;
  sourceUrl?: string;
  sourceVerifiedAt?: string;
}): Required<Pick<MapObject, "importance" | "featured" | "editorialPriority" | "qualityScore" | "source" | "minZoom" | "maxZoom" | "tags" | "status">> & Pick<MapObject, "sourceUrl" | "sourceVerifiedAt"> {
  const baseImportance: Record<MapMarkerKind, number> = {
    city: 90,
    national_park: 88,
    airport: 86,
    region: 82,
    attraction: 70,
    transport: 68,
    tour: 55,
    route: 50,
  };
  const minZoom: Record<MapMarkerKind, number> = {
    city: 3,
    national_park: 3,
    airport: 3,
    region: 3,
    attraction: 5,
    transport: 6,
    tour: 7,
    route: 6,
  };
  const importance = baseImportance[input.kind] + (input.featured ? 8 : 0);
  return {
    importance,
    featured: input.featured === true,
    editorialPriority: importance,
    qualityScore: input.sourceVerifiedAt ? 90 : 72,
    source: input.source ?? MAP_SOURCE,
    sourceUrl: input.sourceUrl,
    sourceVerifiedAt: input.sourceVerifiedAt,
    minZoom: minZoom[input.kind],
    maxZoom: 18,
    tags: [input.kind],
    status: "published",
  };
}

export function rankMapObjects(objects: MapObject[]): MapObject[] {
  const deduplicated = new Map<string, MapObject>();
  for (const object of objects) {
    if (object.status === "hidden") continue;
    const key = `${object.kind}:${object.slug}:${object.latitude.toFixed(4)}:${object.longitude.toFixed(4)}`;
    const current = deduplicated.get(key);
    if (!current || (object.qualityScore ?? 0) > (current.qualityScore ?? 0)) deduplicated.set(key, object);
  }
  return [...deduplicated.values()].sort(
    (left, right) =>
      Number(Boolean(right.featured)) - Number(Boolean(left.featured)) ||
      (right.editorialPriority ?? 0) - (left.editorialPriority ?? 0) ||
      (right.qualityScore ?? 0) - (left.qualityScore ?? 0) ||
      left.title.localeCompare(right.title, "ru"),
  );
}

type MapCurationRow = import("@/types/database").Database["public"]["Tables"]["map_object_curation"]["Row"];

async function loadMapCuration(): Promise<Map<string, MapCurationRow>> {
  if (!isSupabaseConfigured()) return new Map();
  try {
    const { data, error } = await createSupabaseAdminClient()
      .from("map_object_curation")
      .select("*");
    if (error) return new Map();
    return new Map((data ?? []).map((row) => [row.object_id, row]));
  } catch {
    return new Map();
  }
}

function applyMapCuration(object: MapObject, row: MapCurationRow | undefined): MapObject {
  if (!row) return object;
  return {
    ...object,
    latitude: row.latitude ?? object.latitude,
    longitude: row.longitude ?? object.longitude,
    importance: row.importance,
    featured: row.featured,
    editorialPriority: row.editorial_priority,
    qualityScore: row.quality_score,
    source: row.source ?? object.source,
    sourceUrl: row.source_url ?? object.sourceUrl,
    sourceVerifiedAt: row.source_verified_at ?? object.sourceVerifiedAt,
    minZoom: row.min_zoom,
    maxZoom: row.max_zoom,
    region: row.region ?? object.region,
    tags: row.tags,
    status: row.status,
    curatorNote: row.curator_note ?? undefined,
    relatedArticles: row.related_article_href
      ? [{ title: "Связанный материал", href: row.related_article_href }, ...(object.relatedArticles ?? [])]
      : object.relatedArticles,
    relatedTours: row.related_tour_href
      ? [{ title: "Связанный тур", href: row.related_tour_href }, ...(object.relatedTours ?? [])]
      : object.relatedTours,
  };
}

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
  // Логотип-заглушка в карточке карты выглядит хуже, чем градиент по цвету категории
  const image = place.coverImage === MEDIA_LOGO_FALLBACK ? undefined : place.coverImage;
  return {
    id: `place:${place.id}`,
    slug: place.slug,
    kind,
    title: place.name,
    description: place.shortDescription,
    image,
    latitude: place.latitude,
    longitude: place.longitude,
    region: place.region,
    href: placeHref(place.slug),
    meta: place.city ?? place.region,
    relatedTours: relatedToursForPlace(place.slug, tours),
    relatedArticles: [{ title: "Места на карте", href: `/places/${place.slug}` }],
    ...mapEditorialFields({ kind }),
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
    ...mapEditorialFields({ kind: "tour", featured: tour.featured }),
  };
}

function airportToMapObject(airport: (typeof ARGENTINA_AIRPORTS)[number]): MapObject {
  const destinations = getFlightDestinations(airport.iata).map((dest) => ({
    iata: dest.iata,
    city: dest.city,
    airportName: dest.name,
    latitude: dest.latitude,
    longitude: dest.longitude,
    mapObjectId: dest.id,
  }));

  return {
    id: airport.id,
    slug: airport.slug,
    kind: "airport",
    title: airport.name,
    description: airport.description,
    latitude: airport.latitude,
    longitude: airport.longitude,
    region: airport.region,
    href: "/guide/kak-dobratsya",
    meta: `${airport.iata} · ${airport.city}`,
    relatedArticles: [
      { title: "Как добраться по Аргентине", href: "/guide/kak-dobratsya" },
    ],
    flightDestinations: destinations.length > 0 ? destinations : undefined,
    airportDetails: {
      iata: airport.iata,
      city: airport.city,
      role:
        airport.iata === "EZE"
          ? "Главный международный аэропорт страны"
          : airport.iata === "AEP"
            ? "Основной городской аэропорт Буэнос-Айреса"
            : destinations.length >= 5
              ? "Крупный региональный авиаузел"
              : "Региональный туристический аэропорт",
      domesticRoutes: destinations.length,
      internationalNote:
        ["EZE", "AEP", "COR", "MDZ"].includes(airport.iata)
          ? "Возможны международные направления; проверяйте актуальную выдачу перевозчиков."
          : "Международные направления не подтверждены в редакционной выборке.",
      seasonalityNote: "Маршруты и расписание могут меняться в зависимости от сезона.",
    },
    ...mapEditorialFields({
      kind: "airport",
      featured: ["EZE", "AEP", "COR", "MDZ", "BRC", "FTE", "USH", "IGR"].includes(airport.iata),
      source: "Каталог аэропортов ANAC; направления — ориентир для планирования",
      sourceUrl: AIRPORT_SOURCE_URL,
      sourceVerifiedAt: AIRPORTS_VERIFIED_AT,
    }),
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
    ...mapEditorialFields({ kind: "transport" }),
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
  if (query.kinds !== undefined && query.kinds.length === 0) {
    return { objects: [], routes: [], totals: {} };
  }

  const limit = query.limit ?? DEFAULT_LIMIT;
  const activeKinds = query.kinds?.length ? query.kinds : undefined;

  const [tours, places, curation] = await Promise.all([
    fetchMarketplaceTours(),
    fetchPlacesServer(),
    loadMapCuration(),
  ]);

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

  if (!activeKinds || activeKinds.includes("city")) {
    objects.push(...buildSupplementaryCityObjects(places));
  }

  if (includePlaces) {
    objects.push(...buildKbAttractionObjects(places));
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

  const curatedObjects = objects.map((object) => applyMapCuration(object, curation.get(object.id)));
  const filtered = rankMapObjects(curatedObjects.filter((obj) => filterObject(obj, query))).slice(0, limit);

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
  return findBestMapObjectMatch(objects, q);
}
