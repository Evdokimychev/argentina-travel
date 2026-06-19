"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/cn";

type StarRatingInputProps = {
  value: number;
  onChange: (value: number) => void;
  max?: number;
  className?: string;
};

export function StarRatingInput({ value, onChange, max = 5, className }: StarRatingInputProps) {
  const normalized = Math.min(max, Math.max(1, Math.round(value)));

  return (
    <div className={cn("inline-flex items-center gap-1", className)} role="group" aria-label="Оценка">
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const active = starValue <= normalized;

        return (
          <button
            key={starValue}
            type="button"
            onClick={() => onChange(starValue)}
            className="rounded p-0.5 transition-colors hover:text-sun"
            aria-label={`${starValue} из ${max}`}
            aria-pressed={active}
          >
            <Star
              className={cn("h-6 w-6", active ? "fill-sun text-sun" : "text-gray-300")}
              aria-hidden
            />
          </button>
        );
      })}
    </div>
  );
}
