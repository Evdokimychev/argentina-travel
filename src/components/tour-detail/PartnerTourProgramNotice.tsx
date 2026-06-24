"use client";

import { ExternalLink } from "lucide-react";
import TourSection from "./TourSection";

export default function PartnerTourProgramNotice({
  bookingHref,
}: {
  bookingHref: string;
}) {
  return (
    <TourSection id="itinerary" title="Программа по дням">
      <div className="rounded-2xl border border-sky/15 bg-sky/5 px-5 py-4">
        <p className="text-sm leading-relaxed text-charcoal">
          Подробная программа по дням доступна на Tripster — там же можно выбрать дату заезда и
          оформить бронирование. Мы показываем описание, условия и отзывы, чтобы вы могли
          спокойно оценить тур до перехода на партнёрскую площадку.
        </p>
        <a
          href={bookingHref}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-sky hover:text-sky-dark"
        >
          Открыть программу на Tripster
          <ExternalLink className="h-4 w-4" aria-hidden />
        </a>
      </div>
    </TourSection>
  );
}
