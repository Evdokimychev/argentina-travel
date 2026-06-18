import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import { partnerContentHasAccommodation } from "@/lib/tripster/partner-tour-accommodation";
import type { PartnerTourExperienceRow } from "@/lib/tripster/partner-tour-mapper";
import type { TripsterExperience } from "@/lib/tripster/types";
import type { TourDetail } from "@/types";

const INACTIVE_STATUSES = new Set(["archived", "deleted", "draft", "inactive", "hidden"]);

export function isPartnerTourExperiencePublishable(
  row: Pick<PartnerTourExperienceRow, "status" | "payload">
): boolean {
  const payload = row.payload as TripsterExperience | undefined;
  const status = (row.status ?? payload?.status ?? "").trim().toLowerCase();

  if (payload?.is_visible === false) return false;
  if (status && INACTIVE_STATUSES.has(status)) return false;

  return true;
}

export type PartnerTourSectionFlags = {
  stats: boolean;
  description: boolean;
  itinerary: boolean;
  programNotice: boolean;
  dates: boolean;
  included: boolean;
  orgDetails: boolean;
  accommodations: boolean;
  comfort: boolean;
  meeting: boolean;
  important: boolean;
  reviews: boolean;
};

export function resolvePartnerTourSections(
  tour: TourDetail,
  content: PartnerTourContent
): PartnerTourSectionFlags {
  const hasOrgDetails = Boolean(
    content.orgDetailsIntroHtml?.trim() ||
      content.orgDetailsItems?.length ||
      content.orgDetailsExtraHtml?.trim()
  );

  const hasAccommodations =
    partnerContentHasAccommodation(content, tour.durationNights) ||
    tour.accommodations.length > 0;

  return {
    stats: true,
    description: content.blocks.length > 0 || Boolean(content.introHtml?.trim()),
    itinerary: (tour.itinerary?.length ?? 0) > 0,
    programNotice: !(tour.itinerary?.length ?? 0),
    dates: tour.dates.length > 0,
    included: Boolean(content.includedHtml?.trim() || content.excludedHtml?.trim()),
    orgDetails: hasOrgDetails,
    accommodations: hasAccommodations,
    comfort: Boolean(content.comfortHtml?.trim()),
    meeting: Boolean(content.meetingPoint?.trim() || content.finishPoint?.trim()),
    important:
      (tour.importantInfo ?? []).some((item) => item.trim()) ||
      Boolean(content.additionalInfoHtml?.trim()),
    reviews:
      tour.reviews.length > 0 ||
      tour.reviewCount > 0 ||
      (tour.partnerGuideReviews?.length ?? 0) > 0 ||
      (tour.organizer.reviewCount ?? 0) > 0,
  };
}
