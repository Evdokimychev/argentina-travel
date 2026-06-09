"use client";

import { Minus, Plus } from "lucide-react";
import { formatTouristsRange } from "@/lib/pluralize";
import { formatMinimumAgeSummary } from "@/lib/tour-age";
import { cn } from "@/lib/cn";

interface GuestCounterProps {
  value: number;
  min: number;
  max: number;
  minimumAge?: number;
  hint?: string;
  onChange: (value: number) => void;
  className?: string;
}

function groupSizeHint(min: number, max: number, minimumAge?: number): string {
  const range = formatTouristsRange(min, max);
  if (minimumAge != null && minimumAge > 0) {
    return `${range}, ${formatMinimumAgeSummary(minimumAge)}`;
  }
  return range;
}

export default function GuestCounter({
  value,
  min,
  max,
  minimumAge,
  hint,
  onChange,
  className,
}: GuestCounterProps) {
  return (
    <div className={cn("flex items-center justify-between gap-4", className)}>
      <div className="min-w-0">
        <p className="text-sm font-medium text-charcoal">Кол-во туристов</p>
        <p className="mt-0.5 text-xs text-slate">
          {hint ?? groupSizeHint(min, max, minimumAge)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label="Уменьшить количество туристов"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-charcoal transition-colors hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-6 text-center text-sm font-semibold tabular-nums text-charcoal">
          {value}
        </span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          aria-label="Увеличить количество туристов"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-charcoal shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
