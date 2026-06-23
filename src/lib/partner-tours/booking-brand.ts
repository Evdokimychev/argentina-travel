import type { TourDetail, TourListing } from "@/types";
import { isYouTravelPartnerListing } from "@/lib/youtravel/partner-tour-utils";

type PartnerBookingContext = {
  partnerSource?: TourDetail["partnerSource"] | TourListing["partnerSource"];
  id: string;
  customBookingLink?: TourDetail["customBookingLink"];
};

export function resolvePartnerBookingBrand(
  tour: Pick<TourDetail | TourListing, "partnerSource" | "id">
): "YouTravel.me" | "Tripster" | null {
  if (isYouTravelPartnerListing(tour)) return "YouTravel.me";
  if (tour.partnerSource === "tripster" || tour.id.startsWith("tripster-")) return "Tripster";
  return null;
}

export function resolvePartnerBookingCta(tour: PartnerBookingContext): string {
  const brand = resolvePartnerBookingBrand(tour);
  if (tour.customBookingLink?.label?.trim()) return tour.customBookingLink.label.trim();
  if (brand === "YouTravel.me") return "Забронировать на YouTravel.me";
  if (brand === "Tripster") return "Забронировать на Tripster";
  return "Забронировать";
}

export function resolvePartnerDatesBookingLinkLabel(
  tour: PartnerBookingContext,
  selected: boolean
): string {
  const cta = resolvePartnerBookingCta(tour);
  if (selected) return cta;
  if (cta.startsWith("Забронировать ")) {
    return `Выбрать дату и ${cta.charAt(0).toLowerCase()}${cta.slice(1)}`;
  }
  return `Выбрать дату — ${cta}`;
}

export function resolvePartnerScheduleSubtitle(
  tour: Pick<TourDetail, "partnerSource" | "id" | "partnerPriceDisplay">
): string | undefined {
  const brand = resolvePartnerBookingBrand(tour);
  if (tour.partnerPriceDisplay && brand) {
    return `Стоимость на ${brand}: ${tour.partnerPriceDisplay} · выберите дату заезда`;
  }
  return "Выберите дату заезда — стоимость обновится в карточке бронирования";
}
