import { TourListing } from "@/types";
import { resolveNearestUpcomingDepartureTimestamp } from "@/lib/tour-departure-dates";

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
  { value: "date_asc", label: "По дате отправления" },
  { value: "duration_asc", label: "Короткие сначала" },
  { value: "duration_desc", label: "Длинные сначала" },
];

/** @deprecated Use PRIMARY_SORT_OPTIONS + SECONDARY_SORT_OPTIONS */
export const SORT_OPTIONS = [...PRIMARY_SORT_OPTIONS, ...SECONDARY_SORT_OPTIONS];

function reviewScore(tour: TourListing): number {
  if (tour.reviewCount <= 0) return 0;
  return tour.rating * 10 + tour.reviewCount * 0.1;
}

export function sortTours(tours: TourListing[], sort: TourSortOption): TourListing[] {
  const sorted = [...tours];

  switch (sort) {
    case "price_asc":
      return sorted.sort((a, b) => a.priceUsd - b.priceUsd);
    case "price_desc":
      return sorted.sort((a, b) => b.priceUsd - a.priceUsd);
    case "rating_desc":
      return sorted.sort(
        (a, b) => reviewScore(b) - reviewScore(a) || b.reviewCount - a.reviewCount
      );
    case "duration_asc":
      return sorted.sort((a, b) => a.durationDays - b.durationDays);
    case "duration_desc":
      return sorted.sort((a, b) => b.durationDays - a.durationDays);
    case "date_asc":
      return sorted.sort(
        (a, b) =>
          resolveNearestUpcomingDepartureTimestamp(a) -
          resolveNearestUpcomingDepartureTimestamp(b),
      );
    case "recommended":
    default:
      return sorted.sort((a, b) => {
        const scoreA =
          (a.featured ? 1000 : 0) +
          (a.isBestOfMonth ? 500 : 0) +
          (a.isHot ? 200 : 0) +
          (a.isNew ? 100 : 0) +
          reviewScore(a);
        const scoreB =
          (b.featured ? 1000 : 0) +
          (b.isBestOfMonth ? 500 : 0) +
          (b.isHot ? 200 : 0) +
          (b.isNew ? 100 : 0) +
          reviewScore(b);
        return scoreB - scoreA;
      });
  }
}
