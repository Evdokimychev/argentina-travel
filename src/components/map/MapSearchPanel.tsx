"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  suggestions?: string[];
  className?: string;
  compact?: boolean;
};

export default function MapSearchPanel({
  value,
  onChange,
  onSubmit,
  suggestions = [],
  className,
  compact = false,
}: Props) {
  return (
    <div className={cn("relative w-full", compact ? "max-w-none" : "max-w-md", className)}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className={cn(
          "flex items-center gap-2 rounded-xl border border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-sm",
          compact ? "px-2.5 py-1.5" : "rounded-2xl px-3 py-2"
        )}
      >
        <Search className="h-3.5 w-3.5 shrink-0 text-slate" aria-hidden />
        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Барилоче, Игуасу, Перито-Морено…"
          className="min-w-0 flex-1 bg-transparent text-sm text-charcoal outline-none placeholder:text-slate"
          aria-label="Поиск на карте"
        />
        <button
          type="submit"
          className="rounded-lg bg-sky px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-sky-dark"
        >
          Найти
        </button>
      </form>
      {suggestions.length > 0 && value.trim() ? (
        <ul className="absolute z-30 mt-1 max-h-48 w-full overflow-y-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
          {suggestions.map((label) => (
            <li key={label}>
              <button
                type="button"
                className="block w-full px-3 py-2 text-left text-sm text-charcoal hover:bg-gray-50"
                onClick={() => {
                  onChange(label);
                  onSubmit();
                }}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
