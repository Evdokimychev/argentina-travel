"use client";

import { useEffect, useState } from "react";
import type { TourDatePrice, TourDetail } from "@/types";
import { isPartnerTourDetail } from "@/lib/tripster/partner-tour-utils";

type ScheduleResponse = {
  dates?: TourDatePrice[];
  maxPersons?: number;
  affiliateFallback?: string;
  configured?: boolean;
  error?: string;
};

export function usePartnerTourSchedule(tour: TourDetail) {
  const [dates, setDates] = useState<TourDatePrice[]>(() => tour.dates);
  const [maxPersons, setMaxPersons] = useState<number | undefined>();
  const [loading, setLoading] = useState(() => isPartnerTourDetail(tour) && tour.dates.length === 0);
  const [error, setError] = useState<string | null>(null);
  const [affiliateFallback, setAffiliateFallback] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    if (!isPartnerTourDetail(tour)) {
      setDates(tour.dates);
      setLoading(false);
      return;
    }

    setDates(tour.dates);
    if (tour.dates.length > 0) {
      setLoading(false);
    }

    let cancelled = false;

    async function loadSchedule() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/partner-tours/${tour.slug}/schedule`);
        const data = (await response.json()) as ScheduleResponse;

        if (cancelled) return;

        if (data.dates?.length) {
          setDates(data.dates);
        }

        if (data.maxPersons != null && Number.isFinite(data.maxPersons)) {
          setMaxPersons(data.maxPersons);
        }

        setAffiliateFallback(data.affiliateFallback ?? null);
        setConfigured(data.configured !== false);

        if (!response.ok && !data.dates?.length) {
          setError(data.error ?? "Не удалось загрузить расписание");
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(
            loadError instanceof Error ? loadError.message : "Не удалось загрузить расписание"
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadSchedule();

    return () => {
      cancelled = true;
    };
  }, [tour.slug, tour.dates]);

  return { dates, maxPersons, loading, error, affiliateFallback, configured };
}
