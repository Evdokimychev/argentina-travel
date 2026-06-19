"use client";

import { useEffect, useState } from "react";
import { parsePartnerTourDateId } from "@/lib/tripster/partner-tour-price";
import type { TripsterPriceQuote } from "@/lib/tripster/types";
import type { BookingDateMode } from "@/lib/tour-booking-spots";
import type { TourDetail } from "@/types";

type UsePartnerTourPriceQuoteParams = {
  tour: TourDetail;
  guests: number;
  selectedDateId: string;
  dateMode: BookingDateMode;
};

type PartnerPriceResponse = {
  quote?: TripsterPriceQuote | null;
  estimate?: boolean;
};

export function usePartnerTourPriceQuote({
  tour,
  guests,
  selectedDateId,
  dateMode,
}: UsePartnerTourPriceQuoteParams) {
  const [quote, setQuote] = useState<TripsterPriceQuote | null>(null);
  const [loading, setLoading] = useState(false);

  const selectedDate = tour.dates.find((date) => date.id === selectedDateId);
  const parsedDate =
    dateMode === "scheduled" && selectedDate
      ? parsePartnerTourDateId(selectedDate.id)
      : null;

  useEffect(() => {
    if (tour.partnerSource !== "tripster" || !tour.partnerExperienceId) {
      setQuote(null);
      setLoading(false);
      return;
    }

    if (!parsedDate) {
      setQuote(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          persons: String(guests),
          date: parsedDate.startDate,
          time: parsedDate.time,
        });

        const response = await fetch(`/api/partner-tours/${tour.slug}/price?${params}`);
        const data = (await response.json()) as PartnerPriceResponse;
        if (!cancelled) {
          setQuote(data.quote ?? null);
        }
      } catch {
        if (!cancelled) setQuote(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    tour.slug,
    tour.partnerSource,
    tour.partnerExperienceId,
    guests,
    parsedDate?.startDate,
    parsedDate?.time,
  ]);

  return { quote, loading, selectedDate, isEstimate: !parsedDate };
}
