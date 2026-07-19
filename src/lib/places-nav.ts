import { POPULAR_PLACE_NAV_ITEMS } from "@/data/site-nav-curated";
import { placeHref } from "@/lib/places-urls";
import type { SiteNavLink } from "@/types/site-nav";

export function buildPopularPlaceNavLinks(): SiteNavLink[] {
  return POPULAR_PLACE_NAV_ITEMS.map(([slug, name, description]) => {
    return {
      id: `place-${slug}`,
      label: name,
      href: placeHref(slug),
      description,
    };
  });
}
