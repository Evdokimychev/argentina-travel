import type { PlaceDetail } from "@/types/place";
import type { TourListing } from "@/types";
import { getDestinationPageById } from "@/data/destination-pages";
import { matchToursForDestination } from "@/lib/destinations";
import { pairedDestinationIdForPlace } from "@/lib/geography-links";
import { filterArgentinaHomepageTours } from "@/lib/homepage-tours";

export type PlaceTourMatch = {
  tour: TourListing;
  score: number;
  reasons: string[];
};

const GENERIC_TAGS = new Set([
  "аргентина",
  "argentina",
  "тур",
  "туры",
  "экскурсия",
  "экскурсии",
  "природа",
  "город",
]);

function normalizeMatchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function listingHaystack(tour: TourListing): string {
  return normalizeMatchText(
    [
      tour.title,
      tour.destination,
      tour.region,
      tour.shortDescription,
      tour.activityType,
      ...(tour.partnerThematicTags ?? []),
    ].join(" "),
  );
}

function containsTagSignal(haystack: string, tag: string): boolean {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)${escaped}[a-zа-я]{0,5}(?:\\s|$)`, "i").test(haystack);
}

function hasUsableCoordinates(latitude: number, longitude: number): boolean {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0);
}

function distanceKm(
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number },
): number {
  const toRadians = (value: number) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const latDelta = toRadians(to.latitude - from.latitude);
  const lonDelta = toRadians(to.longitude - from.longitude);
  const fromLat = toRadians(from.latitude);
  const toLat = toRadians(to.latitude);
  const haversine =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(lonDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine));
}

function scoreFallbackPlaceMatch(tour: TourListing, place: PlaceDetail): PlaceTourMatch | null {
  const haystack = listingHaystack(tour);
  const placeName = normalizeMatchText(place.name);
  const city = normalizeMatchText(place.city ?? "");
  const region = normalizeMatchText(place.region);
  const reasons: string[] = [];
  let score = 0;

  if (placeName.length >= 3 && haystack.includes(placeName)) {
    score += 80;
    reasons.push(`Маршрут включает ${place.name}`);
  }

  if (city.length >= 3 && city !== placeName && haystack.includes(city)) {
    score += 45;
    reasons.push(`Старт или маршрут проходит через ${place.city}`);
  }

  const tourRegion = normalizeMatchText(tour.region);
  if (region.length >= 3 && (tourRegion === region || haystack.includes(region))) {
    score += 24;
    reasons.push(`Подходит для поездки по региону «${place.region}»`);
  }

  const matchingTags = (place.tags ?? [])
    .map(normalizeMatchText)
    .filter((tag) => tag.length >= 4 && !GENERIC_TAGS.has(tag) && containsTagSignal(haystack, tag));
  if (matchingTags.length > 0) {
    score += Math.min(matchingTags.length, 2) * 10;
    reasons.push(`Совпадает с темой: ${matchingTags.slice(0, 2).join(", ")}`);
  }

  if (
    hasUsableCoordinates(place.latitude, place.longitude) &&
    hasUsableCoordinates(tour.latitude, tour.longitude)
  ) {
    const km = distanceKm(place, tour);
    if (km <= 40) {
      score += 70;
      reasons.push("Маршрут начинается рядом с этим местом");
    } else if (km <= 180) {
      score += 35;
      reasons.push("Удобная отправная точка для посещения этого места");
    }
  }

  if (score < 24 || reasons.length === 0) return null;
  return { tour, score, reasons: [...new Set(reasons)].slice(0, 2) };
}

export function matchToursForPlaceWithReasons(
  tours: TourListing[],
  place: PlaceDetail,
): PlaceTourMatch[] {
  const argentinaTours = filterArgentinaHomepageTours(tours);
  const destinationId = pairedDestinationIdForPlace(place.slug);
  if (destinationId) {
    const destination = getDestinationPageById(destinationId);
    if (destination) {
      const destinationMatches = matchToursForDestination(argentinaTours, destination);
      if (destinationMatches.length > 0) {
        return destinationMatches.slice(0, 6).map((tour, index) => ({
          tour,
          score: 100 - index,
          reasons: [`Маршрут связан с направлением «${destination.name}»`],
        }));
      }
    }
  }

  return argentinaTours
    .map((tour) => scoreFallbackPlaceMatch(tour, place))
    .filter((match): match is PlaceTourMatch => Boolean(match))
    .sort(
      (a, b) =>
        b.score - a.score ||
        b.tour.rating - a.tour.rating ||
        b.tour.reviewCount - a.tour.reviewCount,
    )
    .slice(0, 6);
}

export function matchToursForPlace(tours: TourListing[], place: PlaceDetail): TourListing[] {
  return matchToursForPlaceWithReasons(tours, place).map((match) => match.tour);
}
