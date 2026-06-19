"use client";

import { cn } from "@/lib/cn";
import type { TripPrepCategoryGroup, TripPrepSummary } from "@/types/trip-prep";

interface TripPrepChecklistProps {
  categories: TripPrepCategoryGroup[];
  summary: TripPrepSummary;
  onToggle: (itemId: string, checked: boolean) => void;
  disabled?: boolean;
  compact?: boolean;
}

export default function TripPrepChecklist({
  categories,
  summary,
  onToggle,
  disabled = false,
  compact = false,
}: TripPrepChecklistProps) {
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-charcoal">Прогресс подготовки</p>
            <p className="mt-1 text-xs text-slate">
              {summary.checked} из {summary.total} пунктов
              {summary.requiredTotal > 0
                ? ` · обязательных: ${summary.requiredChecked}/${summary.requiredTotal}`
                : null}
            </p>
          </div>
          <p className="text-2xl font-bold text-brand">{summary.percent}%</p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              summary.isComplete ? "bg-emerald-500" : "bg-brand"
            )}
            style={{ width: `${summary.percent}%` }}
            role="progressbar"
            aria-valuenow={summary.percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Прогресс подготовки к поездке"
          />
        </div>
        {summary.isComplete ? (
          <p className="mt-3 text-sm font-medium text-emerald-700">
            Обязательные пункты выполнены — можно сосредоточиться на деталях поездки.
          </p>
        ) : null}
      </div>

      {categories.map((group) => (
        <section key={group.category} className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-4 py-3 sm:px-5">
            <h3 className="font-heading text-base font-bold text-charcoal">{group.label}</h3>
          </div>
          <ul className={cn("divide-y divide-gray-100", compact ? "px-3 py-1" : "px-4 py-2 sm:px-5")}>
            {group.items.map((item) => (
              <li key={item.id} className="py-3">
                <label className="flex cursor-pointer items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand"
                    checked={item.checked}
                    disabled={disabled}
                    onChange={(event) => onToggle(item.id, event.target.checked)}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        item.checked ? "text-slate line-through" : "text-charcoal"
                      )}
                    >
                      {item.title}
                      {item.required ? (
                        <span className="ml-1.5 text-xs font-normal text-amber-700">· обязательно</span>
                      ) : null}
                    </span>
                    {item.description && !compact ? (
                      <span className="mt-1 block text-xs leading-relaxed text-slate">
                        {item.description}
                      </span>
                    ) : null}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
