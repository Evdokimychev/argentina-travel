"use client";

import { useMemo, useState } from "react";
import { MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ExcursionFilterBar from "@/components/excursions/ExcursionFilterBar";
import type { ExcursionSortOption } from "@/lib/excursion-catalog-filters";
import {
  countActiveExcursionFilters,
  type ExcursionCatalogFilters,
} from "@/lib/excursion-catalog-filters";
import { cn } from "@/lib/cn";
import type { ExcursionCity } from "@/types/excursion";

type ExcursionSearchPanelProps = {
  filters: ExcursionCatalogFilters;
  cities: ExcursionCity[];
  priceMax: number;
  hasUsdPrices: boolean;
  onChange: (filters: ExcursionCatalogFilters) => void;
  onReset: () => void;
  labels: {
    searchLabel: string;
    searchPlaceholder: string;
    cityLabel: string;
    cityAll: string;
    sortLabel: string;
    sortPopular: string;
    sortRating: string;
    sortPriceAsc: string;
    sortPriceDesc: string;
    filtersActive: string;
    resetFilters: string;
  };
};

function ClearButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-slate transition-colors hover:bg-gray-100 hover:text-charcoal"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

export default function ExcursionSearchPanel({
  filters,
  cities,
  priceMax,
  hasUsdPrices,
  onChange,
  onReset,
  labels,
}: ExcursionSearchPanelProps) {
  const [cityOpen, setCityOpen] = useState(false);
  const [cityQuery, setCityQuery] = useState("");

  const selectedCity = cities.find((city) => city.slug === filters.citySlug);
  const activeFilterCount = countActiveExcursionFilters(filters);

  const filteredCities = useMemo(() => {
    const q = cityQuery.trim().toLowerCase();
    if (!q) return cities;
    return cities.filter((city) => city.name.toLowerCase().includes(q));
  }, [cities, cityQuery]);

  const sortOptions: { value: ExcursionSortOption; label: string }[] = [
    { value: "popular", label: labels.sortPopular },
    { value: "rating", label: labels.sortRating },
    { value: "price_asc", label: labels.sortPriceAsc },
    { value: "price_desc", label: labels.sortPriceDesc },
  ];

  const patch = (next: Partial<ExcursionCatalogFilters>) => onChange({ ...filters, ...next });

  return (
    <div className="mt-6 space-y-4">
      <div className="rounded-3xl border border-gray-200/80 bg-white p-3 shadow-lg shadow-charcoal/5 sm:p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-stretch">
          <div className="flex min-w-0 flex-1 items-center rounded-2xl transition-colors hover:bg-gray-50">
            <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 lg:py-4">
              <Search className="h-5 w-5 shrink-0 text-sky" aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate">{labels.searchLabel}</p>
                <Input
                  type="search"
                  value={filters.query}
                  onChange={(event) => patch({ query: event.target.value })}
                  placeholder={labels.searchPlaceholder}
                  className="h-auto border-0 bg-transparent p-0 text-sm font-medium text-charcoal shadow-none placeholder:font-normal placeholder:text-slate focus-visible:ring-0"
                />
              </div>
              {filters.query.trim() ? (
                <ClearButton onClick={() => patch({ query: "" })} label="Очистить поиск" />
              ) : null}
            </div>
          </div>

          <div className="hidden w-px self-stretch bg-gray-200 lg:block" aria-hidden />

          <Popover open={cityOpen} onOpenChange={setCityOpen}>
            <div className="flex flex-1 items-center rounded-2xl transition-colors hover:bg-gray-50 lg:max-w-[240px]">
              <PopoverTrigger asChild>
                <button
                  type="button"
                  className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-left lg:py-4"
                >
                  <MapPin className="h-5 w-5 shrink-0 text-sky" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate">{labels.cityLabel}</p>
                    <p className="truncate text-sm font-medium text-charcoal">
                      {selectedCity?.name ?? labels.cityAll}
                    </p>
                  </div>
                </button>
              </PopoverTrigger>
              {filters.citySlug ? (
                <ClearButton
                  onClick={() => {
                    patch({ citySlug: "" });
                    setCityOpen(false);
                  }}
                  label="Сбросить город"
                />
              ) : null}
            </div>
            <PopoverContent className="w-[min(100vw-2rem,320px)] p-0" align="start">
              <div className="border-b border-gray-100 p-3">
                <Input
                  value={cityQuery}
                  onChange={(event) => setCityQuery(event.target.value)}
                  placeholder="Город…"
                  className="h-9"
                />
              </div>
              <ul className="max-h-64 overflow-y-auto p-2">
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      patch({ citySlug: "" });
                      setCityOpen(false);
                    }}
                    className={cn(
                      "w-full rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50",
                      !filters.citySlug && "bg-sky/10 font-medium text-sky",
                    )}
                  >
                    {labels.cityAll}
                  </button>
                </li>
                {filteredCities.map((city) => (
                  <li key={city.slug}>
                    <button
                      type="button"
                      onClick={() => {
                        patch({ citySlug: city.slug });
                        setCityOpen(false);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-gray-50",
                        filters.citySlug === city.slug && "bg-sky/10 font-medium text-sky",
                      )}
                    >
                      <span>{city.name}</span>
                      <span className="text-xs text-slate">{city.experienceCount}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>

          <div className="hidden w-px self-stretch bg-gray-200 lg:block" aria-hidden />

          <div className="flex items-center gap-2 px-2 py-2 lg:min-w-[200px] lg:px-3">
            <label className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-xs font-medium text-slate">{labels.sortLabel}</span>
              <select
                value={filters.sort}
                onChange={(event) => patch({ sort: event.target.value as ExcursionSortOption })}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-charcoal outline-none focus:border-sky focus:ring-2 focus:ring-sky/30"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ExcursionFilterBar
          filters={filters}
          priceMax={priceMax}
          hasUsdPrices={hasUsdPrices}
          onChange={onChange}
        />
        {activeFilterCount > 0 ? (
          <Button variant="ghost" size="sm" onClick={onReset} className="shrink-0 self-start sm:self-center">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
            {labels.resetFilters}
            <span className="ml-1 rounded-full bg-sky/10 px-1.5 py-0.5 text-xs font-semibold text-sky">
              {activeFilterCount}
            </span>
          </Button>
        ) : null}
      </div>

      {activeFilterCount > 0 ? (
        <p className="text-xs text-slate">
          {labels.filtersActive.replace("{count}", String(activeFilterCount))}
        </p>
      ) : null}
    </div>
  );
}
