import type { TourDetail, TourListing } from "@/types";
import {
  PARTNER_TRIPSTER_BADGE_HINT,
  PARTNER_TRIPSTER_BADGE_LABEL,
} from "@/lib/tripster/partner-tour-utils";
import {
  PARTNER_YOUTRAVEL_BADGE_HINT,
  PARTNER_YOUTRAVEL_BADGE_LABEL,
  isYouTravelPartnerListing,
} from "@/lib/youtravel/partner-tour-utils";

export function resolvePartnerTourBadge(
  tour: Pick<TourListing | TourDetail, "partnerSource" | "id">
): { label: string; hint: string } | null {
  if (isYouTravelPartnerListing(tour)) {
    return { label: PARTNER_YOUTRAVEL_BADGE_LABEL, hint: PARTNER_YOUTRAVEL_BADGE_HINT };
  }
  if (tour.partnerSource === "tripster" || tour.id.startsWith("tripster-")) {
    return { label: PARTNER_TRIPSTER_BADGE_LABEL, hint: PARTNER_TRIPSTER_BADGE_HINT };
  }
  return null;
}
