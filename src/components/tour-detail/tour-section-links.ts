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
    { id: "places", label: "Впечатления" },
  ];

  if (tour.itinerary?.length) {
    links.push({ id: "itinerary", label: "Программа" });
  }

  links.push({ id: "included", label: "Что включено" });

  if (tourHasAccommodation(tour)) {
    links.push({ id: "accommodations", label: "Проживание" });
  }

  links.push({ id: "important", label: "Важно" });

  if (tour.routePoints?.length || tour.arrival) {
    links.push({
      id: "route-map",
      label: tour.routePoints?.length ? "Карта" : "Добраться",
    });
  }

  links.push(
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
