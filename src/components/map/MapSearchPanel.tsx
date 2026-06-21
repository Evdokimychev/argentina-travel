"use client";

import { Search } from "lucide-react";
import { cn } from "@/lib/cn";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  suggestions?: string[];
  className?: string;
};

export default function MapSearchPanel({
  value,
  onChange,
  onSubmit,
  suggestions = [],
  className,
}: Props) {
  return (
    <div className={cn("relative w-full max-w-md", className)}>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="flex items-center gap-2 rounded-2xl border border-gray-200/80 bg-white/95 px-3 py-2 shadow-sm backdrop-blur-sm"
      >
        <Search className="h-4 w-4 shrink-0 text-slate" aria-hidden />
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
          className="rounded-lg bg-sky px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-dark"
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
