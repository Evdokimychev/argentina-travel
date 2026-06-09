"use client";

import { TourLanguage } from "@/types";
import { LANGUAGE_FILTER_OPTIONS } from "@/data/language-options";
import { cn } from "@/lib/cn";
import { Check } from "lucide-react";
import { FilterFooter } from "./FilterPopover";

interface LanguageFilterProps {
  selected: TourLanguage[];
  counts: Partial<Record<TourLanguage, number>>;
  onToggle: (language: TourLanguage) => void;
  onClear: () => void;
  onApply: () => void;
}

export default function LanguageFilter({
  selected,
  counts,
  onToggle,
  onClear,
  onApply,
}: LanguageFilterProps) {
  return (
    <>
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-semibold text-charcoal">Язык сопровождения</p>
        <p className="mt-0.5 text-xs text-slate">
          Выберите язык, на котором проводится тур
        </p>
      </div>

      <ul className="max-h-80 overflow-y-auto p-2">
        {LANGUAGE_FILTER_OPTIONS.map(({ language, flag, nativeName, description }) => {
          const isSelected = selected.includes(language);
          const count = counts[language] ?? 0;
          const disabled = count === 0;

          return (
            <li key={language}>
              <button
                type="button"
                onClick={() => !disabled && onToggle(language)}
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
                    "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg transition-colors",
                    isSelected ? "bg-white" : "bg-gray-100"
                  )}
                  aria-hidden
                >
                  {flag}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-start justify-between gap-2">
                    <span>
                      <span className="text-sm font-medium leading-snug text-charcoal">
                        {language}
                      </span>
                      <span className="ml-1.5 text-xs text-slate">{nativeName}</span>
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
