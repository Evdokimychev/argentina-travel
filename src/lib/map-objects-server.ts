import type { TourListing } from "@/types";
import type { ExcursionListing } from "@/types/excursion";
import { unstable_cache } from "next/cache";
import type { PlaceCategory, PlaceListing } from "@/types/place";
import { ARGENTINA_AIRPORTS } from "@/data/argentina-airports";
import { ARGENTINA_NATIONAL_PARK_POINTS } from "@/data/argentina-national-parks";
import { getFlightConnections } from "@/data/argentina-flight-routes";
import { ARGENTINA_TRANSPORT_HUBS } from "@/data/argentina-transport-hubs";
import { TOUR_PLACE_MAP } from "@/data/media-library/maps";
import { fetchMarketplaceTours } from "@/data/marketplace-tours-server";
import { fetchExcursionsServer } from "@/lib/excursion-server";
import { getTourRoutePoints } from "@/data/tour-routes";
import { resolveTourCityDisplay } from "@/lib/argentina-cities";
import { hasValidTourMapCoordinates } from "@/lib/tour-map";
import { fetchPlacesServer, placeHref } from "@/lib/places-repository";
import { getAllPlaceListings } from "@/data/places-seed";
import { MEDIA_LOGO_FALLBACK } from "@/lib/media-resolver";
import { placeListingQualityScore } from "@/lib/places-readiness";
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

const DEFAULT_LIMIT = 600;

const MAP_SOURCE = "Редакционная база GoArgentina";
const AIRPORT_SOURCE_URL = "https://www.argentina.gob.ar/anac/catalogo-de-datos";
const AIRPORTS_VERIFIED_AT = "2026-07-19";
const CANONICAL_AIRPORT_IATAS = new Set(
  ARGENTINA_AIRPORTS.map((airport) => airport.iata),
);

const MAP_PLACES_DEADLINE_MS = 1_500;

async function resolveWithinDeadline<T>(
  promise: Promise<T>,
  fallback: () => T,
  deadlineMs: number,
): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const deadline = new Promise<T>((resolve) => {
    timeout = setTimeout(() => resolve(fallback()), deadlineMs);
  });
  try {
    return await Promise.race([promise, deadline]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

function fetchMapPlaces(): Promise<PlaceListing[]> {
  return resolveWithinDeadline(
    fetchPlacesServer(),
    () => getAllPlaceListings(),
    MAP_PLACES_DEADLINE_MS,
  );
}

const fetchMapExcursionSnapshot = unstable_cache(
  async () => (await fetchExcursionsServer({ page: 1, pageSize: 500 })).items,
  ["map-excursion-snapshot-v1"],
  { revalidate: 900, tags: ["excursions"] },
);

export function selectTransportHubsForMap(
  canonicalAirportsIncluded: boolean,
): typeof ARGENTINA_TRANSPORT_HUBS {
  if (!canonicalAirportsIncluded) return ARGENTINA_TRANSPORT_HUBS;
  return ARGENTINA_TRANSPORT_HUBS.filter(
    (hub) =>
      hub.kind !== "airport" ||
      !hub.iata ||
      !CANONICAL_AIRPORT_IATAS.has(hub.iata),
  );
}

function mapEditorialFields(input: {
  kind: MapMarkerKind;
  featured?: boolean;
  source?: string;
  sourceUrl?: string;
  sourceVerifiedAt?: string;
  qualityScore?: number;
  tags?: string[];
  status?: MapObject["status"];
}): Required<Pick<MapObject, "importance" | "featured" | "editorialPriority" | "qualityScore" | "source" | "minZoom" | "maxZoom" | "tags" | "status">> & Pick<MapObject, "sourceUrl" | "sourceVerifiedAt"> {
  const baseImportance: Record<MapMarkerKind, number> = {
    city: 90,
    national_park: 88,
    airport: 86,
    region: 82,
    attraction: 70,
    transport: 68,
    tour: 55,
    excursion: 58,
    route: 50,
  };
  const primaryMinZoom: Record<MapMarkerKind, number> = {
    city: 3,
    national_park: 3,
    airport: 3,
    region: 3,
    attraction: 5,
    transport: 6,
    tour: 6,
    excursion: 7,
    route: 6,
  };
  const secondaryMinZoom: Record<MapMarkerKind, number> = {
    city: 5,
    national_park: 5,
    airport: 5,
    region: 3,
    attraction: 7,
    transport: 6,
    tour: 7,
    excursion: 8,
    route: 6,
  };
  const importance = baseImportance[input.kind] + (input.featured ? 8 : 0);
  return {
    importance,
    featured: input.featured === true,
    editorialPriority: importance,
    qualityScore: input.qualityScore ?? (input.sourceVerifiedAt ? 90 : 72),
    source: input.source ?? MAP_SOURCE,
    sourceUrl: input.sourceUrl,
    sourceVerifiedAt: input.sourceVerifiedAt,
    minZoom: input.featured ? primaryMinZoom[input.kind] : secondaryMinZoom[input.kind],
    maxZoom: 18,
    tags: [...new Set([input.kind, ...(input.tags ?? [])])],
    status: input.status ?? "published",
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
  const semanticDeduplicated: MapObject[] = [];
  for (const object of deduplicated.values()) {
    if (object.kind !== "national_park") {
      semanticDeduplicated.push(object);
      continue;
    }
    const parkKey = canonicalNationalParkKey(object.slug);
    const duplicateIndex = semanticDeduplicated.findIndex((candidate) => {
      if (candidate.kind !== "national_park") return false;
      const candidateKey = canonicalNationalParkKey(candidate.slug);
      return (
        parkKey.length >= 7 &&
        candidateKey.length >= 7 &&
        (parkKey.includes(candidateKey) || candidateKey.includes(parkKey))
      );
    });
    if (duplicateIndex < 0) {
      semanticDeduplicated.push(object);
    } else if ((object.qualityScore ?? 0) > (semanticDeduplicated[duplicateIndex]?.qualityScore ?? 0)) {
      semanticDeduplicated[duplicateIndex] = object;
    }
  }

  return semanticDeduplicated.sort(
    (left, right) =>
      Number(Boolean(right.featured)) - Number(Boolean(left.featured)) ||
      (right.editorialPriority ?? 0) - (left.editorialPriority ?? 0) ||
      (right.qualityScore ?? 0) - (left.qualityScore ?? 0) ||
      left.title.localeCompare(right.title, "ru"),
  );
}

function canonicalNationalParkKey(value: string): string {
  return normalizeMapLookup(value)
    .replace(/parque nacional|national park|patrimonio de la humanidad/g, "")
    .replace(/s/g, "")
    .replace(/\s/g, "");
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
    category: place.category,
    popularity: place.popularity,
    relatedTours: relatedToursForPlace(place.slug, tours),
    relatedArticles: [{ title: "Места на карте", href: `/places/${place.slug}` }],
    ...mapEditorialFields({
      kind,
      featured: place.popularity >= 80,
      qualityScore: placeListingQualityScore(place),
      tags: [...place.tags, place.province ?? "", place.city ?? ""].filter(Boolean),
      status: placeListingQualityScore(place) >= 70 ? "published" : "needs_review",
    }),
  };
}

function tourToMapObject(
  tour: TourListing,
  coordinates: { latitude: number; longitude: number; inferred?: boolean } = tour,
): MapObject {
  return {
    id: `tour:${tour.id}`,
    slug: tour.slug,
    kind: "tour",
    title: tour.title,
    description: `${resolveTourCityDisplay(tour)} · ${tour.durationDays} дн.`,
    image: tour.image,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    region: tour.region,
    href: `/tours/${tour.slug}`,
    meta: resolveTourCityDisplay(tour),
    curatorNote: coordinates.inferred
      ? "Точка показывает основную географию программы. Полный маршрут смотрите в карточке тура."
      : undefined,
    ...mapEditorialFields({ kind: "tour", featured: tour.featured }),
  };
}

function normalizeMapLookup(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^a-zа-я0-9 ]/gi, "")
    .replace(/\s+/g, " ")
    .trim();
}

function findCityAnchor(names: string[], places: PlaceListing[]): PlaceListing | null {
  const needles = names.map(normalizeMapLookup).filter(Boolean);
  return (
    places.find((place) => {
      if (place.category !== "city" && place.category !== "town") return false;
      const candidates = [place.name, place.slug, place.city ?? ""].map(normalizeMapLookup);
      return needles.some((needle) =>
        candidates.some(
          (candidate) =>
            candidate === needle || candidate.includes(needle) || needle.includes(candidate),
        ),
      );
    }) ?? null
  );
}

function excursionAnchor(excursion: ExcursionListing, places: PlaceListing[]): PlaceListing | null {
  return findCityAnchor([excursion.cityName, excursion.citySlug], places);
}

function excursionOffset(excursion: ExcursionListing): { latitude: number; longitude: number } {
  const seed = `${excursion.partner}:${excursion.id}`
    .split("")
    .reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const angle = ((seed % 360) * Math.PI) / 180;
  const radius = 0.006 + ((seed % 5) * 0.0015);
  return { latitude: Math.sin(angle) * radius, longitude: Math.cos(angle) * radius };
}

function inferredTourCoordinates(
  tour: TourListing,
  places: PlaceListing[],
): { latitude: number; longitude: number; inferred?: boolean } | null {
  if (hasValidTourMapCoordinates(tour.latitude, tour.longitude)) return tour;

  const routePoints = getTourRoutePoints(tour.slug);
  const representativePoint = routePoints[Math.floor(routePoints.length / 2)];
  if (representativePoint) {
    return {
      latitude: representativePoint.lat,
      longitude: representativePoint.lng,
      inferred: true,
    };
  }

  const anchor = findCityAnchor([resolveTourCityDisplay(tour), tour.destination], places);
  return anchor
    ? { latitude: anchor.latitude, longitude: anchor.longitude, inferred: true }
    : null;
}

function excursionToMapObject(
  excursion: ExcursionListing,
  anchor: PlaceListing,
): MapObject {
  const offset = excursionOffset(excursion);
  const featured = excursion.reviewCount >= 40 || ((excursion.rating ?? 0) >= 4.8 && excursion.reviewCount >= 10);
  return {
    id: `excursion:${excursion.partner}:${excursion.id}`,
    slug: excursion.slug,
    kind: "excursion",
    title: excursion.title,
    description: excursion.tagline || `Экскурсия в городе ${excursion.cityName}`,
    image: excursion.coverImage,
    latitude: anchor.latitude + offset.latitude,
    longitude: anchor.longitude + offset.longitude,
    region: anchor.region,
    href: `/excursions/${excursion.slug}`,
    meta: `${excursion.cityName} · ${excursion.reviewCount} ${russianReviewsLabel(excursion.reviewCount)}`,
    category: "excursion",
    curatorNote: "Точка привязана к городу проведения. Точное место встречи смотрите в карточке экскурсии.",
    ...mapEditorialFields({
      kind: "excursion",
      featured,
      tags: [excursion.cityName, excursion.citySlug, excursion.partner],
    }),
  };
}

function russianReviewsLabel(count: number): string {
  const mod100 = count % 100;
  const mod10 = count % 10;
  if (mod100 >= 11 && mod100 <= 14) return "отзывов";
  if (mod10 === 1) return "отзыв";
  if (mod10 >= 2 && mod10 <= 4) return "отзыва";
  return "отзывов";
}

function airportToMapObject(airport: (typeof ARGENTINA_AIRPORTS)[number]): MapObject {
  const destinations = getFlightConnections(airport.iata).map(({ airport: destination, route }) => ({
    iata: destination.iata,
    city: destination.city,
    airportName: destination.name,
    latitude: destination.latitude,
    longitude: destination.longitude,
    mapObjectId: destination.id,
    service: route.service,
    durationMinutes: route.durationMinutes,
    airlines: route.airlines,
    frequencyNote: route.frequencyNote,
    verifiedAt: route.verifiedAt,
    sourceUrl: route.sourceUrl,
  }));

  return {
    id: airport.id,
    slug: airport.slug,
    kind: "airport",
    title: `Аэропорт ${airport.city} (${airport.iata})`,
    description: airport.description || airport.name,
    latitude: airport.latitude,
    longitude: airport.longitude,
    region: airport.region,
    href: "/guide/kak-dobratsya",
    meta: airport.name,
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
      seasonalityNote: "Показаны прямые маршруты, заявленные в расписании; доступность зависит от дат и сезона.",
    },
    ...mapEditorialFields({
      kind: "airport",
      featured: ["EZE", "AEP", "COR", "MDZ", "BRC", "FTE", "USH", "IGR"].includes(airport.iata),
      source: "Каталог аэропортов ANAC",
      sourceUrl: AIRPORT_SOURCE_URL,
      sourceVerifiedAt: AIRPORTS_VERIFIED_AT,
      tags: [airport.iata, airport.city, airport.name],
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

function supplementaryNationalParkObjects(existing: MapObject[]): MapObject[] {
  const existingParks = existing.filter((object) => object.kind === "national_park");
  const covered = new Set(
    existingParks
      .flatMap((object) => [normalizeMapLookup(object.title), normalizeMapLookup(object.slug)]),
  );

  return ARGENTINA_NATIONAL_PARK_POINTS.filter((park) => {
    const shortName = normalizeMapLookup(park.name.replace(/^Parque Nacional /i, ""));
    const parkKey = normalizeMapLookup(park.slug).replace(/\s/g, "");
    const alreadyNearby = existingParks.some(
      (object) =>
        Math.abs(object.latitude - park.latitude) < 0.12 &&
        Math.abs(object.longitude - park.longitude) < 0.12,
    );
    const alreadyNamed = existingParks.some((object) =>
      normalizeMapLookup(object.title).includes(shortName),
    );
    const alreadySlugged = existingParks.some((object) => {
      const objectKey = normalizeMapLookup(object.slug)
        .replace(/parque nacional|national park/g, "")
        .replace(/\s/g, "");
      return objectKey.length >= 5 && (objectKey.includes(parkKey) || parkKey.includes(objectKey));
    });
    return (
      !alreadyNearby &&
      !alreadyNamed &&
      !alreadySlugged &&
      !covered.has(normalizeMapLookup(park.name)) &&
      !covered.has(shortName) &&
      !covered.has(normalizeMapLookup(park.slug))
    );
  }).map((park) => ({
    id: `national-park:${park.slug}`,
    slug: `national-park-${park.slug}`,
    kind: "national_park" as const,
    title: park.name.replace(/^Parque Nacional /i, "Национальный парк "),
    description: "Охраняемая природная территория из национального реестра парков.",
    latitude: park.latitude,
    longitude: park.longitude,
    region: "Аргентина",
    href: "https://www.argentina.gob.ar/parquesnacionales",
    category: "national_park",
    meta: park.name,
    ...mapEditorialFields({
      kind: "national_park",
      source: "Administración de Parques Nacionales / OpenStreetMap",
      sourceUrl: "https://www.argentina.gob.ar/parquesnacionales",
      sourceVerifiedAt: "2026-07-19",
      tags: [park.name, "национальный парк"],
    }),
  }));
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
    const haystack = `${obj.title} ${obj.region} ${obj.meta ?? ""} ${(obj.tags ?? []).join(" ")}`;
    if (!matchesCityFilter(haystack, query.city)) return false;
  }
  if (query.q) {
    const haystack = `${obj.title} ${obj.description ?? ""} ${obj.region} ${obj.meta ?? ""} ${(obj.tags ?? []).join(" ")}`;
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

  const shouldLoadExcursions = !activeKinds || activeKinds.includes("excursion");
  const shouldLoadTours =
    !activeKinds || activeKinds.includes("tour") || activeKinds.includes("route");
  const [toursResult, placesResult, curationResult, excursionsResult] = await Promise.allSettled([
    shouldLoadTours ? fetchMarketplaceTours() : Promise.resolve([] as TourListing[]),
    fetchMapPlaces(),
    resolveWithinDeadline(loadMapCuration(), () => new Map<string, MapCurationRow>(), 1_500),
    shouldLoadExcursions
      ? fetchMapExcursionSnapshot()
      : Promise.resolve([] as ExcursionListing[]),
  ]);
  // The map must remain useful when one remote catalog is temporarily down:
  // airports, transport hubs and whichever local source succeeded still render.
  const tours = toursResult.status === "fulfilled" ? toursResult.value : [];
  const places = placesResult.status === "fulfilled" ? placesResult.value : [];
  const curation = curationResult.status === "fulfilled" ? curationResult.value : new Map();
  const excursions =
    excursionsResult.status === "fulfilled" ? excursionsResult.value : [];

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
    objects.push(...supplementaryNationalParkObjects(objects));
  }

  if (!activeKinds || activeKinds.includes("tour")) {
    for (const tour of tours) {
      const coordinates = inferredTourCoordinates(tour, places);
      if (!coordinates) continue;
      objects.push(tourToMapObject(tour, coordinates));
    }
  }

  if (!activeKinds || activeKinds.includes("excursion")) {
    for (const excursion of excursions) {
      const anchor = excursionAnchor(excursion, places);
      if (!anchor) continue;
      objects.push(excursionToMapObject(excursion, anchor));
    }
  }

  if (!activeKinds || activeKinds.includes("airport")) {
    objects.push(...ARGENTINA_AIRPORTS.map(airportToMapObject));
  }

  if (!activeKinds || activeKinds.includes("transport")) {
    const canonicalAirportsIncluded = !activeKinds || activeKinds.includes("airport");
    objects.push(
      ...selectTransportHubsForMap(canonicalAirportsIncluded).map(transportHubToMapObject),
    );
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
