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
  getGuestLimits,
  pickInitialDateId,
  validateGuestsForScheduledBooking,
  type BookingDateMode,
} from "@/lib/tour-booking-spots";
import { getDiscountPercent, resolveDiscountReferencePriceUsd } from "@/lib/discount";
import { resolveGroupDiscountQuote } from "@/lib/group-discount";
import {
  resolveTourExternalBookingHref,
  tourUsesExternalBooking,
} from "@/lib/tour-custom-booking-link";
import {
  canOpenWaitlist,
  resolveWaitlistScenario,
  type WaitlistScenario,
} from "@/lib/tour-waitlist";
import { isPartnerTourDetail } from "@/lib/tripster/partner-tour-utils";
import { parsePartnerTourDateId } from "@/lib/tripster/partner-tour-price";
import type { TourCustomBookingLinkPublic } from "@/types/tour-custom-booking-link";
import { usePartnerTourPriceQuote } from "@/hooks/usePartnerTourPriceQuote";
import { resolvePartnerTourBookingPrice } from "@/lib/tripster/partner-tour-price";
import type { PartnerTourBookingPrice } from "@/lib/tripster/partner-tour-price";

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
  priceOnRequest: boolean;
  priceRequestOpen: boolean;
  openPriceRequest: () => boolean;
  closePriceRequest: () => void;
  pricePerPersonUsd: number;
  basePricePerPersonUsd: number;
  originalPricePerPersonUsd?: number;
  totalPriceUsd: number;
  totalOriginalPriceUsd?: number;
  discountPercentOff?: number;
  groupDiscountApplied: boolean;
  groupDiscountSavingsUsd: number;
  waitlistOpen: boolean;
  openWaitlist: () => void;
  closeWaitlist: () => void;
  canJoinWaitlist: boolean;
  waitlistScenario: WaitlistScenario;
  usesExternalBooking: boolean;
  externalBookingLink: TourCustomBookingLinkPublic | null;
  externalBookingHref: string | null;
  partnerBookingPrice: PartnerTourBookingPrice | null;
  partnerPriceLoading: boolean;
  partnerPriceIsEstimate: boolean;
}

const TourBookingContext = createContext<TourBookingContextValue | null>(null);

function resolveInitialDateMode(
  mode: TourBookingMode | undefined,
  datesLength: number
): BookingDateMode {
  if (datesLength > 0) return "scheduled";
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
  const requiresManualDate = isPartnerTourDetail(tour);
  const initialGuests = Math.min(tour.groupMax, tour.groupMin);
  const [guests, setGuests] = useState(() => initialGuests);
  const [selectedDateId, setSelectedDateId] = useState(() =>
    requiresManualDate
      ? ""
      : pickInitialDateId(tour.dates, initialGuests, tour.groupMin)
  );
  const [dateMode, setDateMode] = useState<BookingDateMode>(() =>
    resolveInitialDateMode(bookingMode, tour.dates.length)
  );
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [priceRequestOpen, setPriceRequestOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const priceOnRequest = Boolean(tour.priceOnRequest);

  useEffect(() => {
    if (tour.dates.length > 0 && dateMode === "custom") {
      setDateMode("scheduled");
    }
  }, [tour.slug, tour.dates.length, dateMode]);

  useEffect(() => {
    if (dateMode !== "scheduled" || requiresManualDate) return;
    const current = tour.dates.find((d) => d.id === selectedDateId);
    if (current && dateFitsGuestCount(current, guests, tour.groupMin)) return;
    const next = findBookableDates(tour.dates, guests, tour.groupMin)[0];
    if (next && next.id !== selectedDateId) {
      setSelectedDateId(next.id);
    }
  }, [guests, dateMode, requiresManualDate, tour.dates, tour.groupMin, selectedDateId]);

  useEffect(() => {
    if (dateMode !== "scheduled" || !selectedDateId) return;
    const selected = tour.dates.find((d) => d.id === selectedDateId);
    if (!selected) return;

    const limits = getGuestLimits(tour, selected, dateMode);
    setGuests((current) => {
      if (current > limits.max) return Math.max(limits.min, limits.max);
      if (current < limits.min) return limits.min;
      return current;
    });
  }, [selectedDateId, dateMode, tour.dates, tour.groupMin, tour.groupMax]);

  const usesExternalBooking = tourUsesExternalBooking(tour);
  const externalBookingLink = tour.customBookingLink ?? null;
  const {
    quote: partnerQuote,
    loading: partnerPriceLoading,
    selectedDate: partnerSelectedDate,
    isEstimate: partnerPriceIsEstimate,
  } = usePartnerTourPriceQuote({
    tour,
    guests,
    selectedDateId,
    dateMode,
  });

  const partnerSlotTime = useMemo(() => {
    if (!selectedDateId) return undefined;
    return parsePartnerTourDateId(selectedDateId)?.time;
  }, [selectedDateId]);

  const externalBookingHref = usesExternalBooking
    ? resolveTourExternalBookingHref(tour, {
        guests,
        selectedDateId,
        customDate,
        slotTime: partnerSlotTime,
      })
    : null;

  const openPriceRequest = useCallback((): boolean => {
    if (usesExternalBooking) return false;
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
    setPriceRequestOpen(true);
    return true;
  }, [bookingMode, customDate, dateMode, guests, selectedDateId, tour, usesExternalBooking]);

  const closePriceRequest = useCallback(() => setPriceRequestOpen(false), []);

  const waitlistScenario = useMemo(
    () => resolveWaitlistScenario(tour, guests, dateMode, selectedDateId),
    [tour, guests, dateMode, selectedDateId]
  );

  const canJoinWaitlist = useMemo(
    () => canOpenWaitlist(tour, guests, dateMode, selectedDateId),
    [tour, guests, dateMode, selectedDateId]
  );

  const openWaitlist = useCallback(() => {
    if (!canJoinWaitlist) return;
    setWaitlistOpen(true);
  }, [canJoinWaitlist]);

  const closeWaitlist = useCallback(() => setWaitlistOpen(false), []);

  const openCheckout = useCallback((): boolean => {
    if (usesExternalBooking) return false;
    if (priceOnRequest) {
      return openPriceRequest();
    }
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
  }, [
    bookingMode,
    customDate,
    dateMode,
    guests,
    openPriceRequest,
    priceOnRequest,
    selectedDateId,
    tour,
    usesExternalBooking,
  ]);

  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);

  const partnerBookingPrice = useMemo(() => {
    if (tour.partnerSource !== "tripster") return null;
    return resolvePartnerTourBookingPrice({
      tour,
      guests,
      selectedDate: partnerSelectedDate,
      quote: partnerQuote,
    });
  }, [tour, guests, partnerSelectedDate, partnerQuote]);

  const value = useMemo((): TourBookingContextValue => {
    const selectedDate = tour.dates.find((d) => d.id === selectedDateId);
    const datePriceUsd = selectedDate?.priceUsd ?? 0;
    const basePricePerPersonUsd = datePriceUsd > 0 ? datePriceUsd : tour.priceUsd;
    const quote = priceOnRequest
      ? {
          pricePerPersonUsd: basePricePerPersonUsd,
          savingsPerPersonUsd: 0,
        }
      : resolveGroupDiscountQuote(basePricePerPersonUsd, guests, tour.groupDiscount);
    const pricePerPersonUsd = quote.pricePerPersonUsd;

    const originalPricePerPersonUsd = priceOnRequest
      ? undefined
      : resolveDiscountReferencePriceUsd(
          pricePerPersonUsd,
          tour.originalPriceUsd,
          basePricePerPersonUsd
        );
    const discountPercentOff =
      originalPricePerPersonUsd != null
        ? getDiscountPercent(originalPricePerPersonUsd, pricePerPersonUsd)
        : undefined;

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
      priceOnRequest,
      priceRequestOpen,
      openPriceRequest,
      closePriceRequest,
      pricePerPersonUsd,
      basePricePerPersonUsd,
      originalPricePerPersonUsd,
      totalPriceUsd: pricePerPersonUsd * guests,
      totalOriginalPriceUsd: originalPricePerPersonUsd
        ? originalPricePerPersonUsd * guests
        : undefined,
      discountPercentOff,
      groupDiscountApplied: !priceOnRequest && quote.savingsPerPersonUsd > 0,
      groupDiscountSavingsUsd: priceOnRequest ? 0 : quote.savingsPerPersonUsd * guests,
      waitlistOpen,
      openWaitlist,
      closeWaitlist,
      canJoinWaitlist,
      waitlistScenario,
      usesExternalBooking,
      externalBookingLink,
      externalBookingHref,
      partnerBookingPrice,
      partnerPriceLoading,
      partnerPriceIsEstimate,
    };
  }, [
    tour,
    selectedDateId,
    guests,
    dateMode,
    customDate,
    checkoutOpen,
    priceRequestOpen,
    waitlistOpen,
    priceOnRequest,
    openCheckout,
    closeCheckout,
    openPriceRequest,
    closePriceRequest,
    openWaitlist,
    closeWaitlist,
    canJoinWaitlist,
    waitlistScenario,
    usesExternalBooking,
    externalBookingLink,
    externalBookingHref,
    partnerBookingPrice,
    partnerPriceLoading,
    partnerPriceIsEstimate,
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
