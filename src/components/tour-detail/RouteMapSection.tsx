"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { MapPin } from "lucide-react";
import type { TourRoutePoint } from "@/types";
import { cn } from "@/lib/cn";
import { SectionHeading } from "./InfoModal";

const RouteMap = dynamic(() => import("./RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[288px] items-center justify-center bg-gray-50 text-sm text-slate lg:min-h-[420px]">
      Загрузка карты…
    </div>
  ),
});

interface RouteMapSectionProps {
  points: TourRoutePoint[];
}

export default function RouteMapSection({ points }: RouteMapSectionProps) {
  const [selectedId, setSelectedId] = useState<string | null>(points[0]?.id ?? null);

  if (!points.length) return null;

  return (
    <section id="route-map" className="scroll-mt-32">
      <SectionHeading
        title="Маршрут на карте"
        subtitle="Основные точки путешествия — нажмите на город, чтобы увидеть его на карте"
      />

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="grid lg:grid-cols-[1fr_260px]">
          <RouteMap
            points={points}
            selectedId={selectedId}
            onSelect={setSelectedId}
            className="h-72 lg:h-[420px]"
          />

          <ol className="flex flex-col gap-1 border-t border-gray-100 p-4 lg:border-l lg:border-t-0">
            {points.map((point, index) => {
              const active = point.id === selectedId;
              return (
                <li key={point.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(point.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      active
                        ? "bg-brand-light text-charcoal"
                        : "text-slate hover:bg-gray-50 hover:text-charcoal"
                    )}
                  >
                    <span
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                        active
                          ? "bg-brand text-white"
                          : "bg-gray-100 text-charcoal"
                      )}
                      aria-hidden
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-snug">{point.name}</span>
                      {point.dayNumber != null && (
                        <span className="mt-0.5 flex items-center gap-1 text-xs text-slate">
                          <MapPin className="h-3 w-3 shrink-0" aria-hidden />
                          День {point.dayNumber}
                        </span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        <p className="border-t border-gray-100 px-4 py-2.5 text-[11px] leading-relaxed text-slate/80">
          Карта построена по OpenStreetMap и CARTO — бесплатные сервисы с открытыми данными.
        </p>
      </div>
    </section>
  );
}
