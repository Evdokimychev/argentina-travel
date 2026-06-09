"use client";

import { AccommodationType } from "@/types";
import { ACCOMMODATION_FILTER_OPTIONS } from "@/data/accommodation-options";
import { cn } from "@/lib/cn";
import { Check } from "lucide-react";
import { FilterFooter } from "./FilterPopover";

interface AccommodationFilterProps {
  selected: AccommodationType[];
  counts: Partial<Record<AccommodationType, number>>;
  onToggle: (type: AccommodationType) => void;
  onClear: () => void;
  onApply: () => void;
}

export default function AccommodationFilter({
  selected,
  counts,
  onToggle,
  onClear,
  onApply,
}: AccommodationFilterProps) {
  return (
    <>
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-semibold text-charcoal">Тип проживания</p>
        <p className="mt-0.5 text-xs text-slate">
          Выберите один или несколько форматов размещения
        </p>
      </div>

      <ul className="max-h-80 overflow-y-auto p-2">
        {ACCOMMODATION_FILTER_OPTIONS.map(({ type, description, icon: Icon }) => {
          const isSelected = selected.includes(type);
          const count = counts[type] ?? 0;

          return (
            <li key={type}>
              <button
                type="button"
                onClick={() => onToggle(type)}
                disabled={count === 0}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all",
                  isSelected
                    ? "bg-brand-light/60 ring-1 ring-brand/15"
                    : "hover:bg-gray-50",
                  count === 0 && "cursor-not-allowed opacity-45"
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors",
                    isSelected ? "bg-white text-brand" : "bg-gray-100 text-charcoal"
                  )}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span className="text-sm font-medium leading-snug text-charcoal">
                      {type}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5">
                      {count > 0 && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] tabular-nums text-slate">
                          {count}
                        </span>
                      )}
                      {isSelected && (
                        <Check className="h-4 w-4 text-brand" strokeWidth={2.5} aria-hidden />
                      )}
                    </span>
                  </span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-slate">
                    {description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <FilterFooter onClear={onClear} onApply={onApply} applyAfterClear={false} />
    </>
  );
}
