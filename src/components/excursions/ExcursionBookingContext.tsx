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
import { excursionPriceSuffixKey } from "@/lib/excursion-listing-meta";
import {
  resolveExcursionPriceUsd,
  resolveExcursionQuotePriceUsd,
  resolvePartnerPriceFootnote,
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
  const [quote, setQuote] = useState<TripsterPriceQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [bookingPreviewOpen, setBookingPreviewOpen] = useState(false);

  const isTripsterPartnerApiConfigured =
    excursion.partner === "tripster" ? excursion.tripsterPartnerApiConfigured !== false : false;

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

  useEffect(() => {
    if (excursion.partner === "tripster" && !isTripsterPartnerApiConfigured) {
      setQuote(null);
      setQuoteLoading(false);
      return;
    }

    if (!selectedDate || !selectedTime) {
      setQuote(null);
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setQuoteLoading(true);
      try {
        const params = new URLSearchParams({
          date: selectedDate,
          time: selectedTime,
          persons: String(persons),
        });
        const response = await fetch(`/api/excursions/${excursion.slug}/price?${params}`);
        const data = (await response.json()) as { quote?: TripsterPriceQuote; error?: string };
        if (!response.ok) throw new Error(data.error ?? "Price unavailable");
        if (!cancelled) setQuote(data.quote ?? null);
      } catch {
        if (!cancelled) setQuote(null);
      } finally {
        if (!cancelled) setQuoteLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [
    excursion.partner,
    excursion.slug,
    isTripsterPartnerApiConfigured,
    selectedDate,
    selectedTime,
    persons,
  ]);

  const maxPersons = scheduleMaxPersons ?? excursion.maxPersons ?? 10;
  const priceUsd =
    resolveExcursionQuotePriceUsd(excursion, quote) ?? resolveExcursionPriceUsd(excursion);
  const priceUnit = excursion.priceUnit ?? "per_excursion";
  const showFrom = excursion.priceFrom !== false && !quote;
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
  const hasListedPrice = priceUsd != null || Boolean(listedPriceLabel);

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
