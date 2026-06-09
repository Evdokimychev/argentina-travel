import { TourDetail } from "@/types";
import { tourHasAccommodation } from "@/lib/tour-accommodation";

export interface TourSectionLink {
  id: string;
  label: string;
}

export function buildTourSectionLinks(
  tour: TourDetail,
  hasSimilarTours: boolean
): TourSectionLink[] {
  const links: TourSectionLink[] = [
    { id: "description", label: "Описание" },
    { id: "places", label: "Места" },
  ];

  if (tour.itinerary?.length) {
    links.push({ id: "itinerary", label: "Программа" });
  }

  links.push({ id: "included", label: "Включено" });

  if (tourHasAccommodation(tour)) {
    links.push({ id: "accommodations", label: "Проживание" });
  }

  links.push({ id: "arrival", label: "Добраться" });

  if (tour.routePoints?.length) {
    links.push({ id: "route-map", label: "Карта" });
  }

  links.push(
    { id: "important", label: "Важно" },
    { id: "faq", label: "FAQ" },
    { id: "dates", label: "Даты" },
    { id: "organizer", label: "Организатор" },
    { id: "reviews", label: "Отзывы" }
  );

  if (hasSimilarTours) {
    links.push({ id: "similar", label: "Похожие" });
  }

  return links;
}
