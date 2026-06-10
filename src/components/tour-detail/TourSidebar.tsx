"use client";

import { TourDetail } from "@/types";
import type { Tour } from "@/types/tour";
import OrganizerSection from "./OrganizerSection";
import TourBookingPanel from "./TourBookingPanel";
import EarlyBookingDiscounts from "./EarlyBookingDiscounts";

interface TourSidebarProps {
  tour: TourDetail;
  canonicalTour?: Tour | null;
  previewMode?: boolean;
}

export default function TourSidebar({ tour, canonicalTour, previewMode = false }: TourSidebarProps) {
  return (
    <div className="space-y-4">
      <TourBookingPanel tour={tour} previewMode={previewMode} />
      {canonicalTour ? <EarlyBookingDiscounts tour={canonicalTour} compact /> : null}
      <OrganizerSection organizer={tour.organizer} tourSlug={tour.slug} compact />
    </div>
  );
}
