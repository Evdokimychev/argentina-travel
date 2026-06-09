"use client";

import { useMemo, useState, useEffect } from "react";
import MarketplaceTourCard from "@/components/marketplace/MarketplaceTourCard";
import MarketplaceTourListCard from "@/components/marketplace/MarketplaceTourListCard";
import SearchBlock from "@/components/marketplace/SearchBlock";
import FilterBar from "@/components/marketplace/FilterBar";
import CatalogSidebar from "@/components/marketplace/CatalogSidebar";
import CatalogToolbar, { CatalogViewMode } from "@/components/marketplace/CatalogToolbar";
import { TourListing, TourFilters } from "@/types";
import { filterTours, countActiveFilters, getDefaultFilters } from "@/lib/filter-tours";
import { sortTours, TourSortOption } from "@/lib/sort-tours";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { cn } from "@/lib/cn";

interface ToursCatalogProps {
  tours: TourListing[];
}

const SIDEBAR_EXCLUDE = [
  "activities",
  "price",
  "duration",
  "difficulty",
  "comfort",
] as const;

export default function ToursCatalog({ tours }: ToursCatalogProps) {
  const { currency } = useLocaleCurrency();
  const [filters, setFilters] = useState<TourFilters>(() => getDefaultFilters(currency));
  const [sort, setSort] = useState<TourSortOption>("recommended");
  const [viewMode, setViewMode] = useState<CatalogViewMode>("grid");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setFilters(getDefaultFilters(currency));
  }, [currency]);

  const filtered = useMemo(
    () => filterTours(tours, filters, currency),
    [tours, filters, currency]
  );

  const sorted = useMemo(() => sortTours(filtered, sort), [filtered, sort]);
  const activeFilterCount = countActiveFilters(filters, currency);

  const resetFilters = () => setFilters(getDefaultFilters(currency));

  return (
    <div className="bg-pampas pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-charcoal">Каталог туров</h1>
        <p className="mt-2 text-slate">Все авторские путешествия по Аргентине</p>

        <div className="mt-6 space-y-4">
          <SearchBlock
            query={filters.query}
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            nearMe={filters.nearMe}
            onQueryChange={(q) => setFilters((f) => ({ ...f, query: q }))}
            onDatesChange={(from, to) => setFilters((f) => ({ ...f, dateFrom: from, dateTo: to }))}
            onNearMe={(coords) =>
              setFilters((f) => ({ ...f, nearMe: !!coords, userCoords: coords }))
            }
            onSearch={() => {}}
          />
          <FilterBar
            filters={filters}
            onChange={setFilters}
            exclude={[...SIDEBAR_EXCLUDE]}
          />
        </div>

        <div className="mt-8 lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 lg:items-start">
          <aside className="hidden lg:block lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
            <CatalogSidebar
              filters={filters}
              onChange={setFilters}
              onReset={resetFilters}
              activeCount={activeFilterCount}
            />
          </aside>

          <div className="min-w-0">
            <div className="mb-4 lg:hidden">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-charcoal"
              >
                Фильтры
                {activeFilterCount > 0 && (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-xs text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {mobileFiltersOpen && (
                <div className="mt-3">
                  <CatalogSidebar
                    filters={filters}
                    onChange={setFilters}
                    onReset={resetFilters}
                    activeCount={activeFilterCount}
                  />
                </div>
              )}
            </div>

            <CatalogToolbar
              count={sorted.length}
              sort={sort}
              onSortChange={setSort}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />

            {sorted.length === 0 ? (
              <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
                <p className="font-medium text-charcoal">Туры не найдены</p>
                <p className="mt-2 text-sm text-slate">
                  Попробуйте изменить фильтры или сбросить их
                </p>
              </div>
            ) : (
              <div
                className={cn(
                  "mt-6",
                  viewMode === "grid"
                    ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3"
                    : "flex flex-col gap-5"
                )}
              >
                {sorted.map((t) =>
                  viewMode === "list" ? (
                    <MarketplaceTourListCard key={t.id} tour={t} />
                  ) : (
                    <MarketplaceTourCard key={t.id} tour={t} />
                  )
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
