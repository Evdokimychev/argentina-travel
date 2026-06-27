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
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { useExcursionPriceQuote } from "@/hooks/useExcursionPriceQuote";
import { excursionPriceSuffixKey } from "@/lib/excursion-listing-meta";
import {
  excursionBookingPriceToUsd,
  isExcursionBookingPriceEstimate,
  resolveExcursionBookingPrice,
  resolvePartnerPriceFootnote,
  type ExcursionBookingPrice,
} from "@/lib/excursion-price-display";
import type { ExcursionScheduleDate } from "@/lib/excursion-schedule";
import type { ExcursionDetail } from "@/types/excursion";
import type { TripsterPriceQuote } from "@/lib/tripster/types";

export type ExcursionBookingContextValue = {
  excursion: ExcursionDetail;
  scheduleDates: ExcursionScheduleDate[];
  scheduleMaxPersons: number | undefined;
  scheduleLoading: boolean;
  scheduleError: string | null;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  selectedTime: string;
  setSelectedTime: (time: string) => void;
  selectedSlots: ExcursionScheduleDate["slots"];
  persons: number;
  setPersons: (count: number) => void;
  maxPersons: number;
  quote: TripsterPriceQuote | null;
  quoteLoading: boolean;
  priceIsEstimate: boolean;
  bookingPrice: ExcursionBookingPrice | null;
  priceUsd: number | null;
  priceSuffix: string;
  partnerPriceFootnote: string | null;
  showFrom: boolean;
  listedPriceLabel: string | null;
  hasListedPrice: boolean;
  isTripsterPartnerApiConfigured: boolean;
  canBookOnSite: boolean;
  prefersAffiliate: boolean;
  submitButtonLabel: string;
  bookingPreviewOpen: boolean;
  openBookingPreview: () => boolean;
  closeBookingPreview: () => void;
};

const ExcursionBookingContext = createContext<ExcursionBookingContextValue | null>(null);

export function ExcursionBookingProvider({
  excursion,
  children,
}: {
  excursion: ExcursionDetail;
  children: ReactNode;
}) {
  const { t, currency } = useLocaleCurrency();

  const [scheduleDates, setScheduleDates] = useState<ExcursionScheduleDate[]>([]);
  const [scheduleMaxPersons, setScheduleMaxPersons] = useState<number | undefined>();
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [persons, setPersons] = useState(1);
  const [bookingPreviewOpen, setBookingPreviewOpen] = useState(false);

  const isTripsterPartnerApiConfigured =
    excursion.partner === "tripster" ? excursion.tripsterPartnerApiConfigured !== false : false;

  const { quote, loading: quoteLoading, quoteMatchesRequest } = useExcursionPriceQuote({
    slug: excursion.slug,
    partner: excursion.partner,
    tripsterPartnerApiConfigured: isTripsterPartnerApiConfigured,
    selectedDate,
    selectedTime,
    persons,
  });

  useEffect(() => {
    setSelectedDate("");
    setSelectedTime("");
    setBookingPreviewOpen(false);
  }, [excursion.slug]);

  useEffect(() => {
    let cancelled = false;

    async function loadSchedule() {
      if (excursion.partner === "tripster" && !isTripsterPartnerApiConfigured) {
        setScheduleDates([]);
        setScheduleMaxPersons(undefined);
        setSelectedDate("");
        setSelectedTime("");
        setScheduleError(null);
        setScheduleLoading(false);
        return;
      }

      setScheduleLoading(true);
      setScheduleError(null);
      try {
        const response = await fetch(`/api/excursions/${excursion.slug}/schedule`);
        const data = (await response.json()) as {
          error?: string;
          dates?: ExcursionScheduleDate[];
          maxPersons?: number;
        };
        if (!response.ok) throw new Error(data.error ?? "Schedule unavailable");
        if (cancelled) return;

        setScheduleDates(data.dates ?? []);
        setScheduleMaxPersons(data.maxPersons);
        setSelectedDate("");
        setSelectedTime("");
      } catch (error) {
        if (!cancelled) {
          setScheduleError(error instanceof Error ? error.message : "Schedule unavailable");
        }
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    }

    void loadSchedule();
    return () => {
      cancelled = true;
    };
  }, [excursion.partner, excursion.slug, isTripsterPartnerApiConfigured]);

  const selectedSlots = useMemo(
    () => scheduleDates.find((entry) => entry.date === selectedDate)?.slots ?? [],
    [scheduleDates, selectedDate]
  );

  useEffect(() => {
    if (!selectedDate) {
      if (selectedTime) setSelectedTime("");
      return;
    }

    if (selectedTime && !selectedSlots.some((slot) => slot.time === selectedTime)) {
      setSelectedTime("");
    }
  }, [selectedDate, selectedSlots, selectedTime]);

  const maxPersons = scheduleMaxPersons ?? excursion.maxPersons ?? 10;
  const selectedSlot = selectedSlots.find((slot) => slot.time === selectedTime);
  const hasDateAndTime = Boolean(selectedDate && selectedTime);

  const bookingPrice = useMemo(
    () =>
      resolveExcursionBookingPrice({
        excursion,
        persons,
        quote,
        quoteMatchesRequest,
        slotPriceValue: selectedSlot?.priceValue,
        hasDateAndTime,
      }),
    [
      excursion,
      persons,
      quote,
      quoteMatchesRequest,
      selectedSlot?.priceValue,
      hasDateAndTime,
    ]
  );

  const priceUsd = excursionBookingPriceToUsd(bookingPrice);
  const priceIsEstimate = isExcursionBookingPriceEstimate({
    hasDateAndTime,
    quoteMatchesRequest,
    quote,
  });
  const priceUnit = excursion.priceUnit ?? "per_excursion";
  const showFrom = bookingPrice?.showFrom ?? (excursion.priceFrom !== false && !hasDateAndTime);
  const priceSuffix = t(excursionPriceSuffixKey(priceUnit));
  const partnerPriceFootnote = resolvePartnerPriceFootnote(
    excursion,
    quote,
    priceUsd,
    currency,
    t
  );

  const prefersAffiliate =
    (excursion.partner === "sputnik8" &&
      !scheduleLoading &&
      (scheduleError != null || scheduleDates.length === 0)) ||
    (excursion.partner === "tripster" && !isTripsterPartnerApiConfigured);

  const canBookOnSite = excursion.isBookable !== false && !prefersAffiliate;
  const submitButtonLabel =
    excursion.partner === "tripster" && isTripsterPartnerApiConfigured
      ? "Забронировать на сайте"
      : t("excursions.booking.submit");

  const listedPriceLabel =
    quote?.value_string?.trim() ||
    excursion.priceDisplay?.trim() ||
    (excursion.priceValue != null
      ? `${Math.round(excursion.priceValue)}${excursion.priceCurrency ? ` ${excursion.priceCurrency}` : ""}`
      : null);
  const hasListedPrice = bookingPrice != null || Boolean(listedPriceLabel);

  const openBookingPreview = useCallback((): boolean => {
    if (!selectedDate || !selectedTime) {
      return false;
    }
    setBookingPreviewOpen(true);
    return true;
  }, [selectedDate, selectedTime]);

  const closeBookingPreview = useCallback(() => {
    setBookingPreviewOpen(false);
  }, []);

  const value = useMemo(
    (): ExcursionBookingContextValue => ({
      excursion,
      scheduleDates,
      scheduleMaxPersons,
      scheduleLoading,
      scheduleError,
      selectedDate,
      setSelectedDate,
      selectedTime,
      setSelectedTime,
      selectedSlots,
      persons,
      setPersons,
      maxPersons,
      quote,
      quoteLoading,
      priceIsEstimate,
      bookingPrice,
      priceUsd,
      priceSuffix,
      partnerPriceFootnote,
      showFrom,
      listedPriceLabel,
      hasListedPrice,
      isTripsterPartnerApiConfigured,
      canBookOnSite,
      prefersAffiliate,
      submitButtonLabel,
      bookingPreviewOpen,
      openBookingPreview,
      closeBookingPreview,
    }),
    [
      excursion,
      scheduleDates,
      scheduleMaxPersons,
      scheduleLoading,
      scheduleError,
      selectedDate,
      selectedTime,
      selectedSlots,
      persons,
      maxPersons,
      quote,
      quoteLoading,
      priceIsEstimate,
      bookingPrice,
      priceUsd,
      priceSuffix,
      partnerPriceFootnote,
      showFrom,
      listedPriceLabel,
      hasListedPrice,
      isTripsterPartnerApiConfigured,
      canBookOnSite,
      prefersAffiliate,
      submitButtonLabel,
      bookingPreviewOpen,
      openBookingPreview,
      closeBookingPreview,
    ]
  );

  return (
    <ExcursionBookingContext.Provider value={value}>{children}</ExcursionBookingContext.Provider>
  );
}

export function useExcursionBooking(): ExcursionBookingContextValue {
  const ctx = useContext(ExcursionBookingContext);
  if (!ctx) {
    throw new Error("useExcursionBooking must be used within ExcursionBookingProvider");
  }
  return ctx;
}
