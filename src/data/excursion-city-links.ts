/** Tripster city slugs synced from API (see tripster_cities.slug). */
export const EXCURSION_CITY_LINKS = {
  buenosAires: { slug: "Buenos_Aires", label: "Буэнос-Айрес" },
  ushuaia: { slug: "Ushuaia", label: "Ушуайя" },
  mendoza: { slug: "Mendoza", label: "Мендоса" },
  iguazu: { slug: "Puerto_Iguazu", label: "Пуэрто-Игуасу" },
} as const;

export function excursionCityHref(citySlug: string): string {
  return `/excursions/city/${encodeURIComponent(citySlug)}`;
}

/** Map destination page ids → Tripster city slug when available. */
export const DESTINATION_EXCURSION_CITY: Record<string, string> = {
  ba: EXCURSION_CITY_LINKS.buenosAires.slug,
  ushuaia: EXCURSION_CITY_LINKS.ushuaia.slug,
  mendoza: EXCURSION_CITY_LINKS.mendoza.slug,
  iguazu: EXCURSION_CITY_LINKS.iguazu.slug,
};

export function destinationExcursionsHref(destinationId: string): string | null {
  const citySlug = DESTINATION_EXCURSION_CITY[destinationId];
  if (citySlug) return excursionCityHref(citySlug);
  return null;
}
