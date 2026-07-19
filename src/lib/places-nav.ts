import { PLACES_SEED } from "@/data/places-seed";
import { placeHref } from "@/lib/places-urls";
import type { SiteNavLink } from "@/types/site-nav";

const REGION_DESTINATION_IDS: Record<string, string> = {
  "Центр и Пампа": "ba",
  Патагония: "patagonia",
  "Северо-запад": "salta",
  "Северо-восток": "iguazu",
  Куйо: "mendoza",
  "Огненная Земля": "ushuaia",
};

const POPULAR_PLACE_SLUGS = [
  "iguazu-falls",
  "perito-moreno-glacier",
  "buenos-aires",
  "fitz-roy",
  "ushuaia",
] as const;

export function buildPopularPlaceNavLinks(): SiteNavLink[] {
  return POPULAR_PLACE_SLUGS.map((slug) => {
    const place = PLACES_SEED.find((item) => item.slug === slug);
    return {
      id: `place-${slug}`,
      label: place?.name ?? slug,
      href: placeHref(slug),
      description: place?.shortDescription,
    };
  });
}

/** Региональный гид для места, когда нет отдельной destination-страницы. */
export function destinationIdForPlaceRegion(region: string): string | undefined {
  return REGION_DESTINATION_IDS[region];
}
