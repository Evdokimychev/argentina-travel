import type { TourListing } from "@/types";

const ARGENTINA_COUNTRY_MARKERS = ["аргентина", "argentina"];

/** Туры для витрины главной — только Аргентина (без партнёрских Бразилии/Чили и т.п.). */
export function isArgentinaHomepageTour(tour: TourListing): boolean {
  const country = tour.country?.trim().toLowerCase();
  if (!country) return true;
  return ARGENTINA_COUNTRY_MARKERS.some((marker) => country.includes(marker));
}

export function filterArgentinaHomepageTours(tours: TourListing[]): TourListing[] {
  return tours.filter(isArgentinaHomepageTour);
}
