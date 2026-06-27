"use client";

import { useEffect, useRef, useState } from "react";
import type { ExcursionPartner } from "@/types/excursion";
import type { TripsterPriceQuote } from "@/lib/tripster/types";

type UseExcursionPriceQuoteParams = {
  slug: string;
  partner: ExcursionPartner;
  tripsterPartnerApiConfigured: boolean;
  selectedDate: string;
  selectedTime: string;
  persons: number;
};

type ExcursionPriceResponse = {
  quote?: TripsterPriceQuote | null;
  estimate?: boolean;
  error?: string;
};

export function useExcursionPriceQuote({
  slug,
  partner,
  tripsterPartnerApiConfigured,
  selectedDate,
  selectedTime,
  persons,
}: UseExcursionPriceQuoteParams) {
  const [quote, setQuote] = useState<TripsterPriceQuote | null>(null);
  const [quoteRequest, setQuoteRequest] = useState<{
    date: string;
    time: string;
    persons: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const quoteFetchContextRef = useRef<{ date: string; time: string } | null>(null);

  useEffect(() => {
    if (partner === "tripster" && !tripsterPartnerApiConfigured) {
      setQuote(null);
      setQuoteRequest(null);
      setLoading(false);
      return;
    }

    if (!selectedDate || !selectedTime) {
      setQuote(null);
      setQuoteRequest(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const previousContext = quoteFetchContextRef.current;
    const personsOnlyChange =
      previousContext?.date === selectedDate && previousContext?.time === selectedTime;
    quoteFetchContextRef.current = { date: selectedDate, time: selectedTime };
    const debounceMs = personsOnlyChange ? 60 : 120;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          date: selectedDate,
          time: selectedTime,
          persons: String(persons),
        });
        const response = await fetch(`/api/excursions/${slug}/price?${params}`);
        const data = (await response.json()) as ExcursionPriceResponse;
        if (!response.ok) throw new Error(data.error ?? "Price unavailable");
        if (!cancelled) {
          setQuote(data.quote ?? null);
          setQuoteRequest({ date: selectedDate, time: selectedTime, persons });
        }
      } catch {
        if (!cancelled) {
          setQuote(null);
          setQuoteRequest(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      setLoading(false);
    };
  }, [
    slug,
    partner,
    tripsterPartnerApiConfigured,
    selectedDate,
    selectedTime,
    persons,
  ]);

  const quoteMatchesRequest =
    quoteRequest != null &&
    quoteRequest.date === selectedDate &&
    quoteRequest.time === selectedTime &&
    quoteRequest.persons === persons;

  return { quote, loading, quoteMatchesRequest };
}
