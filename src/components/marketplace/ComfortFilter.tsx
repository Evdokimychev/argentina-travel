"use client";

import { ComfortLevel } from "@/types";
import { COMFORT_LEVELS, COMFORT_DOT_COUNT } from "@/data/tour-levels";
import { ComfortDotRating } from "./sidebar-filter-ui";
import { cn } from "@/lib/cn";
import { Check, Bed, Hotel, Sparkles, Crown, Tent, type LucideIcon } from "lucide-react";
import { FilterFooter } from "./FilterPopover";

const COMFORT_ICONS: Record<ComfortLevel, LucideIcon> = {
  Базовый: Tent,
  Стандарт: Bed,
  Комфорт: Hotel,
  Премиум: Sparkles,
  Люкс: Crown,
};

interface ComfortFilterProps {
  selected: ComfortLevel[];
  counts: Partial<Record<ComfortLevel, number>>;
  onToggle: (level: ComfortLevel) => void;
  onClear: () => void;
  onApply: () => void;
}

export default function ComfortFilter({
  selected,
  counts,
  onToggle,
  onClear,
  onApply,
}: ComfortFilterProps) {
  return (
    <>
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-semibold text-charcoal">Уровень комфорта</p>
        <p className="mt-0.5 text-xs text-slate">базовый → люкс</p>
      </div>

      <ul className="max-h-80 overflow-y-auto p-2">
        {COMFORT_LEVELS.map(({ level, description }) => {
          const isSelected = selected.includes(level);
          const count = counts[level] ?? 0;
          const disabled = count === 0;
          const Icon = COMFORT_ICONS[level];
          const dots = COMFORT_DOT_COUNT[level];

          return (
            <li key={level}>
              <button
                type="button"
                onClick={() => !disabled && onToggle(level)}
                disabled={disabled}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl px-2.5 py-2.5 text-left transition-all",
                  isSelected
                    ? "bg-brand-light/60 ring-1 ring-brand/15"
                    : "hover:bg-gray-50",
                  disabled && "cursor-not-allowed opacity-45"
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
                      {level}
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
                  <p className="mt-0.5 text-xs leading-relaxed text-slate">{description}</p>
                  <ComfortDotRating filled={dots} className="mt-1.5" />
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
