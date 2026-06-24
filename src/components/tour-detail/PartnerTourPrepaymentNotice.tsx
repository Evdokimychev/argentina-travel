"use client";

import { useMemo } from "react";
import { resolveYouTravelPrepaymentSummary } from "@/lib/youtravel/prepayment";
import { isYouTravelPartnerDetail } from "@/lib/youtravel/partner-tour-utils";
import type { TourDetail } from "@/types";
import { cn } from "@/lib/cn";
import { useTourBooking } from "./TourBookingContext";

export default function PartnerTourPrepaymentNotice({
  tour,
  className,
}: {
  tour: TourDetail;
  className?: string;
}) {
  const { guests, selectedDateId, totalPriceUsd, scheduleDates } = useTourBooking();

  const summary = useMemo(() => {
    if (!isYouTravelPartnerDetail(tour)) return null;

    const dates = scheduleDates.length > 0 ? scheduleDates : tour.dates;
    const selectedDate = dates.find((date) => date.id === selectedDateId);

    return resolveYouTravelPrepaymentSummary({
      tour: { ...tour, dates },
      selectedDate,
      guests,
      totalPriceUsd,
    });
  }, [tour, scheduleDates, selectedDateId, guests, totalPriceUsd]);

  if (!summary) return null;

  return (
    <div className={cn("text-center", className)}>
      <p className="text-sm font-semibold text-brand">{summary.title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-slate">{summary.description}</p>
    </div>
  );
}
