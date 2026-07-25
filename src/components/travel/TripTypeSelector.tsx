"use client";

import { useState } from "react";
import {
  TRIP_TYPE_PRIORITIES,
  TRIP_TYPE_SELECTOR_UI,
  type PackingScenario,
} from "@/data/patagonia-packing-list";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  labels?: typeof TRIP_TYPE_SELECTOR_UI;
  defaultScenario?: PackingScenario;
};

/**
 * Выбор формата поездки → приоритетные вещи. Все форматы остаются в DOM;
 * JS только подсвечивает выбранный набор приоритетов.
 */
export default function TripTypeSelector({
  className,
  labels = TRIP_TYPE_SELECTOR_UI,
  defaultScenario = "city",
}: Props) {
  const [selected, setSelected] = useState<PackingScenario>(defaultScenario);
  const active =
    TRIP_TYPE_PRIORITIES.find((trip) => trip.scenario === selected) ?? TRIP_TYPE_PRIORITIES[0];

  return (
    <section
      className={cn(
        "rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:p-5",
        className,
      )}
      aria-label={labels.ariaLabel}
    >
      <h3 className="font-heading text-base font-semibold text-charcoal">{labels.title}</h3>
      <p className="mt-1 text-sm text-slate">{labels.hint}</p>

      <ul className="mt-4 flex flex-wrap gap-2" role="list">
        {TRIP_TYPE_PRIORITIES.map((trip) => {
          const isActive = trip.scenario === selected;
          return (
            <li key={trip.scenario}>
              <button
                type="button"
                aria-pressed={isActive}
                onClick={() => setSelected(trip.scenario)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition motion-reduce:transition-none",
                  isActive
                    ? "border-sky bg-sky text-white"
                    : "border-gray-200 bg-white text-charcoal hover:border-sky/40",
                )}
              >
                {trip.title}
              </button>
            </li>
          );
        })}
      </ul>

      {active ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate">
            {labels.resultTitle}
          </p>
          <ul className="mt-2 grid gap-2 sm:grid-cols-2" role="list">
            {active.priorities.map((priority) => (
              <li
                key={priority}
                className="flex gap-2 rounded-xl border border-gray-100 bg-surface-muted/40 px-3 py-2 text-sm leading-snug text-charcoal"
              >
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky" aria-hidden />
                <span>{priority}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
