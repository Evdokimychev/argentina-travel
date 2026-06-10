import type { OrganizerArrivalDepartureCity } from "@/data/tour-logistics-defaults";
import { buildPlaneSchedulePreview } from "@/data/tour-logistics-defaults";
import { ORGANIZER_TOUR_DISCOUNT_OPTIONS } from "@/data/tour-discount-defaults";
import {
  ORGANIZER_TOUR_INSURANCE_OPTIONS,
  textToListItems,
} from "@/data/tour-terms-defaults";
import { buildCancellationTouristPreviewFull } from "@/lib/organizer-cancellation-preview";
import { readOrganizerProfile } from "@/lib/organizer-profile-store";
import type { Tour } from "@/types/tour";

const DEFAULT_ORGANIZER_USER_ID = "ivan-evdokimychev";

export function resolveCancellationText(tour: Tour): string {
  const cancellation = tour.terms.cancellation;
  if (!cancellation) return "";

  if (cancellation.useTemplate) {
    const profile = readOrganizerProfile(DEFAULT_ORGANIZER_USER_ID);
    return buildCancellationTouristPreviewFull(profile.cancellation);
  }

  return cancellation.customText.trim();
}

export function resolveInsuranceLabel(tour: Tour): string {
  const type = tour.terms.insurance?.type;
  if (!type) return "";
  return ORGANIZER_TOUR_INSURANCE_OPTIONS.find((option) => option.value === type)?.label ?? "";
}

export function resolvePackingListItems(tour: Tour): string[] {
  const packing = tour.terms.packingList;
  if (!packing?.enabled || !packing.text.trim()) return [];
  return textToListItems(packing.text);
}

export function resolveEnabledDiscountLabels(tour: Tour): string[] {
  return tour.pricing.enabledDiscounts
    .map((id) => ORGANIZER_TOUR_DISCOUNT_OPTIONS.find((option) => option.id === id))
    .filter(Boolean)
    .map((option) => option!.label);
}

export function formatArrivalDepartureCity(city: OrganizerArrivalDepartureCity): {
  title: string;
  schedule: string;
  transport: string[];
  comment: string;
} {
  const transport: string[] = [];
  if (city.plane.enabled) transport.push("Самолёт");
  if (city.trainEnabled) transport.push("Поезд");
  if (city.otherEnabled) transport.push("Другой транспорт");

  return {
    title: city.city,
    schedule: buildPlaneSchedulePreview(city),
    transport,
    comment: city.comment.trim(),
  };
}

export function hasTicketRecommendations(tour: Tour): boolean {
  return (
    tour.logistics.ticketRecommendationsEnabled &&
    tour.logistics.ticketRecommendationsText.trim().length > 0
  );
}

export function hasArrivalDepartureLogistics(tour: Tour): boolean {
  return (
    tour.logistics.arrivalDepartureEnabled &&
    tour.logistics.arrivalDepartureCities.some((city) => city.city.trim())
  );
}

export function hasVisibleGuides(tour: Tour): boolean {
  return tour.team.guides.some((guide) => guide.name.trim());
}

export function hasTourPolicies(tour: Tour): boolean {
  const insurance = tour.terms.insurance;
  const hasInsurance =
    insurance &&
    insurance.type !== "not_required" &&
    (resolveInsuranceLabel(tour) || insurance.description.trim());

  return Boolean(hasInsurance || resolveCancellationText(tour).trim());
}

/** Rating label for listings — never show raw zero without reviews. */
export function resolveTourRatingLabel(tour: {
  rating: number;
  reviewCount: number;
}): { hasReviews: boolean; ratingText: string; badgeLabel: string } {
  const hasReviews = tour.reviewCount > 0;
  if (!hasReviews) {
    return { hasReviews: false, ratingText: "", badgeLabel: "Новый" };
  }
  return {
    hasReviews: true,
    ratingText: String(tour.rating),
    badgeLabel: `${tour.rating}`,
  };
}

export function resolveOrganizerRatingDisplay(organizer: {
  rating: number;
  reviewCount?: number;
}): { show: boolean; label: string; isNew: boolean } {
  const reviewCount = organizer.reviewCount ?? 0;
  if (reviewCount > 0 && organizer.rating > 0) {
    return { show: true, label: organizer.rating.toFixed(1), isNew: false };
  }
  return { show: true, label: "Новый организатор", isNew: true };
}

export function resolveOrganizerTourCountDisplay(tourCount: number): string | null {
  if (tourCount <= 0) return "Первый тур на площадке";
  return null;
}

export function resolveOrganizerTravelerCountDisplay(travelerCount: number): string | null {
  if (travelerCount <= 0) return null;
  return `${travelerCount}+ путешественников`;
}

export function hasTourDatesSection(tour: {
  dates: unknown[];
  bookingMode?: string;
}): boolean {
  if (tour.dates.length > 0) return true;
  return tour.bookingMode === "on_request" || tour.bookingMode === "both";
}

export function hasFaqContent(faq: Array<{ question?: string; answer?: string }>): boolean {
  return faq.some((item) => item.question?.trim() && item.answer?.trim());
}

export function hasPlacesContent(
  places: Array<{ title?: string; description?: string; image?: string }>
): boolean {
  return places.some((place) => place.title?.trim() || place.description?.trim());
}

export function hasTermsListContent(items: string[]): boolean {
  return items.some((item) => item.trim());
}

/** Теги вида «10 дней (9 ночей)» — длительность уже показана отдельно */
const TOUR_DURATION_TAG =
  /^\d+\s*(?:день|дня|дней|дн\.?)(?:\s*\(\s*\d+\s*(?:ночь|ночи|ночей|нч\.?)\s*\))?$/i;

export function isTourDurationTag(tag: string): boolean {
  return TOUR_DURATION_TAG.test(tag.trim());
}

export function filterTourDisplayTags(tags: string[]): string[] {
  return tags.map((tag) => tag.trim()).filter(Boolean).filter((tag) => !isTourDurationTag(tag));
}
