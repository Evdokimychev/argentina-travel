"use client";

import { Check } from "lucide-react";
import {
  COMFORT_DOT_COUNT,
  COMFORT_ICONS,
  COMFORT_LEVELS,
  primaryComfortLevel,
} from "@/data/tour-levels";
import { NO_ACCOMMODATION_LABEL } from "@/lib/tour-accommodation";
import {
  ComfortBarRating,
  ComfortDotRating,
} from "@/components/marketplace/sidebar-filter-ui";
import { cn } from "@/lib/cn";
import type { ComfortLevel } from "@/types";

interface TourComfortBlockProps {
  comfortLevels: ComfortLevel[];
  onChange: (levels: ComfortLevel[]) => void;
}

export default function TourComfortBlock({ comfortLevels, onChange }: TourComfortBlockProps) {
  function toggleLevel(level: ComfortLevel) {
    if (level === NO_ACCOMMODATION_LABEL) {
      const selected = comfortLevels.includes(level);
      if (selected && comfortLevels.length === 1) return;
      onChange(selected ? comfortLevels.filter((item) => item !== level) : [NO_ACCOMMODATION_LABEL]);
      return;
    }

    const housed = comfortLevels.filter((item) => item !== NO_ACCOMMODATION_LABEL);
    const selected = housed.includes(level);

    if (selected) {
      if (housed.length === 1) return;
      onChange(housed.filter((item) => item !== level));
      return;
    }

    onChange([...housed, level]);
  }

  const primaryLevel = primaryComfortLevel(comfortLevels);
  const primaryDots = COMFORT_DOT_COUNT[primaryLevel];

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h2 className="font-display text-xl font-bold text-charcoal sm:text-2xl">
          Уровень комфорта в туре
        </h2>
        <p className="mt-1 text-sm text-slate">без проживания → люкс</p>
      </div>

      <div className="rounded-2xl border border-amber-200/80 bg-amber-50/80 px-4 py-3 text-sm leading-relaxed text-charcoal">
        Для однодневных туров без ночёвки выберите «Без проживания». Остальные уровни можно
        комбинировать, если в туре предусмотрен выбор размещения.
      </div>

      <div className="space-y-3">
        {COMFORT_LEVELS.map(({ level, description }) => {
          const selected = comfortLevels.includes(level);
          const Icon = COMFORT_ICONS[level];
          const dots = COMFORT_DOT_COUNT[level];

          return (
            <label
              key={level}
              className={cn(
                "flex cursor-pointer gap-3 rounded-2xl border p-4 transition-colors",
                selected
                  ? "border-sky/40 bg-sky/[0.08] ring-1 ring-sky/20"
                  : "border-gray-200 bg-white hover:border-gray-300"
              )}
            >
              <span
                className={cn(
                  "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors",
                  selected
                    ? "border-sky bg-sky text-white"
                    : "border-gray-300 bg-white text-transparent"
                )}
                aria-hidden
              >
                <Check className="h-3 w-3" strokeWidth={3} />
              </span>
              <input
                type="checkbox"
                checked={selected}
                onChange={() => toggleLevel(level)}
                className="sr-only"
              />
              <span className="flex min-w-0 flex-1 gap-3">
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    selected ? "bg-white text-brand shadow-sm" : "bg-gray-100 text-charcoal"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-charcoal">{level}</span>
                    <ComfortDotRating filled={dots} />
                  </span>
                  <ComfortBarRating filled={dots} className="mt-2.5" />
                  <p className="mt-2.5 text-sm leading-relaxed text-slate">{description}</p>
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="space-y-3 border-t border-gray-200/80 pt-4">
        <p className="flex flex-wrap items-center gap-2 text-xs text-slate">
          <span>Основной уровень для каталога:</span>
          <span className="font-medium text-charcoal">{primaryLevel}</span>
          <ComfortDotRating filled={primaryDots} />
          <span className="text-slate/80">
            ({primaryDots} из 5{primaryLevel === NO_ACCOMMODATION_LABEL ? ", без ночёвки" : ""})
          </span>
        </p>
        <p className="flex flex-wrap items-center gap-2 text-xs text-slate">
          <span>Шкала:</span>
          <ComfortDotRating filled={0} />
          <span aria-hidden>→</span>
          <ComfortDotRating filled={5} />
          <span className="text-slate/70">без проживания → люкс</span>
        </p>
      </div>
    </section>
  );
}
