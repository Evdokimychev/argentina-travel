"use client";

import { ChevronDown, LayoutGrid, LayoutList } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  PRIMARY_SORT_OPTIONS,
  SECONDARY_SORT_OPTIONS,
  TourSortOption,
} from "@/lib/sort-tours";
import { formatToursFound } from "@/lib/pluralize";
import { cn } from "@/lib/cn";

export type CatalogViewMode = "grid" | "list";

interface CatalogToolbarProps {
  count: number;
  sort: TourSortOption;
  onSortChange: (sort: TourSortOption) => void;
  viewMode: CatalogViewMode;
  onViewModeChange: (mode: CatalogViewMode) => void;
}

function ViewToggle({
  viewMode,
  onViewModeChange,
}: {
  viewMode: CatalogViewMode;
  onViewModeChange: (mode: CatalogViewMode) => void;
}) {
  return (
    <div
      className="flex items-center rounded-full bg-gray-100 p-1"
      role="group"
      aria-label="Вид карточек"
    >
      <button
        type="button"
        onClick={() => onViewModeChange("list")}
        aria-pressed={viewMode === "list"}
        aria-label="Список"
        className={cn(
          "flex h-9 w-10 items-center justify-center rounded-full transition-all",
          viewMode === "list"
            ? "bg-white text-charcoal shadow-sm"
            : "text-slate hover:text-charcoal"
        )}
      >
        <LayoutList className="h-[18px] w-[18px]" />
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange("grid")}
        aria-pressed={viewMode === "grid"}
        aria-label="Сетка"
        className={cn(
          "flex h-9 w-10 items-center justify-center rounded-full transition-all",
          viewMode === "grid"
            ? "bg-white text-charcoal shadow-sm"
            : "text-slate hover:text-charcoal"
        )}
      >
        <LayoutGrid className="h-[18px] w-[18px]" />
      </button>
    </div>
  );
}

export default function CatalogToolbar({
  count,
  sort,
  onSortChange,
  viewMode,
  onViewModeChange,
}: CatalogToolbarProps) {
  const isSecondary = SECONDARY_SORT_OPTIONS.some((o) => o.value === sort);
  const secondaryLabel =
    SECONDARY_SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Ещё";

  return (
    <div className="space-y-3 border-b border-gray-100 pb-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate">{formatToursFound(count)}</p>
        <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>

      <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
        {PRIMARY_SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSortChange(option.value)}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              sort === option.value
                ? "text-brand"
                : "text-slate hover:text-charcoal"
            )}
          >
            {option.label}
          </button>
        ))}

        <Popover>
          <PopoverTrigger asChild>
            <button
              type="button"
              className={cn(
                "flex items-center gap-0.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                isSecondary ? "text-brand" : "text-slate hover:text-charcoal"
              )}
            >
              {isSecondary ? secondaryLabel : "Ещё"}
              <ChevronDown className="h-4 w-4 opacity-60" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-52 p-1" align="start">
            <ul>
              {SECONDARY_SORT_OPTIONS.map((option) => (
                <li key={option.value}>
                  <button
                    type="button"
                    onClick={() => onSortChange(option.value)}
                    className={cn(
                      "w-full rounded-lg px-3 py-2.5 text-left text-sm transition-colors hover:bg-gray-50",
                      sort === option.value
                        ? "font-semibold text-brand"
                        : "text-charcoal"
                    )}
                  >
                    {option.label}
                  </button>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
