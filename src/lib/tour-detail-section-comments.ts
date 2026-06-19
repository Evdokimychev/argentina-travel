import type { TourDetail } from "@/types";
import { resolveSectionOrganizerComment } from "@/lib/tour-section-comments";
import type { TourSectionCommentId } from "@/types/tour-section-comments";

const LEGACY_SECTION_COMMENT: Partial<
  Record<TourSectionCommentId, (tour: TourDetail) => string | undefined>
> = {
  itinerary: (tour) => tour.itineraryOrganizerComment,
  accommodations: (tour) => tour.accommodationOrganizerComment,
};

export function getTourSectionOrganizerComment(
  tour: Pick<
    TourDetail,
    "sectionOrganizerComments" | "itineraryOrganizerComment" | "accommodationOrganizerComment"
  >,
  sectionId: TourSectionCommentId
): string | undefined {
  return resolveSectionOrganizerComment(
    tour.sectionOrganizerComments,
    sectionId,
    LEGACY_SECTION_COMMENT[sectionId]?.(tour as TourDetail)
  );
}
