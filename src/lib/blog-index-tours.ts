import { getBlogCategoryTourCta } from "@/data/blog-category-tours";
import { isArgentinaHomepageTour } from "@/lib/homepage-tours";
import type { TourListing } from "@/types";

/** Подбор туров для витрины на индексе блога по ключевым категориям. */
export function pickBlogIndexFeaturedTours(
  tours: TourListing[],
  limit = 4,
): TourListing[] {
  const queries = [
    getBlogCategoryTourCta("Патагония").query,
    getBlogCategoryTourCta("Буэнос-Айрес").query,
    getBlogCategoryTourCta("Водопады Игуасу").query,
    getBlogCategoryTourCta("Винодельни").query,
  ];

  const picked: TourListing[] = [];
  const seen = new Set<string>();

  for (const query of queries) {
    const normalized = query.toLowerCase();
    const match = tours.find((tour) => {
      if (!isArgentinaHomepageTour(tour) || seen.has(tour.slug)) return false;
      const haystack = [
        tour.title,
        tour.destination,
        tour.region,
        tour.shortDescription,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });

    if (match) {
      picked.push(match);
      seen.add(match.slug);
    }
    if (picked.length >= limit) break;
  }

  if (picked.length < limit) {
    for (const tour of tours) {
      if (!isArgentinaHomepageTour(tour) || seen.has(tour.slug)) continue;
      picked.push(tour);
      seen.add(tour.slug);
      if (picked.length >= limit) break;
    }
  }

  return picked;
}
