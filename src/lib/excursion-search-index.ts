import type { SearchIndexItem } from "@/lib/site-search-index";
import type { ExcursionListing } from "@/types/excursion";

export function buildExcursionSearchItems(excursions: ExcursionListing[]): SearchIndexItem[] {
  return excursions.map((item) => ({
    id: `excursion-${item.slug}`,
    type: "excursion" as const,
    title: item.title,
    description: item.tagline ?? `Экскурсия в ${item.cityName}`,
    href: `/excursions/${item.slug}`,
    keywords: [item.cityName, item.format].filter(Boolean) as string[],
  }));
}
