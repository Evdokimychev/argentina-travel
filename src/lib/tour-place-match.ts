import {
  DESTINATION_TO_PLACE,
  PATAGONIA_PLACE_SLUGS,
  PLACE_TO_DESTINATION,
} from "@/data/knowledge-graph/entities";
import { PLACES_SEED } from "@/data/places-seed";
import type { TourDetail } from "@/types";
import type { PlaceListing } from "@/types/place";

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9а-яё\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string): string[] {
  return normalizeText(value)
    .split(/\s+/)
    .filter((token) => token.length >= 3);
}

function namesMatch(a: string, b: string): boolean {
  const left = normalizeText(a);
  const right = normalizeText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const leftTokens = tokenize(left);
  const rightTokens = tokenize(right);
  return leftTokens.some((token) => rightTokens.includes(token));
}

function addScore(scores: Map<string, number>, slug: string, points: number) {
  if (!slug) return;
  scores.set(slug, (scores.get(slug) ?? 0) + points);
}

function destinationPlaceSlugsForTour(tour: TourDetail): string[] {
  const slugs = new Set<string>();
  const regionNorm = normalizeText(tour.region);

  if (regionNorm.includes("патагон")) {
    for (const slug of PATAGONIA_PLACE_SLUGS) slugs.add(slug);
  }

  for (const [destId, placeSlug] of Object.entries(DESTINATION_TO_PLACE)) {
    const place = PLACES_SEED.find((item) => item.slug === placeSlug);
    if (!place) continue;
    const placeNorm = normalizeText(place.name);
    const regionMatch = regionNorm.includes(placeNorm) || placeNorm.includes(regionNorm);
    const titleMatch = namesMatch(tour.title, place.name) || namesMatch(tour.shortDescription, place.name);
    if (regionMatch || titleMatch || destId === regionNorm) {
      slugs.add(placeSlug);
    }
  }

  for (const [placeSlug, destId] of Object.entries(PLACE_TO_DESTINATION)) {
    if (regionNorm.includes(destId) || tour.tags.some((tag) => normalizeText(tag).includes(destId))) {
      slugs.add(placeSlug);
    }
  }

  return [...slugs];
}

/**
 * Сопоставляет тур с карточками справочника мест — эвристики по названиям, маршруту и региону.
 */
export function matchCatalogPlacesForTour(
  tour: TourDetail,
  catalog: PlaceListing[],
): PlaceListing[] {
  if (catalog.length === 0) return [];

  const bySlug = new Map(catalog.map((place) => [place.slug, place]));
  const scores = new Map<string, number>();

  for (const tourPlace of tour.places) {
    for (const listing of catalog) {
      if (namesMatch(tourPlace.title, listing.name)) {
        addScore(scores, listing.slug, 12);
      }
    }
  }

  for (const point of tour.routePoints ?? []) {
    for (const listing of catalog) {
      if (namesMatch(point.name, listing.name) || namesMatch(point.name, listing.city ?? "")) {
        addScore(scores, listing.slug, 10);
      }
    }
  }

  for (const listing of catalog) {
    if (listing.region === tour.region) {
      addScore(scores, listing.slug, 4);
    }

    const tourHaystack = normalizeText(
      [tour.title, tour.shortDescription, tour.region, ...tour.tags].join(" "),
    );
    const placeHaystack = normalizeText(
      [listing.name, listing.shortDescription, listing.region, listing.city ?? "", ...listing.tags].join(" "),
    );

    for (const token of tokenize(listing.name)) {
      if (tourHaystack.includes(token)) addScore(scores, listing.slug, 3);
    }

    for (const tag of listing.tags) {
      if (tour.tags.some((tourTag) => namesMatch(tourTag, tag))) {
        addScore(scores, listing.slug, 2);
      }
    }

    if (tourHaystack.includes(normalizeText(listing.region)) || placeHaystack.includes(normalizeText(tour.region))) {
      addScore(scores, listing.slug, 2);
    }
  }

  for (const slug of destinationPlaceSlugsForTour(tour)) {
    addScore(scores, slug, 6);
  }

  return [...scores.entries()]
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      const popA = bySlug.get(a[0])?.popularity ?? 0;
      const popB = bySlug.get(b[0])?.popularity ?? 0;
      return popB - popA;
    })
    .map(([slug]) => bySlug.get(slug))
    .filter((place): place is PlaceListing => Boolean(place))
    .slice(0, 6);
}
