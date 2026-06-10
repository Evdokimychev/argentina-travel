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
