"use client";

import { TourDetail } from "@/types";
import OrganizerSection from "./OrganizerSection";
import TourBookingPanel from "./TourBookingPanel";

interface TourSidebarProps {
  tour: TourDetail;
}

export default function TourSidebar({ tour }: TourSidebarProps) {
  return (
    <div className="space-y-4">
      <TourBookingPanel tour={tour} />
      <OrganizerSection organizer={tour.organizer} compact />
    </div>
  );
}
