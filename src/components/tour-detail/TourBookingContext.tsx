"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { TourBookingMode, TourDetail } from "@/types";
import {
  dateFitsGuestCount,
  findBookableDates,
  pickInitialDateId,
  validateGuestsForScheduledBooking,
  type BookingDateMode,
} from "@/lib/tour-booking-spots";

export type { BookingDateMode } from "@/lib/tour-booking-spots";

interface TourBookingContextValue {
  selectedDateId: string;
  setSelectedDateId: (id: string) => void;
  guests: number;
  setGuests: (count: number) => void;
  dateMode: BookingDateMode;
  setDateMode: (mode: BookingDateMode) => void;
  customDate: Date | null;
  setCustomDate: (date: Date | null) => void;
  checkoutOpen: boolean;
  openCheckout: () => boolean;
  closeCheckout: () => void;
  pricePerPersonUsd: number;
  originalPricePerPersonUsd?: number;
  totalPriceUsd: number;
  totalOriginalPriceUsd?: number;
}

const TourBookingContext = createContext<TourBookingContextValue | null>(null);

function resolveInitialDateMode(mode: TourBookingMode | undefined): BookingDateMode {
  if (mode === "on_request") return "custom";
  return "scheduled";
}

export function TourBookingProvider({
  tour,
  children,
}: {
  tour: TourDetail;
  children: ReactNode;
}) {
  const bookingMode = tour.bookingMode ?? "scheduled";
  const initialGuests = Math.min(tour.groupMax, tour.groupMin);
  const [guests, setGuests] = useState(() => initialGuests);
  const [selectedDateId, setSelectedDateId] = useState(() =>
    pickInitialDateId(tour.dates, initialGuests, tour.groupMin)
  );
  const [dateMode, setDateMode] = useState<BookingDateMode>(() =>
    resolveInitialDateMode(bookingMode)
  );
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    if (dateMode !== "scheduled") return;
    const current = tour.dates.find((d) => d.id === selectedDateId);
    if (current && dateFitsGuestCount(current, guests, tour.groupMin)) return;
    const next = findBookableDates(tour.dates, guests, tour.groupMin)[0];
    if (next && next.id !== selectedDateId) {
      setSelectedDateId(next.id);
    }
  }, [guests, dateMode, tour.dates, tour.groupMin, selectedDateId]);

  const openCheckout = useCallback((): boolean => {
    if (dateMode === "custom" && bookingMode !== "scheduled" && !customDate) {
      return false;
    }
    if (dateMode === "scheduled" && tour.dates.length === 0 && bookingMode !== "on_request") {
      return false;
    }
    if (
      dateMode === "scheduled" &&
      validateGuestsForScheduledBooking(tour, guests, selectedDateId)
    ) {
      return false;
    }
    setCheckoutOpen(true);
    return true;
  }, [bookingMode, customDate, dateMode, guests, selectedDateId, tour]);

  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);

  const value = useMemo((): TourBookingContextValue => {
    const selectedDate = tour.dates.find((d) => d.id === selectedDateId);
    const pricePerPersonUsd = selectedDate?.priceUsd ?? tour.priceUsd;
    const originalPricePerPersonUsd = tour.originalPriceUsd;

    return {
      selectedDateId,
      setSelectedDateId,
      guests,
      setGuests,
      dateMode,
      setDateMode,
      customDate,
      setCustomDate,
      checkoutOpen,
      openCheckout,
      closeCheckout,
      pricePerPersonUsd,
      originalPricePerPersonUsd,
      totalPriceUsd: pricePerPersonUsd * guests,
      totalOriginalPriceUsd: originalPricePerPersonUsd
        ? originalPricePerPersonUsd * guests
        : undefined,
    };
  }, [
    tour,
    selectedDateId,
    guests,
    dateMode,
    customDate,
    checkoutOpen,
    openCheckout,
    closeCheckout,
  ]);

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
