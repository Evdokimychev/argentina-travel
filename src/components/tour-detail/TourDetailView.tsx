"use client";

import Link from "next/link";
import { TourDetail } from "@/types";
import TourDetailGallery from "./TourDetailGallery";
import TourDetailHero from "./TourDetailHero";
import TourStatsSection from "./TourStatsSection";
import PlacesSection from "./PlacesSection";
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
import { TourBookingProvider } from "./TourBookingContext";
import MobileBookingBar from "./MobileBookingBar";
import TourCheckoutModal from "./checkout/TourCheckoutModal";
import TourSectionNav from "./TourSectionNav";
import { buildTourSectionLinks } from "./tour-section-links";
import { tourHasAccommodation } from "@/lib/tour-accommodation";

interface TourDetailViewProps {
  tour: TourDetail;
  similarTours: TourDetail[];
}

export default function TourDetailView({ tour, similarTours }: TourDetailViewProps) {
  const sectionLinks = buildTourSectionLinks(tour, similarTours.length > 0);

  return (
    <TourBookingProvider tour={tour}>
      <div className="bg-pampas pb-20">
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
              <TourStatsSection tour={tour} />
              <TourSectionNav items={sectionLinks} />
              <DescriptionSection
                blocks={tour.descriptionBlocks}
                extra={tour.descriptionExtra!}
              />
              <PlacesSection places={tour.places} />
              {tour.itinerary?.length ? (
                <ItinerarySection days={tour.itinerary} />
              ) : null}
              <IncludedExcludedSection included={tour.included} excluded={tour.excluded} />
              {tourHasAccommodation(tour) ? (
                <AccommodationsSection accommodations={tour.accommodations} />
              ) : null}
              <ImportantSection items={tour.importantInfo} />
              <RouteMapSection points={tour.routePoints} arrival={tour.arrival} />
              <FAQSection faq={tour.faq} />
              <DatesSection tour={tour} />
              <OrganizerSection organizer={tour.organizer} comment={tour.organizerComment} />
              <ReviewsSection reviews={tour.reviews} rating={tour.rating} reviewCount={tour.reviewCount} />
              <SimilarToursSection tours={similarTours} />
            </div>

            <aside className="hidden lg:sticky lg:top-[calc(var(--site-header-height,72px)+1rem)] lg:block lg:max-h-[calc(100vh-var(--site-header-height,72px)-2rem)] lg:w-full lg:self-start lg:overflow-y-auto">
              <TourSidebar tour={tour} />
            </aside>
          </div>
        </div>

        <MobileBookingBar tour={tour} />
        <TourCheckoutModal tour={tour} />
      </div>
    </TourBookingProvider>
  );
}
