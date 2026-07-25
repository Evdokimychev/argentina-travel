"use client";

import { useMemo, useState } from "react";
import {
  STEAK_CUT_OPTIONS,
  STEAK_CUT_SELECTOR_UI,
  type SteakCutPreference,
} from "@/data/steak-cut-selector";
import { cn } from "@/lib/cn";

type Props = {
  className?: string;
  labels?: typeof STEAK_CUT_SELECTOR_UI;
};

/**
 * Editorial cut picker. All options stay in the DOM; JS only highlights matches.
 */
export default function SteakCutSelector({
  className,
  labels = STEAK_CUT_SELECTOR_UI,
}: Props) {
  const [selected, setSelected] = useState<SteakCutPreference[]>([]);

  const toggle = (id: SteakCutPreference) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const ranked = useMemo(() => {
    if (selected.length === 0) return STEAK_CUT_OPTIONS;
    return [...STEAK_CUT_OPTIONS]
      .map((cut) => ({
        cut,
        score: cut.preferences.filter((pref) => selected.includes(pref)).length,
      }))
      .filter((row) => row.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((row) => row.cut);
  }, [selected]);

  const visible = selected.length === 0 ? STEAK_CUT_OPTIONS : ranked.slice(0, 3);

  return (
    // No boxed "card" chrome here — the widget already lives inside a
    // section that reads as part of the article. The cut list below is the
    // one visible surface (hairline border, no shadow), not nested inside
    // another bordered/shadowed wrapper.
    <section className={className} aria-label={labels.ariaLabel}>
      <h3 className="font-heading text-base font-semibold text-charcoal">{labels.title}</h3>
      <p className="mt-1 text-sm text-slate">{labels.hint}</p>

      <ul className="mt-4 flex flex-wrap gap-2" role="list">
        {labels.preferences.map((pref) => {
          const active = selected.includes(pref.id);
          return (
            <li key={pref.id}>
              <button
                type="button"
                aria-pressed={active}
                onClick={() => toggle(pref.id)}
                className={cn(
                  "inline-flex min-h-11 items-center rounded-full border px-3.5 py-2 text-sm font-medium transition",
                  active
                    ? "border-sky bg-sky text-white"
                    : "border-gray-200 bg-white text-charcoal hover:border-sky/40",
                )}
              >
                {pref.label}
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate">
          {selected.length === 0 ? "Все отрубы" : labels.resultTitle}
        </p>
        {selected.length > 0 && visible.length === 0 ? (
          <p className="mt-2 text-sm text-slate">{labels.empty}</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {STEAK_CUT_OPTIONS.map((cut) => {
              const isMatch = visible.some((item) => item.id === cut.id);
              const dimmed = selected.length > 0 && !isMatch;
              return (
                <li
                  key={cut.id}
                  hidden={dimmed}
                  className={cn(
                    "rounded-xl border border-gray-100 bg-surface-muted/40 p-3",
                    isMatch && selected.length > 0 && "border-sky/30 bg-sky/[0.06]",
                  )}
                >
                  <p className="font-medium text-charcoal">{cut.name}</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate">{cut.reason}</p>
                  <p className="mt-2 text-xs text-slate">
                    <span className="font-semibold text-charcoal">{labels.orderLabel}: </span>
                    <span lang="es">{cut.orderPhrase}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
