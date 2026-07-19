import { matchCatalogPlacesForTour } from "@/lib/tour-place-match";
import { matchToursForPlace, matchToursForPlaceWithReasons } from "@/lib/places-tour-match";
import type { TourDetail, TourListing } from "@/types";
import type { PlaceDetail, PlaceListing } from "@/types/place";
import { isDefaultCatalogTour } from "@/lib/catalog-country-relevance";

/** Parse comma- or newline-separated slug list from CMS / organizer editor. */
export function parseContentSlugList(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  const seen = new Set<string>();
  const slugs: string[] = [];

  for (const part of raw.split(/[,\n]+/)) {
    const slug = part.trim().toLowerCase();
    if (!slug || seen.has(slug)) continue;
    seen.add(slug);
    slugs.push(slug);
  }

  return slugs;
}

export function normalizeSlugList(slugs: string[] | undefined): string[] {
  if (!slugs?.length) return [];
  return parseContentSlugList(slugs.join(", "));
}

export function resolveTourListingsBySlugs(
  tours: TourListing[],
  slugs: string[]
): TourListing[] {
  if (slugs.length === 0 || tours.length === 0) return [];

  const bySlug = new Map(tours.map((tour) => [tour.slug, tour] as const));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((tour): tour is TourListing => Boolean(tour))
    .slice(0, 6);
}

export function resolvePlaceListingsBySlugs(
  catalog: PlaceListing[],
  slugs: string[]
): PlaceListing[] {
  if (slugs.length === 0 || catalog.length === 0) return [];

  const bySlug = new Map(catalog.map((place) => [place.slug, place] as const));
  return slugs
    .map((slug) => bySlug.get(slug))
    .filter((place): place is PlaceListing => Boolean(place))
    .slice(0, 6);
}

export function resolveRelatedToursForPlace(
  place: Pick<PlaceDetail, "slug" | "name" | "region" | "relatedTourSlugs">,
  tours: TourListing[]
): TourListing[] {
  const explicit = resolveTourListingsBySlugs(
    tours.filter(isDefaultCatalogTour),
    normalizeSlugList(place.relatedTourSlugs),
  );
  if (explicit.length > 0) return explicit;
  return matchToursForPlace(tours, place as PlaceDetail);
}

export type RelatedTourMatch = {
  tour: TourListing;
  reasons: string[];
  source: "editorial" | "automatic";
};

/**
 * Возвращает редакционные связи первыми и дополняет их географически точным подбором.
 * Причины строятся только из сохранённой связи или полей каталога — без обещаний цены и наличия.
 */
export function resolveRelatedTourMatchesForPlace(
  place: Pick<PlaceDetail, "slug" | "name" | "region" | "relatedTourSlugs"> &
    Partial<Pick<PlaceDetail, "city" | "province" | "tags" | "latitude" | "longitude">>,
  tours: TourListing[],
): RelatedTourMatch[] {
  const explicit = resolveTourListingsBySlugs(
    tours.filter(isDefaultCatalogTour),
    normalizeSlugList(place.relatedTourSlugs),
  );
  const automatic = matchToursForPlaceWithReasons(tours, place as PlaceDetail);
  const seen = new Set<string>();
  const matches: RelatedTourMatch[] = [];

  for (const tour of explicit) {
    if (seen.has(tour.slug)) continue;
    seen.add(tour.slug);
    const automaticMatch = automatic.find((match) => match.tour.slug === tour.slug);
    matches.push({
      tour,
      reasons: automaticMatch?.reasons ?? [`Выбран редакцией для страницы «${place.name}»`],
      source: "editorial",
    });
  }

  for (const match of automatic) {
    if (seen.has(match.tour.slug)) continue;
    seen.add(match.tour.slug);
    matches.push({ tour: match.tour, reasons: match.reasons, source: "automatic" });
    if (matches.length >= 6) break;
  }

  return matches.slice(0, 6);
}

export function resolveRelatedPlacesForTour(
  tour: TourDetail,
  catalog: PlaceListing[]
): PlaceListing[] {
  const explicit = resolvePlaceListingsBySlugs(catalog, normalizeSlugList(tour.relatedPlaceSlugs));
  if (explicit.length > 0) return explicit;
  return matchCatalogPlacesForTour(tour, catalog);
}
