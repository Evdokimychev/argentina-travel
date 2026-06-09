import { TourListing } from "@/types";

export type TourSortOption =
  | "recommended"
  | "price_asc"
  | "price_desc"
  | "rating_desc"
  | "duration_asc"
  | "duration_desc"
  | "date_asc";

export const PRIMARY_SORT_OPTIONS: { value: TourSortOption; label: string }[] = [
  { value: "recommended", label: "По популярности" },
  { value: "price_asc", label: "Дешевле" },
  { value: "price_desc", label: "Дороже" },
  { value: "rating_desc", label: "По рейтингу" },
];

export const SECONDARY_SORT_OPTIONS: { value: TourSortOption; label: string }[] = [
  { value: "duration_asc", label: "Короткие сначала" },
  { value: "duration_desc", label: "Длинные сначала" },
  { value: "date_asc", label: "Ближайшая дата" },
];

/** @deprecated Use PRIMARY_SORT_OPTIONS + SECONDARY_SORT_OPTIONS */
export const SORT_OPTIONS = [...PRIMARY_SORT_OPTIONS, ...SECONDARY_SORT_OPTIONS];

function nearestDate(tour: TourListing): number {
  const first = tour.availableDates[0]?.start;
  return first ? new Date(first).getTime() : Number.MAX_SAFE_INTEGER;
}

export function sortTours(tours: TourListing[], sort: TourSortOption): TourListing[] {
  const sorted = [...tours];

  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.priceUsd - b.priceUsd);
    case "price_desc":
      return sorted.sort((a, b) => b.priceUsd - a.priceUsd);
    case "rating_desc":
      return sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case "duration_asc":
      return sorted.sort((a, b) => a.durationDays - b.durationDays);
    case "duration_desc":
      return sorted.sort((a, b) => b.durationDays - a.durationDays);
    case "date_asc":
      return sorted.sort((a, b) => nearestDate(a) - nearestDate(b));
    case "recommended":
    default:
      return sorted.sort((a, b) => {
        const scoreA =
          (a.featured ? 1000 : 0) +
          (a.isBestOfMonth ? 500 : 0) +
          (a.isHot ? 200 : 0) +
          a.rating * 10 +
          a.reviewCount * 0.1;
        const scoreB =
          (b.featured ? 1000 : 0) +
          (b.isBestOfMonth ? 500 : 0) +
          (b.isHot ? 200 : 0) +
          b.rating * 10 +
          b.reviewCount * 0.1;
        return scoreB - scoreA;
      });
  }
}
