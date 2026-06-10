"use client";

import Link from "next/link";
import { TourDetail } from "@/types";
import TourDetailGallery from "./TourDetailGallery";
import TourDetailHero from "./TourDetailHero";
import TourStatsSection from "./TourStatsSection";
import TourClassificationBar from "./TourClassificationBar";
import PlacesSection from "./PlacesSection";
import DescriptionSection from "./DescriptionSection";
import ItinerarySection from "./ItinerarySection";
import GuidesSection from "./GuidesSection";
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
import EarlyBookingDiscounts from "./EarlyBookingDiscounts";
import { TourBookingProvider } from "./TourBookingContext";
import MobileBookingBar from "./MobileBookingBar";
import TourCheckoutModal from "./checkout/TourCheckoutModal";
import TourSectionNav from "./TourSectionNav";
import TourPreviewBanner from "./TourPreviewBanner";
import ReviewPromptBanner from "./ReviewPromptBanner";
import { buildTourSectionLinks } from "./tour-section-links";
import { tourHasAccommodation } from "@/lib/tour-accommodation";
import { useRepositoryTourDetail } from "@/hooks/useRepositoryTourDetail";
import { useCanonicalTour } from "@/hooks/useCanonicalTour";
import { hasVisibleGuides } from "@/lib/tour-public-display";
import type { Tour } from "@/types/tour";
import { Suspense } from "react";

interface TourDetailViewProps {
  slug: string;
  tour?: TourDetail | null;
  similarTours: TourDetail[];
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
  previewMode = false,
  previewCanonicalTour = null,
  previewEditHref,
  previewIsPublished = false,
  previewPublishBlockingCount = 0,
}: TourDetailViewProps) {
  const syncedTour = useRepositoryTourDetail(slug, initialTour);
  const liveCanonicalTour = useCanonicalTour(slug);
  const tour = previewMode ? initialTour ?? null : syncedTour;
  const canonicalTour = previewMode ? previewCanonicalTour : liveCanonicalTour;

  if (!tour) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-2xl font-bold text-charcoal">Тур не найден</h1>
        <p className="mt-2 text-slate">
          Возможно, тур ещё не опубликован или был удалён.
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
  });

  return (
    <TourBookingProvider tour={tour}>
      <div className="bg-pampas pb-20">
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

        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8 lg:pt-6">
          <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-slate">
            <Link href="/" className="hover:text-sky">Главная</Link>
            <span className="text-gray-300">–</span>
            <Link href="/tours" className="hover:text-sky">Авторские туры</Link>
            <span className="text-gray-300">–</span>
            <span>{tour.country}</span>
            <span className="text-gray-300">–</span>
            <span>{tour.region}</span>
            <span className="text-gray-300">–</span>
            <span className="font-medium text-charcoal">{tour.title}</span>
          </nav>

          <TourDetailGallery images={tour.gallery} title={tour.title} />

          <div className="mt-6 grid gap-10 lg:mt-8 lg:grid-cols-[1fr_360px] lg:items-start">
            <div className="min-w-0 space-y-12">
              <TourDetailHero tour={tour} />
              {canonicalTour ? <TourClassificationBar tour={canonicalTour} /> : null}
              <TourStatsSection
                tour={tour}
                maximumAge={canonicalTour?.participants.maximumAge}
                maxWeightEnabled={canonicalTour?.participants.maxWeightEnabled}
                maxWeightKg={canonicalTour?.participants.maxWeightKg}
                languages={canonicalTour?.participants.languages}
              />
              <TourSectionNav items={sectionLinks} />
              <DescriptionSection
                blocks={tour.descriptionBlocks}
                extra={tour.descriptionExtra!}
              />
              <PlacesSection places={tour.places} />
              {tour.itinerary?.length ? (
                <ItinerarySection days={tour.itinerary} />
              ) : null}
              {canonicalTour && hasVisibleGuides(canonicalTour) ? (
                <GuidesSection guides={canonicalTour.team.guides} />
              ) : null}
              <DatesSection tour={tour} canonicalTour={canonicalTour} />
              <IncludedExcludedSection included={tour.included} excluded={tour.excluded} />
              {tourHasAccommodation(tour) ? (
                <AccommodationsSection accommodations={tour.accommodations} />
              ) : null}
              {canonicalTour ? <PackingListSection tour={canonicalTour} /> : null}
              {canonicalTour ? <TourPoliciesSection tour={canonicalTour} /> : null}
              <ImportantSection items={tour.importantInfo} />
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
              />
              <ReviewsSection reviews={tour.reviews} rating={tour.rating} reviewCount={tour.reviewCount} />
              {!previewMode ? <SimilarToursSection tours={similarTours} /> : null}
            </div>

            <aside className="hidden lg:sticky lg:top-[calc(var(--site-header-height,72px)+1rem)] lg:block lg:max-h-[calc(100vh-var(--site-header-height,72px)-2rem)] lg:w-full lg:self-start lg:overflow-y-auto">
              <TourSidebar tour={tour} canonicalTour={canonicalTour} previewMode={previewMode} />
            </aside>
          </div>
        </div>

        {!previewMode ? <MobileBookingBar tour={tour} /> : null}
        {!previewMode ? <TourCheckoutModal tour={tour} /> : null}
      </div>
    </TourBookingProvider>
  );
}
