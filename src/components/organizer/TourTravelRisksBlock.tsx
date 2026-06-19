"use client";

import { cn } from "@/lib/cn";
import {
  TOUR_TRAVEL_RISK_KIND_GROUPS,
  getTourTravelRiskKindOption,
  type TourTravelRiskKind,
} from "@/data/tour-travel-risk-kinds";
import {
  toggleTravelRiskKind,
  updateTravelRiskAt,
} from "@/lib/tour-travel-risk";
import type { TourTravelRisk } from "@/types/tour-travel-risk";
import {
  ORGANIZER_TOUR_TRAVEL_RISKS_MAX,
  ORGANIZER_TOUR_TRAVEL_RISK_DESCRIPTION_MAX,
} from "@/types/tour-travel-risk";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

interface TourTravelRisksBlockProps {
  risks: TourTravelRisk[];
  onChange: (risks: TourTravelRisk[]) => void;
}

export default function TourTravelRisksBlock({ risks, onChange }: TourTravelRisksBlockProps) {
  const canAdd = risks.length < ORGANIZER_TOUR_TRAVEL_RISKS_MAX;

  function toggleKind(kind: TourTravelRiskKind) {
    if (!canAdd && !risks.some((risk) => risk.kind === kind)) return;
    onChange(toggleTravelRiskKind(risks, kind));
  }

  return (
    <section className="space-y-5 rounded-2xl border border-gray-200/60 bg-white p-4 shadow-sm sm:p-5">
      <div>
        <h3 className="text-base font-bold text-charcoal">Факторы маршрута и предупреждения</h3>
        <p className="mt-1 text-sm text-slate">
          Отметьте условия, которые участники должны учесть: высота, жара, дикая природа,
          удалённые районы и другое. Они появятся на странице тура рядом с параметрами сложности.
        </p>
      </div>

      <div className="space-y-4">
        {TOUR_TRAVEL_RISK_KIND_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate">
              {group.title}
            </p>
            <div className="flex flex-wrap gap-2">
              {group.kinds.map((kind) => {
                const option = getTourTravelRiskKindOption(kind);
                const Icon = option.icon;
                const active = risks.some((risk) => risk.kind === kind);
                return (
                  <button
                    key={kind}
                    type="button"
                    onClick={() => toggleKind(kind)}
                    className={cn(
                      "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      active
                        ? "border-amber-300 bg-amber-50 font-medium text-amber-950"
                        : "border-gray-200 bg-white text-charcoal hover:border-gray-300 hover:bg-gray-50"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {risks.length > 0 ? (
        <div className="space-y-3 border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-charcoal">Детали выбранных факторов</p>
          {risks.map((risk) => {
            const option = getTourTravelRiskKindOption(risk.kind);
            return (
              <article
                key={risk.id}
                className="space-y-3 rounded-2xl border border-amber-100 bg-amber-50/30 p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-charcoal">{option.label}</p>
                  <button
                    type="button"
                    onClick={() => toggleKind(risk.kind)}
                    className="text-xs font-medium text-slate transition-colors hover:text-red-600"
                  >
                    Убрать
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`risk-title-${risk.id}`}
                    className="text-xs font-medium text-slate"
                  >
                    Заголовок (необязательно)
                  </label>
                  <Input
                    id={`risk-title-${risk.id}`}
                    value={risk.title ?? ""}
                    onChange={(event) =>
                      onChange(updateTravelRiskAt(risks, risk.id, { title: event.target.value }))
                    }
                    placeholder={option.label}
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor={`risk-description-${risk.id}`}
                    className="text-xs font-medium text-slate"
                  >
                    Что учесть участникам
                  </label>
                  <Textarea
                    id={`risk-description-${risk.id}`}
                    value={risk.description ?? ""}
                    maxLength={ORGANIZER_TOUR_TRAVEL_RISK_DESCRIPTION_MAX}
                    onChange={(event) =>
                      onChange(
                        updateTravelRiskAt(risks, risk.id, { description: event.target.value })
                      )
                    }
                    placeholder={option.defaultHint}
                    rows={3}
                  />
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-gray-200 px-4 py-5 text-center text-sm text-slate">
          Пока факторы не указаны — выберите подходящие метки выше.
        </p>
      )}
    </section>
  );
}
