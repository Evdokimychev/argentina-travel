"use client";

import Link from "next/link";
import { TourDetail } from "@/types";
import { cn } from "@/lib/cn";
import { siteContainerClass } from "@/lib/site-container";
import TourStatsSection from "./TourStatsSection";
import DescriptionSection from "./DescriptionSection";
import ItinerarySection from "./ItinerarySection";
import OrganizerSection from "./OrganizerSection";
import ReviewsSection from "./ReviewsSection";
import AccommodationsSection from "./AccommodationsSection";
import IncludedExcludedSection from "./IncludedExcludedSection";
import { ImportantSection } from "./ArrivalSection";
import FAQSection from "./FAQSection";
import DatesSection from "./DatesSection";
import SimilarToursSection from "./SimilarToursSection";
import TourSidebar from "./TourSidebar";
import RouteMapSection from "./RouteMapSection";
import LogisticsDetailSection from "./LogisticsDetailSection";
import TourPoliciesSection from "./TourPoliciesSection";
import PackingListSection from "./PackingListSection";
import { TourBookingProvider } from "./TourBookingContext";
import MobileBookingBar from "./MobileBookingBar";
import TourCheckoutModal from "./checkout/TourCheckoutModal";
import TourSectionNav from "./TourSectionNav";
import TourPreviewBanner from "./TourPreviewBanner";
import ReviewPromptBanner from "./ReviewPromptBanner";
import TourDetailHeader from "./TourDetailHeader";
import TourDetailGallery from "./TourDetailGallery";
import { buildTourSectionLinks } from "./tour-section-links";
import { tourHasAccommodation } from "@/lib/tour-accommodation";
import { useRepositoryTourDetail } from "@/hooks/useRepositoryTourDetail";
import { useCanonicalTour } from "@/hooks/useCanonicalTour";
import PlacesSection from "./PlacesSection";
import type { Tour } from "@/types/tour";
import type { ReactNode } from "react";
import { Suspense } from "react";

interface TourDetailViewProps {
  slug: string;
  tour?: TourDetail | null;
  similarTours: TourDetail[];
  /** SSR snapshot — keeps header/sections in sync on first paint */
  initialCanonicalTour?: Tour | null;
  flightLogisticsSection?: ReactNode;
  flightLogisticsNavLabel?: string;
  previewMode?: boolean;
  previewCanonicalTour?: Tour | null;
  previewEditHref?: string;
  previewIsPublished?: boolean;
  previewPublishBlockingCount?: number;
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
}: TourDetailViewProps) {
  const syncedTour = useRepositoryTourDetail(slug, initialTour);
  const liveCanonicalTour = useCanonicalTour(slug, initialCanonicalTour);
  const tour = previewMode ? initialTour ?? null : syncedTour;
  const canonicalTour = previewMode ? previewCanonicalTour : liveCanonicalTour;

  if (!tour) {
    return (
      <div className={cn(siteContainerClass, "py-24 text-center")}>
        <h1 className="font-display text-2xl font-bold text-charcoal">Тур не найден</h1>
        <p className="mt-2 text-slate">Возможно, тур ещё не опубликован или был удалён.</p>
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

  return (
    <TourBookingProvider tour={tour}>
      {previewMode && previewEditHref ? (
        <TourPreviewBanner
          title={tour.title}
          editHref={previewEditHref}
          isPublished={previewIsPublished}
          publishBlockingCount={previewPublishBlockingCount}
        />
      ) : null}

      <Suspense fallback={null}>
        <ReviewPromptBanner />
      </Suspense>

      <div className={cn(siteContainerClass, "pt-4 sm:pt-5 lg:pt-6")}>
        <TourDetailGallery images={tour.gallery} title={tour.title} />
      </div>

      <TourDetailHeader tour={tour} canonicalTour={canonicalTour} />

      <TourSectionNav items={sectionLinks} />

      <div className="bg-surface-muted pb-20">
        <div className={cn(siteContainerClass, "py-8 md:py-10")}>
          <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start xl:gap-10">
            <div className="min-w-0 space-y-8">
              <TourStatsSection
                tour={tour}
                maximumAge={canonicalTour?.participants.maximumAge}
                maxWeightEnabled={canonicalTour?.participants.maxWeightEnabled}
                maxWeightKg={canonicalTour?.participants.maxWeightKg}
                languages={canonicalTour?.participants.languages}
              />
              <DescriptionSection blocks={tour.descriptionBlocks} extra={tour.descriptionExtra!} />
              <PlacesSection places={tour.places} />
              {tour.itinerary?.length ? <ItinerarySection days={tour.itinerary} /> : null}
              <DatesSection tour={tour} canonicalTour={canonicalTour} />
              <IncludedExcludedSection included={tour.included} excluded={tour.excluded} />
              {tourHasAccommodation(tour) ? (
                <AccommodationsSection accommodations={tour.accommodations} />
              ) : null}
              {canonicalTour ? <PackingListSection tour={canonicalTour} /> : null}
              {canonicalTour ? <TourPoliciesSection tour={canonicalTour} /> : null}
              <ImportantSection items={tour.importantInfo} />
              {flightLogisticsSection}
              {canonicalTour ? <LogisticsDetailSection tour={canonicalTour} /> : null}
              <RouteMapSection
                points={tour.routePoints}
                arrival={tour.arrival}
                logistics={canonicalTour?.logistics}
                routeMapImage={canonicalTour?.program.routeMapImage}
              />
              <FAQSection faq={tour.faq} />
              <OrganizerSection
                organizer={tour.organizer}
                comment={tour.organizerComment}
                tourSlug={tour.slug}
                guides={canonicalTour?.team.guides}
              />
              <ReviewsSection
                reviews={tour.reviews}
                rating={tour.rating}
                reviewCount={tour.reviewCount}
              />
              {!previewMode ? <SimilarToursSection tours={similarTours} /> : null}
            </div>

            <aside className="hidden lg:sticky lg:top-[calc(var(--site-header-height,72px)+var(--tour-section-nav-height,48px)+1rem)] lg:block lg:h-fit lg:w-full lg:self-start">
              <TourSidebar tour={tour} canonicalTour={canonicalTour} previewMode={previewMode} />
            </aside>
          </div>
        </div>
      </div>

      {!previewMode ? <MobileBookingBar tour={tour} /> : null}
      {!previewMode ? <TourCheckoutModal tour={tour} /> : null}
    </TourBookingProvider>
  );
}
