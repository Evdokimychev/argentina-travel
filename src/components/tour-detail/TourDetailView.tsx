"use client";

import Link from "next/link";
import { TourDetail } from "@/types";
import type { SimilarTourCard } from "@/lib/tours-server";
import { cn } from "@/lib/cn";
import { siteContainerClass, siteStickyPanelMaxHeightClass, siteStickyPanelTopClass } from "@/lib/site-container";
import { tourDetailSectionStackClass, tourDetailStickyPanelClass } from "@/lib/tour-detail-ui";
import TourStatsSection from "./TourStatsSection";
import DescriptionSection from "./DescriptionSection";
import ItinerarySection from "./ItinerarySection";
import OrganizerSection from "./OrganizerSection";
import PartnerTourOrganizerSection from "./PartnerTourOrganizerSection";
import ReviewsSection from "./ReviewsSection";
import AccommodationsSection from "./AccommodationsSection";
import IncludedExcludedSection from "./IncludedExcludedSection";
import { ImportantSection } from "./ArrivalSection";
import FAQSection from "./FAQSection";
import DatesSection from "./DatesSection";
import GroupTripsSection from "@/components/group-trips/GroupTripsSection";
import SimilarToursSection from "./SimilarToursSection";
import TourSidebar from "./TourSidebar";
import RouteMapSection from "./RouteMapSection";
import LogisticsDetailSection from "./LogisticsDetailSection";
import TourPoliciesSection from "./TourPoliciesSection";
import PackingListSection from "./PackingListSection";
import { TourBookingProvider } from "./TourBookingContext";
import MobileBookingBar from "./MobileBookingBar";
import TourCheckoutModal from "./checkout/TourCheckoutModal";
import TourPriceRequestModal from "./TourPriceRequestModal";
import TourWaitlistModal from "./TourWaitlistModal";
import PartnerTourBookingModal from "./PartnerTourBookingModal";
import TourSectionNav from "./TourSectionNav";
import PrivateTourBanner from "./PrivateTourBanner";
import PartnerTourBanner from "./PartnerTourBanner";
import PartnerTourStatsSection from "./PartnerTourStatsSection";
import PartnerTourDescriptionSection from "./PartnerTourDescriptionSection";
import PartnerTourIncludedSection from "./PartnerTourIncludedSection";
import PartnerTourComfortSection from "./PartnerTourComfortSection";
import PartnerTourOrgDetailsSection from "./PartnerTourOrgDetailsSection";
import PartnerTourAccommodationSection from "./PartnerTourAccommodationSection";
import PartnerTourMeetingSection from "./PartnerTourMeetingSection";
import PartnerTourDatesSection from "./PartnerTourDatesSection";
import PartnerTourBookingConditionsSection from "./PartnerTourBookingConditionsSection";
import PartnerTourImportantSection from "./PartnerTourImportantSection";
import PartnerTourArrivalInfoSection from "./PartnerTourArrivalInfoSection";
import PartnerTourProgramNotice from "./PartnerTourProgramNotice";
import TourPreviewBanner from "./TourPreviewBanner";
import ReviewPromptBanner from "./ReviewPromptBanner";
import TourReviewPanel from "./TourReviewPanel";
import TourDetailHeader from "./TourDetailHeader";
import TourDetailGallery from "./TourDetailGallery";
import { PartnerInfoAutoplayGallery } from "@/components/shared/PartnerInfoAutoplayGallery";
import { buildTourSectionLinks } from "./tour-section-links";
import { tourHasAccommodation } from "@/lib/tour-accommodation";
import { getTourSectionOrganizerComment } from "@/lib/tour-detail-section-comments";
import { tourUsesExternalBooking } from "@/lib/tour-custom-booking-link";
import { isPartnerTourDetail } from "@/lib/tripster/partner-tour-utils";
import { isYouTravelPartnerDetail } from "@/lib/youtravel/partner-tour-utils";
import { resolvePartnerTourSections } from "@/lib/tripster/partner-tour-visibility";
import { useRepositoryTourDetail } from "@/hooks/useRepositoryTourDetail";
import { useCanonicalTour } from "@/hooks/useCanonicalTour";
import PlacesSection from "./PlacesSection";
import TourRelatedPlacesSection from "./TourRelatedPlacesSection";
import type { Tour } from "@/types/tour";
import type { PlaceListing } from "@/types/place";
import { Suspense, useEffect, useMemo, type ReactNode } from "react";
import { useTrackEntityView } from "@/hooks/useInteractionTracking";
import { resolveRelatedPlacesForTour } from "@/lib/cms-content-cross-links";

interface TourDetailViewProps {
  slug: string;
  tour?: TourDetail | null;
  similarTours: SimilarTourCard[];
  /** SSR snapshot — keeps header/sections in sync on first paint */
  initialCanonicalTour?: Tour | null;
  flightLogisticsSection?: ReactNode;
  flightLogisticsNavLabel?: string;
  previewMode?: boolean;
  previewCanonicalTour?: Tour | null;
  previewEditHref?: string;
  previewIsPublished?: boolean;
  previewPublishBlockingCount?: number;
  initialDepartureDate?: string | null;
  catalogPlaces?: PlaceListing[];
}

export default function TourDetailView({
  slug,
  tour: initialTour,
  similarTours,
  initialCanonicalTour = null,
  flightLogisticsSection,
  flightLogisticsNavLabel,
  previewMode = false,
  previewCanonicalTour = null,
  previewEditHref,
  previewIsPublished = false,
  previewPublishBlockingCount = 0,
  initialDepartureDate = null,
  catalogPlaces = [],
}: TourDetailViewProps) {
  useTrackEntityView("tour", previewMode ? null : slug, {
    title: initialTour?.title,
    priceUsd: initialTour?.priceUsd,
    organizerId: initialTour?.organizer?.slug,
  });

  const syncedTour = useRepositoryTourDetail(slug, initialTour);
  const liveCanonicalTour = useCanonicalTour(slug, initialCanonicalTour);
  const tour = previewMode ? initialTour ?? null : syncedTour;
  const canonicalTour = previewMode ? previewCanonicalTour : liveCanonicalTour;
  const relatedCatalogPlaces = useMemo(
    () => (tour ? resolveRelatedPlacesForTour(tour, catalogPlaces) : []),
    [tour, catalogPlaces],
  );

  useEffect(() => {
    if (!tour || !initialDepartureDate?.trim()) return;
    const target = document.getElementById("booking");
    if (!target) return;
    window.requestAnimationFrame(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [initialDepartureDate, tour?.slug]);

  if (!tour) {
    return (
      <div className={cn(siteContainerClass, "py-24 text-center")}>
        <h1 className="font-display text-2xl font-bold text-charcoal">Тур не найден</h1>
        <p className="mt-2 text-slate">
          Возможно, тур ещё не опубликован, скрыт или доступен только по персональной ссылке от
          организатора.
        </p>
        <Link href="/tours" className="mt-6 inline-block text-sm font-medium text-brand hover:underline">
          Вернуться в каталог
        </Link>
      </div>
    );
  }

  const sectionLinks = buildTourSectionLinks(tour, {
    hasSimilarTours: similarTours.length > 0,
    canonicalTour,
    flightLogisticsLabel: flightLogisticsNavLabel,
  });
  const usesExternalBooking = tourUsesExternalBooking(tour);
  const isPartnerTour = isPartnerTourDetail(tour);
  const partnerContent = tour.partnerContent;
  const partnerSections =
    isPartnerTour && partnerContent
      ? resolvePartnerTourSections(tour, partnerContent)
      : null;
  const partnerBookingHref =
    tour.customBookingLink?.url ?? `/api/affiliate/go/${tour.slug}`;
  const partnerDisplayReviews =
    tour.reviews.length > 0 ? tour.reviews : (tour.partnerGuideReviews ?? []);
  const partnerReviewHeadingNote =
    tour.reviews.length === 0 && (tour.partnerGuideReviews?.length ?? 0) > 0
      ? isYouTravelPartnerDetail(tour)
        ? "о тревел-эксперте на YouTravel.me"
        : "о гиде на других турах Tripster"
      : undefined;
  const youTravelActivityFooter =
    isYouTravelPartnerDetail(tour) && partnerContent?.activityLevel
      ? {
          sectionLabel: "Активность",
          levelLabel: partnerContent.activityLabel,
          levelDescription: partnerContent.activityDescription,
          dotCount: partnerContent.activityLevel,
          hideHelpPopover: true,
          organizerComment:
            partnerContent.activityExpertComment?.trim() ||
            tour.itineraryOrganizerComment?.trim() ||
            undefined,
          organizerCommentLabel: "Комментарий тревел-эксперта",
        }
      : undefined;
  const isYouTravel = isYouTravelPartnerDetail(tour);

  return (
    <TourBookingProvider tour={tour} initialDepartureDate={initialDepartureDate}>
      {previewMode && previewEditHref ? (
        <TourPreviewBanner
          title={tour.title}
          editHref={previewEditHref}
          isPublished={previewIsPublished}
          publishBlockingCount={previewPublishBlockingCount}
        />
      ) : null}

      <Suspense fallback={null}>
        <ReviewPromptBanner tourSlug={tour.slug} isPartnerTour={isPartnerTour} />
      </Suspense>

      <div className={cn(siteContainerClass, "pt-4 sm:pt-5 lg:pt-6")}>
        <TourDetailGallery
          images={tour.gallery}
          title={tour.title}
          layoutSeed={tour.slug}
        />
      </div>

      <TourDetailHeader tour={tour} canonicalTour={canonicalTour} />
      {tour.isPrivate ? (
        <div className={cn(siteContainerClass, "mt-4")}>
          <PrivateTourBanner />
        </div>
      ) : null}
      {isPartnerTour ? (
        <div className={cn(siteContainerClass, "mt-4")}>
          <PartnerTourBanner partnerSource={tour.partnerSource ?? null} />
        </div>
      ) : null}

      <TourSectionNav items={sectionLinks} />

      <div className="bg-surface-muted pb-24 lg:pb-16">
        <div className={cn(siteContainerClass, "py-6 md:py-10")}>
          <div className="grid gap-6 lg:grid-cols-[1fr_360px] xl:gap-10">
            <div className={cn("min-w-0", tourDetailSectionStackClass)}>
              {isPartnerTour && partnerContent && partnerSections ? (
                <>
                  {partnerSections.stats ? (
                    <PartnerTourStatsSection tour={tour} content={partnerContent} />
                  ) : null}
                  {tour.gallery.length >= 2 ? (
                    <PartnerInfoAutoplayGallery images={tour.gallery} title={tour.title} />
                  ) : null}
                  {partnerSections.description ? (
                    <PartnerTourDescriptionSection content={partnerContent} />
                  ) : null}
                  {partnerSections.itinerary ? (
                    <ItinerarySection
                      days={tour.itinerary}
                      tour={tour}
                      showPdfDownload={false}
                      hideProgramFooter={!youTravelActivityFooter}
                      programFooter={youTravelActivityFooter}
                    />
                  ) : partnerSections.programNotice ? (
                    <PartnerTourProgramNotice bookingHref={partnerBookingHref} />
                  ) : null}
                  {!isYouTravel && (partnerSections.dates || isPartnerTour) ? (
                    <PartnerTourDatesSection tour={tour} />
                  ) : null}
                  {partnerSections.included ? (
                    <PartnerTourIncludedSection content={partnerContent} />
                  ) : null}
                  {partnerSections.orgDetails ? (
                    <PartnerTourOrgDetailsSection
                      key={`${tour.slug}-org-details`}
                      content={partnerContent}
                    />
                  ) : null}
                  {partnerSections.accommodations ? (
                    <PartnerTourAccommodationSection
                      tour={tour}
                      content={partnerContent}
                      accommodations={tour.accommodations}
                    />
                  ) : null}
                  {partnerSections.comfort ? (
                    <PartnerTourComfortSection content={partnerContent} />
                  ) : null}
                  {partnerSections.meeting && !(isYouTravel && partnerSections.arrivalInfo) ? (
                    <PartnerTourMeetingSection content={partnerContent} />
                  ) : null}
                  {partnerSections.important && isYouTravel ? (
                    <PartnerTourImportantSection content={partnerContent} />
                  ) : null}
                  {isYouTravel && partnerSections.arrivalInfo ? (
                    <PartnerTourArrivalInfoSection tour={tour} content={partnerContent} />
                  ) : null}
                  {isYouTravel && partnerSections.routeMap ? (
                    <RouteMapSection
                      points={tour.routePoints}
                      arrival={tour.arrival}
                      tourSlug={tour.slug}
                      tourId={tour.id}
                    />
                  ) : null}
                  {isYouTravel && (partnerSections.dates || isPartnerTour) ? (
                    <PartnerTourDatesSection tour={tour} />
                  ) : null}
                  {isYouTravel && partnerContent ? (
                    <PartnerTourBookingConditionsSection tour={tour} content={partnerContent} />
                  ) : null}
                  {partnerSections.important && !isYouTravel ? (
                    <ImportantSection
                      items={tour.importantInfo}
                      organizerComment={getTourSectionOrganizerComment(tour, "important")}
                    />
                  ) : null}
                  {tour.partnerGuideProfile ? (
                    <PartnerTourOrganizerSection
                      guide={tour.partnerGuideProfile}
                      organizer={tour.organizer}
                      partnerSource={isYouTravelPartnerDetail(tour) ? "youtravel" : "tripster"}
                    />
                  ) : (
                    <OrganizerSection
                      organizer={tour.organizer}
                      comment={tour.organizerComment}
                      tourSlug={tour.slug}
                    />
                  )}
                  {partnerSections.reviews ? (
                    <ReviewsSection
                      reviews={partnerDisplayReviews}
                      headingNote={partnerReviewHeadingNote}
                    />
                  ) : null}
                  {!previewMode ? <SimilarToursSection tours={similarTours} /> : null}
                </>
              ) : (
                <>
              <TourStatsSection
                tour={tour}
                maximumAge={canonicalTour?.participants.maximumAge}
                maxWeightEnabled={canonicalTour?.participants.maxWeightEnabled}
                maxWeightKg={canonicalTour?.participants.maxWeightKg}
                languages={canonicalTour?.participants.languages}
              />
              <DescriptionSection
                blocks={tour.descriptionBlocks}
                extra={tour.descriptionExtra!}
                organizerComment={getTourSectionOrganizerComment(tour, "description")}
              />
              <PlacesSection
                places={tour.places}
                organizerComment={getTourSectionOrganizerComment(tour, "places")}
              />
              <TourRelatedPlacesSection places={relatedCatalogPlaces} />
              {tour.itinerary?.length ? (
                <ItinerarySection
                  days={tour.itinerary}
                  tour={tour}
                  showPdfDownload={!previewMode && !isPartnerTour}
                />
              ) : null}
              {!isPartnerTour ? (
                <DatesSection
                  tour={tour}
                  canonicalTour={canonicalTour}
                  organizerComment={getTourSectionOrganizerComment(tour, "dates")}
                />
              ) : null}
              {!isPartnerTour && !previewMode && tour.dates.length > 0 ? (
                <GroupTripsSection tour={tour} />
              ) : null}
              <IncludedExcludedSection
                included={tour.included}
                excluded={tour.excluded}
                organizerComment={getTourSectionOrganizerComment(tour, "included")}
              />
              {tourHasAccommodation(tour) ? (
                <AccommodationsSection
                  accommodations={tour.accommodations}
                  durationNights={tour.durationNights}
                  comfortLevel={tour.comfort}
                  comfortLevels={tour.comfortLevels}
                  comfortDescriptionHtml={tour.descriptionExtra?.comfort}
                  organizerComment={getTourSectionOrganizerComment(tour, "accommodations")}
                />
              ) : null}
              {!isPartnerTour && canonicalTour ? (
                <PackingListSection
                  tour={canonicalTour}
                  organizerComment={getTourSectionOrganizerComment(tour, "packing")}
                />
              ) : null}
              {!isPartnerTour && canonicalTour ? (
                <TourPoliciesSection
                  tour={canonicalTour}
                  organizerComment={getTourSectionOrganizerComment(tour, "policies")}
                />
              ) : null}
              <ImportantSection
                items={tour.importantInfo}
                organizerComment={getTourSectionOrganizerComment(tour, "important")}
              />
              {flightLogisticsSection}
              {!isPartnerTour && canonicalTour ? (
                <LogisticsDetailSection
                  tour={canonicalTour}
                  organizerComment={getTourSectionOrganizerComment(tour, "logistics")}
                />
              ) : null}
              {!isPartnerTour ? (
                <RouteMapSection
                  points={tour.routePoints}
                  arrival={tour.arrival}
                  logistics={canonicalTour?.logistics}
                  routeMapImage={canonicalTour?.program.routeMapImage}
                  organizerComment={getTourSectionOrganizerComment(tour, "routeMap")}
                  tourSlug={tour.slug}
                  tourId={tour.id}
                />
              ) : null}
              <FAQSection
                faq={tour.faq}
                organizerComment={getTourSectionOrganizerComment(tour, "faq")}
              />
              <OrganizerSection
                organizer={tour.organizer}
                comment={tour.organizerComment}
                tourSlug={tour.slug}
                guides={canonicalTour?.team.guides}
              />
              {!previewMode ? (
                <TourReviewPanel tour={tour} organizerTourId={canonicalTour?.id} />
              ) : null}
              <ReviewsSection reviews={tour.reviews} />
              {!previewMode ? <SimilarToursSection tours={similarTours} /> : null}
                </>
              )}
            </div>

            <aside className="hidden lg:block lg:w-full">
              <div
                className={cn(
                  tourDetailStickyPanelClass,
                  siteStickyPanelTopClass,
                  siteStickyPanelMaxHeightClass
                )}
              >
                <TourSidebar tour={tour} canonicalTour={canonicalTour} previewMode={previewMode} />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {!previewMode ? <MobileBookingBar tour={tour} /> : null}
      {!previewMode && usesExternalBooking && isPartnerTour ? (
        <PartnerTourBookingModal tour={tour} />
      ) : null}
      {!previewMode && !usesExternalBooking && tour.priceOnRequest ? (
        <TourPriceRequestModal tour={tour} />
      ) : null}
      {!previewMode && !usesExternalBooking && !tour.priceOnRequest ? (
        <TourCheckoutModal tour={tour} />
      ) : null}
      {!previewMode &&
      !usesExternalBooking &&
      tour.waitlistEnabled &&
      !tour.priceOnRequest ? (
        <TourWaitlistModal tour={tour} />
      ) : null}
    </TourBookingProvider>
  );
}
