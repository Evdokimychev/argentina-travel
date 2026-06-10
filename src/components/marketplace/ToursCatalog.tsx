"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import MarketplaceTourCard from "@/components/marketplace/MarketplaceTourCard";
import MarketplaceTourListCard from "@/components/marketplace/MarketplaceTourListCard";
import SearchBlock from "@/components/marketplace/SearchBlock";
import FilterBar from "@/components/marketplace/FilterBar";
import CatalogToolbar, { CatalogViewMode } from "@/components/marketplace/CatalogToolbar";
import { TourListing, TourFilters } from "@/types";
import { filterTours, countActiveFilters, getDefaultFilters } from "@/lib/filter-tours";
import { sortTours, TourSortOption } from "@/lib/sort-tours";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { useSyncPriceFilters } from "@/hooks/useSyncPriceFilters";
import { useRepositoryTourListings } from "@/hooks/useRepositoryTourListings";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

const CatalogMapView = dynamic(
  () => import("@/components/marketplace/CatalogMapView"),
  {
    ssr: false,
    loading: () => (
      <div className="mt-6 flex min-h-[520px] items-center justify-center rounded-2xl border border-gray-100 bg-white text-sm text-slate">
        Загрузка карты…
      </div>
    ),
  }
);

interface ToursCatalogProps {
  tours: TourListing[];
}

export default function ToursCatalog({ tours: initialTours }: ToursCatalogProps) {
  const tours = useRepositoryTourListings(initialTours);
  const { currency } = useLocaleCurrency();
  const [filters, setFilters] = useState<TourFilters>(() =>
    getDefaultFilters(currency, tours)
  );
  const [sort, setSort] = useState<TourSortOption>("recommended");
  const [viewMode, setViewMode] = useState<CatalogViewMode>("grid");

  useSyncPriceFilters(tours, currency, setFilters);

  const filtered = useMemo(
    () => filterTours(tours, filters, currency),
    [tours, filters, currency]
  );

  const sorted = useMemo(() => sortTours(filtered, sort), [filtered, sort]);
  const activeFilterCount = countActiveFilters(filters, currency, tours);

  const resetFilters = () => setFilters(getDefaultFilters(currency, tours));

  return (
    <div className="pb-16">
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
          <FilterBar tours={tours} filters={filters} onChange={setFilters} />
        </div>

        <div className="mt-8">
          <CatalogToolbar
            count={sorted.length}
            sort={sort}
            onSortChange={setSort}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            activeFilterCount={activeFilterCount}
            onResetFilters={resetFilters}
          />

          {sorted.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center">
              <p className="font-medium text-charcoal">Туры не найдены</p>
              <p className="mt-2 text-sm text-slate">
                Попробуйте изменить фильтры или сбросить их
              </p>
              {activeFilterCount > 0 && (
                <Button className="mt-4" variant="outline" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              )}
            </div>
          ) : viewMode === "map" ? (
            <CatalogMapView tours={sorted} />
          ) : (
            <div
              className={cn(
                "mt-6",
                viewMode === "grid"
                  ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
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
  );
}
