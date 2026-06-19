import { TourDetail } from "@/types";
import type { Tour } from "@/types/tour";
import { tourHasAccommodation } from "@/lib/tour-accommodation";
import { isPartnerTourDetail } from "@/lib/tripster/partner-tour-utils";
import { resolvePartnerTourSections } from "@/lib/tripster/partner-tour-visibility";
import {
  hasArrivalDepartureLogistics,
  hasTicketRecommendations,
  hasTourPolicies,
  resolvePackingListItems,
  hasFaqContent,
  hasPlacesContent,
  hasTermsListContent,
  hasTourDatesSection,
} from "@/lib/tour-public-display";

export interface TourSectionLink {
  id: string;
  label: string;
}

export interface TourSectionNavContext {
  hasSimilarTours: boolean;
  canonicalTour?: Tour | null;
  flightLogisticsLabel?: string;
}

export function buildTourSectionLinks(
  tour: TourDetail,
  context: TourSectionNavContext | boolean
): TourSectionLink[] {
  const hasSimilarTours = typeof context === "boolean" ? context : context.hasSimilarTours;
  const canonicalTour = typeof context === "boolean" ? null : context.canonicalTour;
  const flightLogisticsLabel =
    typeof context === "boolean" ? undefined : context.flightLogisticsLabel;

  const links: TourSectionLink[] = [];
  const isPartnerTour = isPartnerTourDetail(tour);

  if (isPartnerTour && tour.partnerContent) {
    const sections = resolvePartnerTourSections(tour, tour.partnerContent);

    if (sections.description) {
      links.push({ id: "description", label: "Описание" });
    }
    if (sections.itinerary || sections.programNotice) {
      links.push({ id: "itinerary", label: "Программа" });
    }
    if (sections.dates) {
      links.push({ id: "dates", label: "Даты" });
    }
    if (sections.included) {
      links.push({ id: "included", label: "Условия" });
    }
    if (sections.orgDetails) {
      links.push({ id: "org-details", label: "Организация" });
    }
    if (sections.accommodations) {
      links.push({ id: "accommodations", label: "Проживание" });
    }
    if (sections.comfort) {
      links.push({ id: "comfort", label: "Комфорт" });
    }
    if (sections.meeting) {
      links.push({ id: "meeting", label: "Встреча" });
    }
    if (sections.important) {
      links.push({ id: "important", label: "Важно" });
    }
    links.push({ id: "organizer", label: "Организатор" });
    if (sections.reviews) {
      links.push({ id: "reviews", label: "Отзывы" });
    }
    if (hasSimilarTours) {
      links.push({ id: "similar", label: "Похожие" });
    }
    return links;
  }

  links.push({ id: "description", label: "Описание" });

  if (hasPlacesContent(tour.places)) {
    links.push({ id: "places", label: "Впечатления" });
  }

  if (tour.itinerary?.length) {
    links.push({ id: "itinerary", label: "Программа" });
  }

  if (hasTourDatesSection(tour)) {
    links.push({ id: "dates", label: "Даты" });
  }

  if (hasTermsListContent(tour.included) || hasTermsListContent(tour.excluded)) {
    links.push({ id: "included", label: "Что включено" });
  }

  if (tourHasAccommodation(tour)) {
    links.push({ id: "accommodations", label: "Проживание" });
  }

  if (canonicalTour && resolvePackingListItems(canonicalTour).length > 0) {
    links.push({ id: "packing", label: "Что взять" });
  }

  if (canonicalTour && hasTourPolicies(canonicalTour)) {
    links.push({ id: "policies", label: "Условия" });
  }

  if (tour.importantInfo?.some((item) => item.trim())) {
    links.push({ id: "important", label: "Важно" });
  }

  if (flightLogisticsLabel) {
    links.push({ id: "flight-logistics", label: flightLogisticsLabel });
  }

  if (
    canonicalTour &&
    (hasTicketRecommendations(canonicalTour) || hasArrivalDepartureLogistics(canonicalTour))
  ) {
    links.push({ id: "logistics", label: "Логистика" });
  }

  if (
    tour.routePoints?.length ||
    tour.arrival ||
    canonicalTour?.program.routeMapImage?.trim()
  ) {
    links.push({
      id: "route-map",
      label: tour.routePoints?.length || canonicalTour?.program.routeMapImage?.trim()
        ? "Карта"
        : "Добраться",
    });
  }

  if (hasFaqContent(tour.faq)) {
    links.push({ id: "faq", label: "Вопросы" });
  }

  links.push(
    { id: "organizer", label: "Организатор" },
    { id: "reviews", label: "Отзывы" }
  );

  if (hasSimilarTours) {
    links.push({ id: "similar", label: "Похожие" });
  }

  return links;
}
