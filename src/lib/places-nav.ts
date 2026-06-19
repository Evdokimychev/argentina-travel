import { PLACES_SEED } from "@/data/places-seed";
import { placeHref } from "@/lib/places-repository";
import type { SiteNavLink } from "@/types/site-nav";

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
