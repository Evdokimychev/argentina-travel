import { TourListing, TourFormat } from "@/types";

export function getTourFormats(tour: TourListing): TourFormat[] {
  const mode = tour.bookingMode ?? "scheduled";
  const formats = new Set<TourFormat>();

  if (
    mode === "on_request" ||
    mode === "both" ||
    tour.groupSizeBucket === "Индивидуально"
  ) {
    formats.add("individual");
  }

  if (
    mode === "scheduled" ||
    mode === "both" ||
    tour.groupSizeBucket !== "Индивидуально"
  ) {
    formats.add("group");
  }

  if (formats.size === 0) formats.add("group");
  return [...formats];
}

export function matchesTourFormat(
  tour: TourListing,
  selected: TourFormat[]
): boolean {
  if (selected.length === 0) return true;
  const tourFormats = getTourFormats(tour);
  return selected.some((f) => tourFormats.includes(f));
}

export function countToursByFormat(tours: TourListing[]): Record<TourFormat, number> {
  const counts: Record<TourFormat, number> = { group: 0, individual: 0 };
  for (const tour of tours) {
    for (const format of getTourFormats(tour)) {
      counts[format]++;
    }
  }
  return counts;
}

export const TOUR_FORMAT_OPTIONS: {
  format: TourFormat;
  label: string;
  shortLabel: string;
  description: string;
}[] = [
  {
    format: "group",
    label: "Групповой",
    shortLabel: "Группа",
    description: "Фиксированные даты и набор группы",
  },
  {
    format: "individual",
    label: "Индивидуальный",
    shortLabel: "Индив.",
    description: "Приватный тур или даты по запросу",
  },
];
