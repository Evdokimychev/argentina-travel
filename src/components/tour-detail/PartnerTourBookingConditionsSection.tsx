"use client";

import { useMemo } from "react";
import { CreditCard, RotateCcw, Shield, Zap, type LucideIcon } from "lucide-react";
import TourSection from "./TourSection";
import { useTourBooking } from "./TourBookingContext";
import {
  buildYouTravelBookingConditions,
  type YouTravelBookingConditionKind,
} from "@/lib/youtravel/booking-conditions";
import type { PartnerTourContent } from "@/lib/tripster/partner-tour-content";
import type { TourDetail } from "@/types";

const ICONS: Record<YouTravelBookingConditionKind, LucideIcon> = {
  prepayment: CreditCard,
  guarantee: Shield,
  instantBooking: Zap,
  cancellation: RotateCcw,
};

export default function PartnerTourBookingConditionsSection({
  tour,
  content,
}: {
  tour: TourDetail;
  content: PartnerTourContent;
}) {
  const { guests, selectedDateId, totalPriceUsd, scheduleDates } = useTourBooking();

  const items = useMemo(() => {
    const dates = scheduleDates.length > 0 ? scheduleDates : tour.dates;
    const selectedDate = dates.find((date) => date.id === selectedDateId);

    return buildYouTravelBookingConditions({
      tour: { ...tour, dates },
      content,
      selectedDate,
      guests,
      totalPriceUsd,
    });
  }, [tour, content, scheduleDates, selectedDateId, guests, totalPriceUsd]);

  if (items.length === 0) return null;

  return (
    <TourSection id="booking-conditions" title="Условия бронирования">
      <ul className="space-y-4">
        {items.map((item, index) => {
          const Icon = ICONS[item.kind];
          return (
            <li key={`${item.kind}-${index}`} className="flex gap-4">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky/10"
                aria-hidden
              >
                <Icon className="h-5 w-5 text-sky" />
              </div>
              <p className="min-w-0 flex-1 pt-1.5 text-sm leading-relaxed text-charcoal/90">
                {item.text}
              </p>
            </li>
          );
        })}
      </ul>
    </TourSection>
  );
}
