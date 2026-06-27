import type { SearchIndexItem } from "@/lib/site-search-index";
import type { ExcursionFormatKind, ExcursionListing } from "@/types/excursion";

const FORMAT_KEYWORDS: Record<ExcursionFormatKind, string[]> = {
  individual: ["индивидуальная", "individual", "private"],
  group: ["групповая", "group"],
};

export function buildExcursionSearchItems(excursions: ExcursionListing[]): SearchIndexItem[] {
  return excursions.map((item) => {
    const formatKind = item.formatKind ?? "individual";
    const formatKeywords = [
      item.format,
      formatKind,
      ...FORMAT_KEYWORDS[formatKind],
    ].filter(Boolean) as string[];

    return {
      id: `excursion-${item.slug}`,
      type: "excursion" as const,
      title: item.title,
      description: item.tagline ?? `Экскурсия в ${item.cityName}`,
      href: `/excursions/${item.slug}`,
      keywords: [item.cityName, ...formatKeywords],
    };
  });
}
