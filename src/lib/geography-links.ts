import { SEARCH_DESTINATIONS } from "@/data/filters";
import {
  DESTINATION_TO_PLACE,
  PATAGONIA_PLACE_SLUGS,
  PLACE_TO_DESTINATION,
} from "@/data/knowledge-graph/entities";
import { PLACES_SEED, toPlaceListing } from "@/data/places-seed";
import { destinationHref } from "@/lib/destinations";
import { placeHref } from "@/lib/places-repository";
import { destinationCatalogHref } from "@/lib/site-nav";
import type { PlaceListing } from "@/types/place";

const SEARCH_LABEL_HREF: Record<string, string> = (() => {
  const map: Record<string, string> = {
    Патагония: destinationHref("patagonia"),
    Аргентина: "/destinations",
  };

  for (const [destId, placeSlug] of Object.entries(DESTINATION_TO_PLACE)) {
    const place = PLACES_SEED.find((p) => p.slug === placeSlug);
    if (place) map[place.name] = destinationHref(destId);
  }

  for (const place of PLACES_SEED) {
    if (!map[place.name] && !PLACE_TO_DESTINATION[place.slug]) {
      map[place.name] = placeHref(place.slug);
    }
  }

  for (const dest of SEARCH_DESTINATIONS) {
    if (!map[dest.label]) {
      map[dest.label] = destinationCatalogHref(dest.label);
    }
  }

  return map;
})();

/** Предпочтительная ссылка для поисковой метки (направление, место или каталог туров). */
export function searchLabelToHref(label: string): string {
  return SEARCH_LABEL_HREF[label] ?? destinationCatalogHref(label);
}

export function pairedPlaceSlugForDestination(destId: string): string | undefined {
  return DESTINATION_TO_PLACE[destId];
}

export function pairedDestinationIdForPlace(placeSlug: string): string | undefined {
  return PLACE_TO_DESTINATION[placeSlug];
}

export function placeSlugsForDestination(destId: string): string[] {
  if (destId === "patagonia") return [...PATAGONIA_PLACE_SLUGS];
  const single = DESTINATION_TO_PLACE[destId];
  return single ? [single] : [];
}

export function geographyHubPlaces(limit = 8): PlaceListing[] {
  return [...PLACES_SEED]
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, limit)
    .map(toPlaceListing);
}
