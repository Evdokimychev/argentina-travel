"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ChevronDown } from "lucide-react";
import { TourItineraryDay } from "@/types";
import { SectionHeading } from "./InfoModal";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/cn";
import { formatOpenedDaysLabel, formatDaysOpenOfTotal } from "@/lib/pluralize";

function ItineraryExpandToggle({
  allExpanded,
  openCount,
  totalDays,
  openSegments,
  onToggle,
}: {
  allExpanded: boolean;
  openCount: number;
  totalDays: number;
  openSegments: boolean[];
  onToggle: () => void;
}) {
  return (
    <div
      role="group"
      aria-label={allExpanded ? "Свернуть все дни программы" : "Раскрыть все дни программы"}
      className="flex max-w-full items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-sky/30 hover:bg-sky/5"
    >
      <button
        type="button"
        onClick={onToggle}
        className="min-w-0 flex-1 text-left"
        aria-label={allExpanded ? "Свернуть все дни программы" : "Раскрыть все дни программы"}
      >
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-charcoal">
            {allExpanded ? "Свернуть все" : "Раскрыть все"}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-slate">
            {openCount}/{totalDays}
          </span>
        </div>

        <div
          className="mt-2 flex gap-0.5"
          aria-hidden
          title={formatDaysOpenOfTotal(openCount, totalDays)}
        >
          {openSegments.map((isOpen, index) => (
            <span
              key={index}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                isOpen ? "bg-sky" : "bg-gray-200"
              )}
            />
          ))}
        </div>

        <p className="mt-1.5 text-xs text-slate">{formatOpenedDaysLabel(openCount, allExpanded)}</p>
      </button>

      <Switch checked={allExpanded} onCheckedChange={() => onToggle()} aria-hidden />
    </div>
  );
}

function ItineraryDayCard({
  day,
  isOpen,
  onToggle,
}: {
  day: TourItineraryDay;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const images = day.images ?? [];
  const activities = day.activities ?? [];
  const meals = day.meals ?? [];

  return (
    <div className="relative pb-6 last:pb-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isOpen}
        className="flex w-full items-start gap-4 text-left"
      >
        <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-patagonia text-sm font-bold text-white shadow-md sm:h-12 sm:w-12">
          {day.dayNumber}
        </span>
        <div className="flex-1 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold text-charcoal">
              День {day.dayNumber}. {day.title}
            </h3>
            <ChevronDown
              className={cn(
                "h-5 w-5 shrink-0 text-slate transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </div>
          {isOpen && (
            <div className="mt-4 space-y-4 animate-fade-in-up">
              <p className="text-sm leading-relaxed text-slate">{day.description}</p>
              {images.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img) => (
                    <div
                      key={img}
                      className="relative h-24 w-36 shrink-0 overflow-hidden rounded-xl"
                    >
                      <Image src={img} alt="" fill className="object-cover" sizes="144px" />
                    </div>
                  ))}
                </div>
              )}
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-pampas p-3">
                  <p className="text-xs font-medium text-slate">Активности</p>
                  <ul className="mt-1 space-y-1 text-sm text-charcoal">
                    {activities.map((a) => (
                      <li key={a}>• {a}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-pampas p-3">
                  <p className="text-xs font-medium text-slate">Питание</p>
                  <ul className="mt-1 space-y-1 text-sm text-charcoal">
                    {meals.map((m) => (
                      <li key={m}>• {m}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-xl bg-pampas p-3">
                  <p className="text-xs font-medium text-slate">Проживание</p>
                  <p className="mt-1 text-sm text-charcoal">{day.accommodation}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}

interface ItinerarySectionProps {
  days?: TourItineraryDay[] | null;
}

export default function ItinerarySection({ days }: ItinerarySectionProps) {
  const itineraryDays = useMemo(() => days ?? [], [days]);
  const firstDayId = itineraryDays[0]?.id;

  const [openDays, setOpenDays] = useState<Set<string>>(() =>
    firstDayId ? new Set([firstDayId]) : new Set()
  );

  useEffect(() => {
    if (itineraryDays.length === 0) return;
    setOpenDays((prev) => {
      const validIds = new Set(itineraryDays.map((d) => d.id));
      const filtered = new Set([...prev].filter((id) => validIds.has(id)));
      if (filtered.size > 0) return filtered;
      const id = itineraryDays[0]?.id;
      return id ? new Set([id]) : new Set();
    });
  }, [itineraryDays]);

  const openCount = openDays.size;
  const totalDays = itineraryDays.length;
  const allExpanded = totalDays > 0 && openCount === totalDays;

  const openSegments = useMemo(
    () => itineraryDays.map((day) => openDays.has(day.id)),
    [itineraryDays, openDays]
  );

  if (totalDays === 0) return null;

  function toggleDay(id: string) {
    setOpenDays((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        if (next.size === 1) return prev;
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleExpandAll() {
    if (allExpanded) {
      setOpenDays(firstDayId ? new Set([firstDayId]) : new Set());
    } else {
      setOpenDays(new Set(itineraryDays.map((d) => d.id)));
    }
  }

  return (
    <section id="itinerary" className="tour-section-target">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <SectionHeading title="Программа по дням" />
        {totalDays > 1 && (
          <ItineraryExpandToggle
            allExpanded={allExpanded}
            openCount={openCount}
            totalDays={totalDays}
            openSegments={openSegments}
            onToggle={handleExpandAll}
          />
        )}
      </div>

      <div className="relative space-y-0">
        <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-200 sm:left-[23px]" />
        {itineraryDays.map((day) => (
          <ItineraryDayCard
            key={day.id}
            day={day}
            isOpen={openDays.has(day.id)}
            onToggle={() => toggleDay(day.id)}
          />
        ))}
      </div>
    </section>
  );
}
