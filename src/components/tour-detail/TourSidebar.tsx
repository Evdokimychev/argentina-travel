"use client";

import { TourDetail } from "@/types";
import type { Tour } from "@/types/tour";
import OrganizerSection from "./OrganizerSection";
import TourBookingPanel from "./TourBookingPanel";
import EarlyBookingDiscounts from "./EarlyBookingDiscounts";
import GroupDiscountPanel from "./GroupDiscountPanel";
import { useTourBooking } from "./TourBookingContext";
import { normalizeGroupDiscountSettings } from "@/lib/group-discount";

interface TourSidebarProps {
  tour: TourDetail;
  canonicalTour?: Tour | null;
  previewMode?: boolean;
}

export default function TourSidebar({ tour, canonicalTour, previewMode = false }: TourSidebarProps) {
  const { guests } = useTourBooking();
  const basePriceUsd = tour.priceUsd;

  return (
    <div className="space-y-4">
      <TourBookingPanel tour={tour} canonicalTour={canonicalTour} previewMode={previewMode} />
      {normalizeGroupDiscountSettings(tour.groupDiscount).enabled && !tour.priceOnRequest ? (
        <GroupDiscountPanel
          settings={tour.groupDiscount}
          basePriceUsd={basePriceUsd}
          guestCount={guests}
          compact
        />
      ) : null}
      {canonicalTour ? <EarlyBookingDiscounts tour={canonicalTour} compact /> : null}
      <OrganizerSection
        organizer={tour.organizer}
        tourSlug={tour.slug}
        guides={canonicalTour?.team.guides}
        compact
      />
    </div>
  );
}
