"use client";

import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TourDetail } from "@/types";

interface TourBookingContextValue {
  selectedDateId: string;
  setSelectedDateId: (id: string) => void;
  guests: number;
  setGuests: (count: number) => void;
  pricePerPersonUsd: number;
  originalPricePerPersonUsd?: number;
  totalPriceUsd: number;
  totalOriginalPriceUsd?: number;
}

const TourBookingContext = createContext<TourBookingContextValue | null>(null);

export function TourBookingProvider({
  tour,
  children,
}: {
  tour: TourDetail;
  children: ReactNode;
}) {
  const [selectedDateId, setSelectedDateId] = useState(tour.dates[0]?.id ?? "");
  const [guests, setGuests] = useState(() =>
    Math.min(Math.max(2, tour.groupMin), tour.groupMax)
  );

  const value = useMemo((): TourBookingContextValue => {
    const selectedDate = tour.dates.find((d) => d.id === selectedDateId);
    const pricePerPersonUsd = selectedDate?.priceUsd ?? tour.priceUsd;
    const originalPricePerPersonUsd = tour.originalPriceUsd;

    return {
      selectedDateId,
      setSelectedDateId,
      guests,
      setGuests,
      pricePerPersonUsd,
      originalPricePerPersonUsd,
      totalPriceUsd: pricePerPersonUsd * guests,
      totalOriginalPriceUsd: originalPricePerPersonUsd
        ? originalPricePerPersonUsd * guests
        : undefined,
    };
  }, [tour, selectedDateId, guests]);

  return (
    <TourBookingContext.Provider value={value}>{children}</TourBookingContext.Provider>
  );
}

export function useTourBooking(): TourBookingContextValue {
  const ctx = useContext(TourBookingContext);
  if (!ctx) {
    throw new Error("useTourBooking must be used within TourBookingProvider");
  }
  return ctx;
}
