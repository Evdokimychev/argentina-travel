"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { TourDetail, TourDatePrice } from "@/types";
import TourSection from "./TourSection";
import { formatDateShortWithYear } from "@/lib/utils";

export default function PartnerTourDatesSection({ tour }: { tour: TourDetail }) {
  const [dates, setDates] = useState<TourDatePrice[]>(() =>
    tour.dates.filter((item) => item.startDate)
  );
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    setVisibleCount(6);
    setDates(tour.dates.filter((item) => item.startDate));
  }, [tour.slug, tour.dates]);

  useEffect(() => {
    let cancelled = false;

    async function loadDates() {
      try {
        const response = await fetch(`/api/partner-tours/${tour.slug}/schedule`);
        const data = (await response.json()) as { dates?: TourDatePrice[] };
        if (!cancelled && data.dates?.length) {
          setDates(data.dates.filter((item) => item.startDate));
        }
      } catch {
        // keep SSR dates
      }
    }

    void loadDates();
    return () => {
      cancelled = true;
    };
  }, [tour.slug]);

  if (!dates.length) return null;

  const bookingHref = tour.customBookingLink?.url ?? `/api/affiliate/go/${tour.slug}`;

  return (
    <TourSection
      id="dates"
      title="Ближайшие даты"
      subtitle={
        tour.partnerPriceDisplay
          ? `Стоимость на Tripster: ${tour.partnerPriceDisplay}`
          : "Актуальные даты заезда на Tripster"
      }
    >
      <ul className="grid gap-3 sm:grid-cols-2">
        {dates.slice(0, visibleCount).map((date) => (
          <li
            key={date.id}
            className="rounded-2xl border border-gray-100 bg-white px-4 py-3 shadow-sm"
          >
            <p className="font-medium text-charcoal">
              {formatDateShortWithYear(date.startDate)}
              {date.endDate !== date.startDate
                ? ` — ${formatDateShortWithYear(date.endDate)}`
                : null}
            </p>
            {date.spotsLeft > 0 ? (
              <p className="mt-1 text-xs text-slate">Доступно мест: {date.spotsLeft}</p>
            ) : null}
          </li>
        ))}
      </ul>

      {dates.length > visibleCount ? (
        <button
          type="button"
          onClick={() => setVisibleCount((count) => count + 6)}
          className="mt-4 text-sm font-medium text-sky hover:text-sky-dark"
        >
          Показать ещё даты
        </button>
      ) : null}

      <Link
        href={bookingHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-sky hover:text-sky-dark"
      >
        Выбрать дату и забронировать на Tripster
        <ExternalLink className="h-4 w-4" aria-hidden />
      </Link>
    </TourSection>
  );
}
