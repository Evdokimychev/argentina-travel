"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronDown, Globe2 } from "lucide-react";
import AirlineLogo from "@/components/guide/hub/AirlineLogo";
import { cn } from "@/lib/cn";
import type { TravelHubAirlineCompare } from "@/types/guide-travel-hub";

const BADGE_META = {
  recommended: {
    label: "Оптимальный выбор",
    icon: CheckCircle2,
    className: "border-emerald-200 bg-emerald-50 text-emerald-800",
  },
  network: {
    label: "Крупнейшая сеть",
    icon: Globe2,
    className: "border-sky/25 bg-sky/5 text-sky",
  },
  caution: {
    label: "Не рекомендуем",
    icon: AlertTriangle,
    className: "border-amber-200 bg-amber-50 text-amber-900",
  },
} as const;

type DomesticAirlinesSectionProps = {
  airlines: TravelHubAirlineCompare[];
};

export default function DomesticAirlinesSection({ airlines }: DomesticAirlinesSectionProps) {
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const selected = airlines.find((airline) => airline.name === selectedName) ?? null;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        {airlines.map((airline) => {
          const active = selectedName === airline.name;
          const badge = airline.badge ? BADGE_META[airline.badge] : null;
          const BadgeIcon = badge?.icon;

          return (
            <button
              key={airline.name}
              type="button"
              onClick={() => setSelectedName(active ? null : airline.name)}
              className={cn(
                "flex h-full flex-col rounded-2xl border bg-white p-4 text-left shadow-sm transition-all",
                "hover:border-sky/30 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky/40",
                active && "border-sky/40 ring-2 ring-sky/20",
                airline.badge === "caution" && !active && "border-amber-200",
                airline.badge === "recommended" && !active && "ring-1 ring-emerald-100"
              )}
              aria-expanded={active}
            >
              <div className="flex items-start gap-3">
                <AirlineLogo name={airline.name} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold leading-snug text-charcoal">
                    {airline.name}
                  </p>
                  {badge && BadgeIcon ? (
                    <span
                      className={cn(
                        "mt-1.5 inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                        badge.className
                      )}
                    >
                      <BadgeIcon className="h-3 w-3 shrink-0" aria-hidden />
                      {badge.label}
                    </span>
                  ) : null}
                </div>
                <ChevronDown
                  className={cn(
                    "mt-1 h-4 w-4 shrink-0 text-slate transition-transform",
                    active && "rotate-180 text-sky"
                  )}
                  aria-hidden
                />
              </div>

              <p className="mt-3 text-xs leading-relaxed text-sky">{airline.tagline}</p>

              <ul className="mt-3 space-y-1.5 text-xs text-charcoal">
                <SummaryLine label="Ручная кладь" value={airline.summary.handLuggage} />
                <SummaryLine label="Багаж" value={airline.summary.baggage} />
                <SummaryLine label="Лояльность" value={airline.summary.loyalty} />
              </ul>

              <p className="mt-3 text-xs font-medium text-charcoal">{airline.summary.priceHint}</p>
            </button>
          );
        })}
      </div>

      {selected ? (
        <div
          className="animate-fade-in-up rounded-2xl border border-gray-100 bg-surface-muted/40 p-4 sm:p-5"
          role="region"
          aria-label={`Подробности: ${selected.name}`}
        >
          <div className="flex items-center gap-2">
            <AirlineLogo name={selected.name} size="sm" />
            <p className="font-display font-bold text-charcoal">{selected.name} — подробнее</p>
          </div>

          {selected.warning ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              {selected.warning}
            </p>
          ) : null}

          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <DetailItem label="Ручная кладь" value={selected.handLuggage} />
            <DetailItem label="Багаж" value={selected.checkedBaggage} />
            <DetailItem label="Лояльность" value={selected.loyaltyProgram} />
            <DetailItem label="Комфорт" value={selected.comfort} />
            <DetailItem label="Пунктуальность" value={selected.punctuality} />
            <DetailItem label="Цены" value={selected.price} />
          </dl>

          {selected.note ? (
            <p className="mt-4 border-t border-gray-200/80 pt-3 text-xs leading-relaxed text-slate">
              {selected.note}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-center text-xs text-slate">
          Нажмите на карточку, чтобы раскрыть подробное сравнение
        </p>
      )}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex gap-2">
      <span className="shrink-0 text-slate">{label}:</span>
      <span className="min-w-0 break-words">{value}</span>
    </li>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-slate">{label}</dt>
      <dd className="mt-1 text-sm leading-relaxed text-charcoal">{value}</dd>
    </div>
  );
}
