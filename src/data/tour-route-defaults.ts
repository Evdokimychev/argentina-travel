import { tourRoutesMap } from "@/data/tour-routes";
import { TOUR_CITY_OPTIONS } from "@/data/tour-geography";
import type { TourRoutePoint } from "@/types";

export const ORGANIZER_ROUTE_POINTS_MAX = 20;

/** Static coords for catalog destinations — avoids importing marketplace-tours (circular deps). */
const ROUTE_DESTINATION_COORDS: ReadonlyArray<{
  name: string;
  lat: number;
  lng: number;
}> = [
  { name: "Буэнос-Айрес", lat: -34.603, lng: -58.3816 },
  { name: "Эль-Калафате", lat: -50.337, lng: -72.2642 },
  { name: "Мендоса", lat: -32.89, lng: -68.827 },
  { name: "Игуасу", lat: -25.695, lng: -54.436 },
  { name: "Пуэрто-Игуасу", lat: -25.695, lng: -54.436 },
  { name: "Сальта", lat: -24.782, lng: -65.423 },
  { name: "Ушуайя", lat: -54.801, lng: -68.303 },
  { name: "Барилоче", lat: -41.133, lng: -71.308 },
  { name: "Эль-Чалтен", lat: -49.331, lng: -72.886 },
  { name: "Пуэрто-Наталес", lat: -53.163, lng: -70.917 },
  { name: "Торрес-дель-Пайне", lat: -51.069, lng: -72.987 },
  { name: "Водопады Игуасу", lat: -25.695, lng: -54.436 },
  { name: "Ушуая", lat: -54.801, lng: -68.303 },
];

const knownLocations = new Map<string, { lat: number; lng: number }>();

function registerLocation(name: string, lat: number, lng: number) {
  const key = name.trim().toLowerCase();
  if (!key || !Number.isFinite(lat) || !Number.isFinite(lng)) return;
  if (!knownLocations.has(key)) {
    knownLocations.set(key, { lat, lng });
  }
}

for (const points of Object.values(tourRoutesMap)) {
  for (const point of points) {
    registerLocation(point.name, point.lat, point.lng);
  }
}

for (const { name, lat, lng } of ROUTE_DESTINATION_COORDS) {
  registerLocation(name, lat, lng);
}

for (const city of TOUR_CITY_OPTIONS) {
  if (!knownLocations.has(city.toLowerCase())) {
    const fromRoutes = Object.values(tourRoutesMap)
      .flat()
      .find((point) => point.name.toLowerCase() === city.toLowerCase());
    if (fromRoutes) {
      registerLocation(city, fromRoutes.lat, fromRoutes.lng);
    }
  }
}

const routeLocationLabels = new Set<string>(TOUR_CITY_OPTIONS);

for (const points of Object.values(tourRoutesMap)) {
  for (const point of points) {
    routeLocationLabels.add(point.name);
  }
}

for (const { name } of ROUTE_DESTINATION_COORDS) {
  routeLocationLabels.add(name);
}

export const ROUTE_LOCATION_OPTIONS = Array.from(routeLocationLabels).sort((a, b) =>
  a.localeCompare(b, "ru")
);

export function createRoutePointId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `route-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyRoutePoint(dayNumber?: number): TourRoutePoint {
  return {
    id: createRoutePointId(),
    name: "",
    lat: 0,
    lng: 0,
    dayNumber,
  };
}

export function lookupLocationCoords(name: string): { lat: number; lng: number } | null {
  const key = name.trim().toLowerCase();
  if (!key) return null;
  return knownLocations.get(key) ?? null;
}

function normalizeLocationLookupKey(value: string): string {
  return value.trim().toLowerCase().replace(/[—–]/g, "-");
}

function collapseLocationLookupKey(value: string): string {
  return normalizeLocationLookupKey(value).replace(/[\s-]+/g, "");
}

function buildLocationLookupCandidates(name: string): string[] {
  const primary = name.split(",")[0]?.trim() ?? name.trim();
  const candidates = new Set<string>();
  if (primary) {
    candidates.add(primary);
    candidates.add(normalizeLocationLookupKey(primary));
    candidates.add(primary.replace(/\s+/g, "-"));
    candidates.add(primary.replace(/-/g, " "));
  }
  return [...candidates];
}

/** Fuzzy lookup for partner labels like «Эль-Калафате, Аргентина». */
export function lookupLocationCoordsFromLabel(name: string): { lat: number; lng: number } | null {
  const trimmed = name.trim();
  if (!trimmed) return null;

  for (const candidate of buildLocationLookupCandidates(trimmed)) {
    const hit = lookupLocationCoords(candidate);
    if (hit) return hit;
  }

  const collapsedPrimary = collapseLocationLookupKey(trimmed.split(",")[0] ?? trimmed);
  if (collapsedPrimary.length < 4) return null;

  for (const [key, coords] of knownLocations) {
    if (collapseLocationLookupKey(key) === collapsedPrimary) {
      return coords;
    }
  }

  let bestMatch: { lat: number; lng: number } | null = null;
  let bestLen = 0;

  for (const [key, coords] of knownLocations) {
    const collapsedKey = collapseLocationLookupKey(key);
    if (collapsedKey.length < 4) continue;
    if (
      collapsedPrimary.includes(collapsedKey) ||
      collapsedKey.includes(collapsedPrimary)
    ) {
      const matchLen = Math.min(collapsedPrimary.length, collapsedKey.length);
      if (matchLen > bestLen) {
        bestLen = matchLen;
        bestMatch = coords;
      }
    }
  }

  return bestMatch;
}

export function isValidRoutePointCoords(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180 &&
    !(lat === 0 && lng === 0)
  );
}

export function normalizeRoutePoint(
  point: Partial<TourRoutePoint>,
  order: number
): TourRoutePoint | null {
  const name = point.name?.trim() ?? "";
  if (!name) return null;

  const lat = Number(point.lat);
  const lng = Number(point.lng);
  if (!isValidRoutePointCoords(lat, lng)) return null;

  const dayNumber =
    point.dayNumber != null && Number.isFinite(point.dayNumber) && point.dayNumber > 0
      ? Math.round(point.dayNumber)
      : undefined;

  return {
    id: point.id?.trim() || createRoutePointId(),
    name,
    lat,
    lng,
    dayNumber: dayNumber ?? order,
  };
}

export function normalizeRoutePoints(
  points: TourRoutePoint[] | undefined,
  seed: TourRoutePoint[] = []
): TourRoutePoint[] {
  const source = points !== undefined ? points : seed;
  return source
    .map((point, index) => normalizeRoutePoint(point, index + 1))
    .filter((point): point is TourRoutePoint => point != null);
}
