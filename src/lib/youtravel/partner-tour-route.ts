import { lookupLocationCoordsFromLabel } from "@/data/tour-route-defaults";
import { resolveYouTravelDayPhotos, resolveYouTravelProgram } from "@/lib/youtravel/partner-tour-content";
import { haversineKm } from "@/lib/tour-route-map";
import type { YouTravelLocationData, YouTravelProgramDay, YouTravelTour } from "@/lib/youtravel/types";
import type { TourRoutePoint } from "@/types";

/** YouTravel sometimes returns city-center coords from the wrong region. */
const COORD_CORRECTION_THRESHOLD_KM = 75;

function parseCoordinate(value: unknown): number | null {
  if (value == null || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveLocationId(location: YouTravelLocationData): string | null {
  const id = location.location_id ?? location.external_id;
  if (id == null || id === "") return null;
  return String(id);
}

function resolveDayNumber(day: YouTravelProgramDay, index: number): number {
  const raw = day.day ?? day.dayNumber ?? index + 1;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : index + 1;
}

function resolveDayLocations(day: YouTravelProgramDay): YouTravelLocationData[] {
  const raw = day.locations_data ?? day.locationsData ?? [];
  return Array.isArray(raw) ? raw : [];
}

function resolveYouTravelLocationCoordinates(
  location: YouTravelLocationData,
): { lat: number; lng: number } | null {
  const lat = parseCoordinate(location.cord_y);
  const lng = parseCoordinate(location.cord_x);
  if (lat == null || lng == null) return null;
  if (lat === 0 && lng === 0) return null;

  const known = lookupLocationCoordsFromLabel(location.name ?? "");
  if (!known) return { lat, lng };

  const driftKm = haversineKm({ lat, lng }, known);
  if (driftKm > COORD_CORRECTION_THRESHOLD_KM) {
    return known;
  }

  return { lat, lng };
}

/** Map YouTravel program locations to deduplicated route points in day order. */
export function mapYouTravelLocationsToRoutePoints(
  days: YouTravelProgramDay[],
): TourRoutePoint[] {
  const seenIds = new Set<string>();
  const points: TourRoutePoint[] = [];

  days.forEach((day, index) => {
    const dayNumber = resolveDayNumber(day, index);
    const dayImageUrl = resolveYouTravelDayPhotos(day)[0];

    for (const location of resolveDayLocations(day)) {
      const locationId = resolveLocationId(location);
      if (locationId && seenIds.has(locationId)) continue;

      const coords = resolveYouTravelLocationCoordinates(location);
      if (!coords) continue;

      const { lat, lng } = coords;

      const name = location.name?.trim();
      if (!name) continue;

      if (locationId) seenIds.add(locationId);

      points.push({
        id: locationId ? `yt-loc-${locationId}` : `yt-loc-${points.length + 1}`,
        name,
        lat,
        lng,
        dayNumber,
        imageUrl: dayImageUrl,
      });
    }
  });

  return points;
}

export function resolveYouTravelRoutePoints(payload: YouTravelTour): TourRoutePoint[] {
  const program = resolveYouTravelProgram(payload) as YouTravelProgramDay[];
  if (!program.length) return [];
  return mapYouTravelLocationsToRoutePoints(program);
}

/** Ordered location names for one program day, deduplicated by location_id. */
export function resolveYouTravelDayLocationNames(day: YouTravelProgramDay): string[] {
  const seenIds = new Set<string>();
  const names: string[] = [];

  for (const location of resolveDayLocations(day)) {
    const locationId = resolveLocationId(location);
    if (locationId && seenIds.has(locationId)) continue;

    const name = location.name?.trim();
    if (!name) continue;

    if (locationId) seenIds.add(locationId);
    names.push(name);
  }

  return names;
}
