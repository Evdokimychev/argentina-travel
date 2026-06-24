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
import { usePartnerTourSchedule } from "@/hooks/usePartnerTourSchedule";
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
  scheduleDates: TourDetail["dates"];
  scheduleLoading: boolean;
  partnerPreviewOpen: boolean;
  openPartnerBookingPreview: () => boolean;
  closePartnerBookingPreview: () => void;
  partnerEditRequest: { target: "date" | "guests"; at: number } | null;
  requestPartnerBookingEdit: (target: "date" | "guests") => void;
}

const TourBookingContext = createContext<TourBookingContextValue | null>(null);

export { TourBookingContext };

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
  const isPartnerTour = isPartnerTourDetail(tour);
  const {
    dates: scheduleDates,
    loading: scheduleLoading,
    maxPersons: scheduleMaxPersons,
  } = usePartnerTourSchedule(tour);
  const effectiveDates = scheduleDates.length > 0 ? scheduleDates : tour.dates;
  const effectiveBookingMode =
    isPartnerTour && effectiveDates.length > 0 ? "scheduled" : bookingMode;
  const requiresManualDate = isPartnerTour;
  const initialGuests = Math.min(
    scheduleMaxPersons ?? tour.groupMax,
    tour.groupMax,
    tour.groupMin
  );
  const [guests, setGuests] = useState(() => initialGuests);
  const [selectedDateId, setSelectedDateId] = useState(() =>
    requiresManualDate
      ? ""
      : pickInitialDateId(effectiveDates, initialGuests, tour.groupMin)
  );
  const [dateMode, setDateMode] = useState<BookingDateMode>(() =>
    resolveInitialDateMode(effectiveBookingMode, effectiveDates.length)
  );
  const [customDate, setCustomDate] = useState<Date | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [priceRequestOpen, setPriceRequestOpen] = useState(false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [partnerPreviewOpen, setPartnerPreviewOpen] = useState(false);
  const [partnerEditRequest, setPartnerEditRequest] = useState<{
    target: "date" | "guests";
    at: number;
  } | null>(null);
  const priceOnRequest = Boolean(tour.priceOnRequest);

  const bookingTour = useMemo(
    (): TourDetail => ({
      ...tour,
      dates: effectiveDates,
      bookingMode: effectiveBookingMode,
      groupMax: scheduleMaxPersons
        ? Math.min(tour.groupMax, scheduleMaxPersons)
        : tour.groupMax,
    }),
    [tour, effectiveDates, effectiveBookingMode, scheduleMaxPersons]
  );

  useEffect(() => {
    if (effectiveDates.length > 0 && dateMode === "custom") {
      setDateMode("scheduled");
    }
  }, [tour.slug, effectiveDates.length, dateMode]);

  useEffect(() => {
    if (requiresManualDate) {
      setSelectedDateId("");
      setCustomDate(null);
    }
    setPartnerPreviewOpen(false);
  }, [tour.slug, requiresManualDate]);

  useEffect(() => {
    setPartnerEditRequest(null);
  }, [tour.slug]);

  useEffect(() => {
    if (requiresManualDate || scheduleLoading || effectiveDates.length === 0) return;
    if (selectedDateId && effectiveDates.some((date) => date.id === selectedDateId)) return;
    const next = pickInitialDateId(effectiveDates, guests, tour.groupMin);
    if (next) setSelectedDateId(next);
  }, [requiresManualDate, scheduleLoading, effectiveDates, selectedDateId, guests, tour.groupMin]);

  useEffect(() => {
    if (dateMode !== "scheduled" || requiresManualDate) return;
    const current = effectiveDates.find((d) => d.id === selectedDateId);
    if (current && dateFitsGuestCount(current, guests, tour.groupMin)) return;
    const next = findBookableDates(effectiveDates, guests, tour.groupMin)[0];
    if (next && next.id !== selectedDateId) {
      setSelectedDateId(next.id);
    }
  }, [guests, dateMode, requiresManualDate, effectiveDates, tour.groupMin, selectedDateId]);

  useEffect(() => {
    if (dateMode !== "scheduled" || !selectedDateId) return;
    const selected = effectiveDates.find((d) => d.id === selectedDateId);
    if (!selected) return;

    const limits = getGuestLimits(tour, selected, dateMode);
    setGuests((current) => {
      if (current > limits.max) return Math.max(limits.min, limits.max);
      if (current < limits.min) return limits.min;
      return current;
    });
  }, [selectedDateId, dateMode, effectiveDates, tour.groupMin, tour.groupMax]);

  const usesExternalBooking = tourUsesExternalBooking(tour);
  const externalBookingLink = tour.customBookingLink ?? null;
  const {
    quote: partnerQuote,
    loading: partnerPriceLoading,
    selectedDate: partnerSelectedDate,
    isEstimate: partnerPriceIsEstimate,
  } = usePartnerTourPriceQuote({
    tour: bookingTour,
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
        dates: effectiveDates,
      })
    : null;

  const openPartnerBookingPreview = useCallback((): boolean => {
    if (
      validateGuestsForScheduledBooking(bookingTour, guests, selectedDateId)
    ) {
      return false;
    }
    setPartnerPreviewOpen(true);
    return true;
  }, [bookingTour, guests, selectedDateId]);

  const closePartnerBookingPreview = useCallback(() => {
    setPartnerPreviewOpen(false);
  }, []);

  const requestPartnerBookingEdit = useCallback((target: "date" | "guests") => {
    setPartnerPreviewOpen(false);
    setPartnerEditRequest({ target, at: Date.now() });
  }, []);

  const openPriceRequest = useCallback((): boolean => {
    if (usesExternalBooking) return false;
    if (dateMode === "custom" && bookingMode !== "scheduled" && !customDate) {
      return false;
    }
    if (dateMode === "scheduled" && effectiveDates.length === 0 && effectiveBookingMode !== "on_request") {
      return false;
    }
    if (
      dateMode === "scheduled" &&
      validateGuestsForScheduledBooking(bookingTour, guests, selectedDateId)
    ) {
      return false;
    }
    setPriceRequestOpen(true);
    return true;
  }, [effectiveBookingMode, customDate, dateMode, guests, selectedDateId, bookingTour, usesExternalBooking]);

  const closePriceRequest = useCallback(() => setPriceRequestOpen(false), []);

  const waitlistScenario = useMemo(
    () => resolveWaitlistScenario(bookingTour, guests, dateMode, selectedDateId),
    [bookingTour, guests, dateMode, selectedDateId]
  );

  const canJoinWaitlist = useMemo(
    () => canOpenWaitlist(bookingTour, guests, dateMode, selectedDateId),
    [bookingTour, guests, dateMode, selectedDateId]
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
    if (dateMode === "scheduled" && effectiveDates.length === 0 && effectiveBookingMode !== "on_request") {
      return false;
    }
    if (
      dateMode === "scheduled" &&
      validateGuestsForScheduledBooking(bookingTour, guests, selectedDateId)
    ) {
      return false;
    }
    setCheckoutOpen(true);
    return true;
  }, [
    effectiveBookingMode,
    customDate,
    dateMode,
    guests,
    openPriceRequest,
    priceOnRequest,
    selectedDateId,
    bookingTour,
    effectiveDates.length,
    usesExternalBooking,
  ]);

  const closeCheckout = useCallback(() => setCheckoutOpen(false), []);

  const partnerBookingPrice = useMemo(() => {
    if (tour.partnerSource !== "tripster") return null;
    return resolvePartnerTourBookingPrice({
      tour: bookingTour,
      guests,
      selectedDate: partnerSelectedDate,
      quote: partnerQuote,
    });
  }, [bookingTour, guests, partnerSelectedDate, partnerQuote]);

  const value = useMemo((): TourBookingContextValue => {
    const selectedDate = effectiveDates.find((d) => d.id === selectedDateId);
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
      scheduleDates: effectiveDates,
      scheduleLoading,
      partnerPreviewOpen,
      openPartnerBookingPreview,
      closePartnerBookingPreview,
      partnerEditRequest,
      requestPartnerBookingEdit,
    };
  }, [
    tour,
    effectiveDates,
    scheduleLoading,
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
    partnerPreviewOpen,
    openPartnerBookingPreview,
    closePartnerBookingPreview,
    partnerEditRequest,
    requestPartnerBookingEdit,
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
