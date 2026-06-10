"use client";

import { TourDetail } from "@/types";
import type { Tour } from "@/types/tour";
import OrganizerSection from "./OrganizerSection";
import TourBookingPanel from "./TourBookingPanel";
import EarlyBookingDiscounts from "./EarlyBookingDiscounts";

interface TourSidebarProps {
  tour: TourDetail;
  canonicalTour?: Tour | null;
}

export default function TourSidebar({ tour, canonicalTour }: TourSidebarProps) {
  return (
    <div className="space-y-4">
      <TourBookingPanel tour={tour} />
      {canonicalTour ? <EarlyBookingDiscounts tour={canonicalTour} compact /> : null}
      <OrganizerSection organizer={tour.organizer} compact />
    </div>
  );
}
