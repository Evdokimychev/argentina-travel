import type { ReactNode } from "react";
import type { TourDetail, TourDescriptionExtra } from "@/types";
import type { Tour } from "@/types/tour";
import type { PlaceListing } from "@/types/place";
import type { SimilarTourCard } from "@/lib/tours-server";
import {
  resolveNativeTourLayoutOrder,
  type NativeTourLayoutSlotId,
} from "@/lib/tour-detail/native-tour-layout-registry";
import { getTourSectionOrganizerComment } from "@/lib/tour-detail-section-comments";
import { tourHasAccommodation } from "@/lib/tour-accommodation";
import TourStatsSection from "@/components/tour-detail/TourStatsSection";
import DescriptionSection from "@/components/tour-detail/DescriptionSection";
import PlacesSection from "@/components/tour-detail/PlacesSection";
import TourRelatedPlacesSection from "@/components/tour-detail/TourRelatedPlacesSection";
import ItinerarySection from "@/components/tour-detail/ItinerarySection";
import DatesSection from "@/components/tour-detail/DatesSection";
import GroupTripsSection from "@/components/group-trips/GroupTripsSection";
import IncludedExcludedSection from "@/components/tour-detail/IncludedExcludedSection";
import AccommodationsSection from "@/components/tour-detail/AccommodationsSection";
import PackingListSection from "@/components/tour-detail/PackingListSection";
import TourPoliciesSection from "@/components/tour-detail/TourPoliciesSection";
import { ImportantSection } from "@/components/tour-detail/ArrivalSection";
import LogisticsDetailSection from "@/components/tour-detail/LogisticsDetailSection";
import RouteMapSection from "@/components/tour-detail/RouteMapSection";
import FAQSection from "@/components/tour-detail/FAQSection";
import OrganizerSection from "@/components/tour-detail/OrganizerSection";
import OnDemandTourReviewPanel from "@/components/tour-detail/OnDemandTourReviewPanel";
import ReviewsSection from "@/components/tour-detail/ReviewsSection";
import SimilarToursSection from "@/components/tour-detail/SimilarToursSection";

const EMPTY_DESCRIPTION_EXTRA: TourDescriptionExtra = {
  difficulty: "",
  seasonality: "",
  packing: [],
  flights: "",
  meals: "",
  comfort: "",
  transfers: "",
};

export type NativeTourMainColumnContext = {
  tour: TourDetail;
  canonicalTour: Tour | null;
  relatedCatalogPlaces: PlaceListing[];
  similarTours: SimilarTourCard[];
  previewMode: boolean;
  isPartnerTour: boolean;
  flightLogisticsSection?: ReactNode;
};

/**
 * Compose the native (platform) tour detail main column from layout slots.
 * Default order matches the historical hardcoded JSX in TourDetailView.
 * Optional overrideOrder is for future CMS / A-B layout experiments.
 * Partner Tripster/YouTravel branches stay outside this composer.
 */
export function composeNativeTourMainColumn(
  ctx: NativeTourMainColumnContext,
  overrideOrder?: readonly string[] | null,
): ReactNode[] {
  const order = resolveNativeTourLayoutOrder(overrideOrder);
  const nodes: ReactNode[] = [];

  for (const slotId of order) {
    const node = renderNativeTourLayoutSlot(slotId, ctx);
    if (node != null) nodes.push(node);
  }

  return nodes;
}

function renderNativeTourLayoutSlot(
  slotId: NativeTourLayoutSlotId,
  ctx: NativeTourMainColumnContext,
): ReactNode {
  const {
    tour,
    canonicalTour,
    relatedCatalogPlaces,
    similarTours,
    previewMode,
    isPartnerTour,
    flightLogisticsSection,
  } = ctx;

  switch (slotId) {
    case "stats":
      return (
        <TourStatsSection
          key={slotId}
          tour={tour}
          maximumAge={canonicalTour?.participants.maximumAge}
          maxWeightEnabled={canonicalTour?.participants.maxWeightEnabled}
          maxWeightKg={canonicalTour?.participants.maxWeightKg}
          languages={canonicalTour?.participants.languages}
        />
      );
    case "description":
      return (
        <DescriptionSection
          key={slotId}
          blocks={tour.descriptionBlocks}
          extra={tour.descriptionExtra ?? EMPTY_DESCRIPTION_EXTRA}
          organizerComment={getTourSectionOrganizerComment(tour, "description")}
        />
      );
    case "places":
      return (
        <PlacesSection
          key={slotId}
          places={tour.places}
          organizerComment={getTourSectionOrganizerComment(tour, "places")}
        />
      );
    case "related-places":
      return <TourRelatedPlacesSection key={slotId} places={relatedCatalogPlaces} />;
    case "itinerary":
      return tour.itinerary?.length ? (
        <ItinerarySection
          key={slotId}
          days={tour.itinerary}
          tour={tour}
          showPdfDownload={!previewMode && !isPartnerTour}
        />
      ) : null;
    case "dates":
      return !isPartnerTour ? (
        <DatesSection
          key={slotId}
          tour={tour}
          canonicalTour={canonicalTour}
          organizerComment={getTourSectionOrganizerComment(tour, "dates")}
        />
      ) : null;
    case "group-trips":
      return !isPartnerTour && !previewMode && tour.dates.length > 0 ? (
        <GroupTripsSection key={slotId} tour={tour} />
      ) : null;
    case "included":
      return (
        <IncludedExcludedSection
          key={slotId}
          included={tour.included}
          excluded={tour.excluded}
          organizerComment={getTourSectionOrganizerComment(tour, "included")}
        />
      );
    case "accommodations":
      return tourHasAccommodation(tour) ? (
        <AccommodationsSection
          key={slotId}
          accommodations={tour.accommodations}
          durationNights={tour.durationNights}
          comfortLevel={tour.comfort}
          comfortLevels={tour.comfortLevels}
          comfortDescriptionHtml={tour.descriptionExtra?.comfort}
          organizerComment={getTourSectionOrganizerComment(tour, "accommodations")}
        />
      ) : null;
    case "packing":
      return !isPartnerTour && canonicalTour ? (
        <PackingListSection
          key={slotId}
          tour={canonicalTour}
          organizerComment={getTourSectionOrganizerComment(tour, "packing")}
        />
      ) : null;
    case "policies":
      return !isPartnerTour && canonicalTour ? (
        <TourPoliciesSection
          key={slotId}
          tour={canonicalTour}
          organizerComment={getTourSectionOrganizerComment(tour, "policies")}
        />
      ) : null;
    case "important":
      return (
        <ImportantSection
          key={slotId}
          items={tour.importantInfo}
          organizerComment={getTourSectionOrganizerComment(tour, "important")}
        />
      );
    case "flight-logistics":
      return flightLogisticsSection ? (
        <div key={slotId}>{flightLogisticsSection}</div>
      ) : null;
    case "logistics":
      return !isPartnerTour && canonicalTour ? (
        <LogisticsDetailSection
          key={slotId}
          tour={canonicalTour}
          organizerComment={getTourSectionOrganizerComment(tour, "logistics")}
        />
      ) : null;
    case "route-map":
      return !isPartnerTour ? (
        <RouteMapSection
          key={slotId}
          points={tour.routePoints}
          arrival={tour.arrival}
          logistics={canonicalTour?.logistics}
          routeMapImage={canonicalTour?.program.routeMapImage}
          organizerComment={getTourSectionOrganizerComment(tour, "routeMap")}
          tourSlug={tour.slug}
          tourId={tour.id}
        />
      ) : null;
    case "faq":
      return (
        <FAQSection
          key={slotId}
          faq={tour.faq}
          organizerComment={getTourSectionOrganizerComment(tour, "faq")}
        />
      );
    case "organizer":
      return (
        <OrganizerSection
          key={slotId}
          organizer={tour.organizer}
          comment={tour.organizerComment}
          tourSlug={tour.slug}
          guides={canonicalTour?.team.guides}
        />
      );
    case "leave-review":
      return !previewMode ? (
        <OnDemandTourReviewPanel
          key={slotId}
          tour={tour}
          organizerTourId={canonicalTour?.id}
        />
      ) : null;
    case "reviews":
      return <ReviewsSection key={slotId} reviews={tour.reviews} />;
    case "similar":
      return !previewMode ? (
        <SimilarToursSection key={slotId} tours={similarTours} />
      ) : null;
    default: {
      const _exhaustive: never = slotId;
      return _exhaustive;
    }
  }
}
