"use client";

import { TOUR_ROUTE_FEATURES_MAX } from "@/data/tour-organizer-display-defaults";

interface TourRouteFeaturesBlockProps {
  text: string;
  onChange: (text: string) => void;
}

export default function TourRouteFeaturesBlock({ text, onChange }: TourRouteFeaturesBlockProps) {
  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-heading text-xl font-bold text-charcoal sm:text-2xl">
          Особенности маршрута
        </h2>
        <p className="mt-1 text-sm text-slate">
          Кратко опишите особенности маршрута для туристов. Блок показывается в карточке организатора.
        </p>
      </div>

      <div>
        <textarea
          value={text}
          maxLength={TOUR_ROUTE_FEATURES_MAX}
          rows={6}
          onChange={(event) => onChange(event.target.value.slice(0, TOUR_ROUTE_FEATURES_MAX))}
          placeholder="Маршрут оптимизирован с учётом акклиматизации…"
          className="w-full resize-y rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-relaxed text-charcoal placeholder:text-slate/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <p className="mt-1 text-right text-xs text-slate">
          {text.length} / {TOUR_ROUTE_FEATURES_MAX}
        </p>
      </div>
    </section>
  );
}
