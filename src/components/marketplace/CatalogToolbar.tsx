"use client";

import { ChevronDown, LayoutGrid, LayoutList, Map } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  PRIMARY_SORT_OPTIONS,
  SECONDARY_SORT_OPTIONS,
  TourSortOption,
} from "@/lib/sort-tours";
import { formatToursFound, filtersWord } from "@/lib/pluralize";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import type { CatalogViewMode } from "@/lib/catalog-filter-url";

export type { CatalogViewMode };

interface CatalogToolbarProps {
  count: number;
  sort: TourSortOption;
  onSortChange: (sort: TourSortOption) => void;
  viewMode: CatalogViewMode;
  onViewModeChange: (mode: CatalogViewMode) => void;
  activeFilterCount?: number;
  onResetFilters?: () => void;
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
      className="flex shrink-0 items-center rounded-full bg-gray-100 p-1"
      role="group"
      aria-label="Вид каталога"
    >
      <button
        type="button"
        onClick={() => onViewModeChange("list")}
        aria-pressed={viewMode === "list"}
        aria-label="Список"
        className={cn(
          "flex h-8 w-9 items-center justify-center rounded-full transition-all sm:h-9 sm:w-10",
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
          "flex h-8 w-9 items-center justify-center rounded-full transition-all sm:h-9 sm:w-10",
          viewMode === "grid"
            ? "bg-white text-charcoal shadow-sm"
            : "text-slate hover:text-charcoal"
        )}
      >
        <LayoutGrid className="h-[18px] w-[18px]" />
      </button>
      <button
        type="button"
        onClick={() => onViewModeChange("map")}
        aria-pressed={viewMode === "map"}
        aria-label="Карта"
        className={cn(
          "flex h-8 w-9 items-center justify-center rounded-full transition-all sm:h-9 sm:w-10",
          viewMode === "map"
            ? "bg-white text-charcoal shadow-sm"
            : "text-slate hover:text-charcoal"
        )}
      >
        <Map className="h-[18px] w-[18px]" />
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
  activeFilterCount = 0,
  onResetFilters,
}: CatalogToolbarProps) {
  const isSecondary = SECONDARY_SORT_OPTIONS.some((o) => o.value === sort);
  const secondaryLabel =
    SECONDARY_SORT_OPTIONS.find((o) => o.value === sort)?.label ?? "Ещё";

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-gray-100 pb-4">
      <p className="shrink-0 text-sm text-slate">
        {formatToursFound(count)}
        {activeFilterCount > 0 && (
          <span className="ml-1.5 text-brand">· {filtersWord(activeFilterCount)}</span>
        )}
      </p>

      <div
        role="group"
        aria-label="Сортировка"
        className="scrollbar-hide flex min-w-0 flex-1 flex-nowrap items-center gap-0.5 overflow-x-auto rounded-full bg-gray-100 px-1 py-1"
      >
        {PRIMARY_SORT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onSortChange(option.value)}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
              sort === option.value
                ? "bg-white text-brand shadow-sm"
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
                "flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-medium transition-colors sm:px-3 sm:text-sm",
                isSecondary
                  ? "bg-white text-brand shadow-sm"
                  : "text-slate hover:text-charcoal"
              )}
            >
              {isSecondary ? secondaryLabel : "Ещё"}
              <ChevronDown className="h-3.5 w-3.5 opacity-60 sm:h-4 sm:w-4" />
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

      <div className="flex shrink-0 items-center gap-2">
        {activeFilterCount > 0 && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 shrink-0 px-2 text-xs"
            onClick={onResetFilters}
          >
            Сбросить
          </Button>
        )}
        <ViewToggle viewMode={viewMode} onViewModeChange={onViewModeChange} />
      </div>
    </div>
  );
}
