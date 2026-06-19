"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import MarketplaceTourCard from "@/components/marketplace/MarketplaceTourCard";
import MarketplaceTourListCard from "@/components/marketplace/MarketplaceTourListCard";
import SearchBlock from "@/components/marketplace/SearchBlock";
import FilterBar from "@/components/marketplace/FilterBar";
import CatalogFiltersSheet from "@/components/marketplace/CatalogFiltersSheet";
import CatalogToolbar, { CatalogViewMode } from "@/components/marketplace/CatalogToolbar";
import { TourListing, TourFilters } from "@/types";
import { filterTours, countActiveFilters, getDefaultFilters } from "@/lib/filter-tours";
import { sortTours, TourSortOption } from "@/lib/sort-tours";
import {
  buildCatalogFilterSearchParams,
  catalogFilterParamsMatch,
  parseCatalogFiltersFromSearchParams,
  parseCatalogSortFromSearchParams,
  parseCatalogViewFromSearchParams,
} from "@/lib/catalog-filter-url";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import { useSyncPriceFilters } from "@/hooks/useSyncPriceFilters";
import { useRepositoryTourListings } from "@/hooks/useRepositoryTourListings";
import { cn } from "@/lib/cn";
import { EmptyState } from "@/components/ui/empty-state";
import { buildPublicOrganizerProfile } from "@/lib/organizer-public";
import Link from "next/link";
import { MapPin } from "lucide-react";
import PartnerTourDateFilterNotice from "@/components/marketplace/PartnerTourDateFilterNotice";
import { isPartnerTourListing } from "@/lib/tripster/partner-tour-utils";

const CATALOG_VIEW_MODE_KEY = "argentina-travel-catalog-view";

function readStoredViewMode(): CatalogViewMode {
  if (typeof window === "undefined") return "grid";
  try {
    const stored = window.localStorage.getItem(CATALOG_VIEW_MODE_KEY);
    if (stored === "grid" || stored === "list" || stored === "map") return stored;
  } catch {
    // ignore
  }
  return "grid";
}

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const tours = useRepositoryTourListings(initialTours);
  const { currency } = useLocaleCurrency();
  const [filters, setFilters] = useState<TourFilters>(() =>
    parseCatalogFiltersFromSearchParams(searchParams, currency, tours)
  );
  const [sort, setSort] = useState<TourSortOption>(() =>
    parseCatalogSortFromSearchParams(searchParams)
  );
  const [viewMode, setViewMode] = useState<CatalogViewMode>(() =>
    parseCatalogViewFromSearchParams(searchParams)
  );
  const skipUrlSyncRef = useRef(false);
  const viewModeHydratedRef = useRef(false);

  useSyncPriceFilters(tours, currency, setFilters);

  useEffect(() => {
    if (viewModeHydratedRef.current) return;
    viewModeHydratedRef.current = true;
    if (searchParams.get("view")) return;
    const stored = readStoredViewMode();
    if (stored !== "grid") setViewMode(stored);
  }, [searchParams]);

  const handleViewModeChange = useCallback((mode: CatalogViewMode) => {
    setViewMode(mode);
    try {
      window.localStorage.setItem(CATALOG_VIEW_MODE_KEY, mode);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    skipUrlSyncRef.current = true;
    setFilters(parseCatalogFiltersFromSearchParams(searchParams, currency, tours));
    setSort(parseCatalogSortFromSearchParams(searchParams));
    setViewMode(parseCatalogViewFromSearchParams(searchParams));
  }, [searchParams, currency, tours]);

  useEffect(() => {
    if (skipUrlSyncRef.current) {
      skipUrlSyncRef.current = false;
      return;
    }

    const nextParams = buildCatalogFilterSearchParams(filters, sort, currency, tours, viewMode);
    const currentParams = new URLSearchParams(searchParams.toString());
    if (catalogFilterParamsMatch(nextParams, currentParams)) return;

    const qs = nextParams.toString();
    router.replace(qs ? `/tours?${qs}` : "/tours", { scroll: false });
  }, [filters, sort, viewMode, currency, tours, router, searchParams]);

  const handleFiltersChange = useCallback((next: TourFilters) => {
    setFilters(next);
  }, []);

  const filtered = useMemo(
    () => filterTours(tours, filters, currency),
    [tours, filters, currency]
  );

  const sorted = useMemo(() => sortTours(filtered, sort), [filtered, sort]);
  const activeFilterCount = countActiveFilters(filters, currency, tours);
  const organizerProfile = filters.organizerSlug.trim()
    ? buildPublicOrganizerProfile(filters.organizerSlug.trim())
    : null;

  const resetFilters = () => setFilters(getDefaultFilters(currency, tours));
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const hasDateFilter = Boolean(filters.dateFrom || filters.dateTo);
  const showPartnerDateNotice =
    hasDateFilter && sorted.some((tour) => isPartnerTourListing(tour));

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold text-charcoal">Каталог туров</h1>
        <p className="mt-2 text-slate">Все авторские путешествия по Аргентине</p>

        {organizerProfile ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky/20 bg-sky/5 px-4 py-3">
            <p className="text-sm text-charcoal">
              Туры организатора{" "}
              <Link
                href={`/organizers/${organizerProfile.slug}`}
                className="font-semibold text-brand hover:underline"
              >
                {organizerProfile.name}
              </Link>
            </p>
            <button
              type="button"
              onClick={() =>
                setFilters((current) => ({ ...current, organizerSlug: "" }))
              }
              className="text-sm font-medium text-slate hover:text-charcoal"
            >
              Сбросить фильтр
            </button>
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          <SearchBlock
            tours={tours}
            query={filters.query}
            dateFrom={filters.dateFrom}
            dateTo={filters.dateTo}
            nearMe={filters.nearMe}
            onQueryChange={(q) => setFilters((f) => ({ ...f, query: q }))}
            onDatesChange={(from, to) => setFilters((f) => ({ ...f, dateFrom: from, dateTo: to }))}
            onNearMe={(coords) =>
              setFilters((f) => ({ ...f, nearMe: !!coords, userCoords: coords }))
            }
            onSearch={handleSearch}
          />
          <div className="flex flex-col gap-3 lg:block">
            <div className="flex items-center justify-between gap-3 lg:hidden">
              <CatalogFiltersSheet
                tours={tours}
                filters={filters}
                onChange={handleFiltersChange}
                activeFilterCount={activeFilterCount}
              />
            </div>
            <div className="hidden lg:block">
              <FilterBar tours={tours} filters={filters} onChange={handleFiltersChange} />
            </div>
          </div>
        </div>

        <div className="mt-8" ref={resultsRef}>
          <CatalogToolbar
            count={sorted.length}
            sort={sort}
            onSortChange={setSort}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            activeFilterCount={activeFilterCount}
            onResetFilters={resetFilters}
          />

          {showPartnerDateNotice ? <PartnerTourDateFilterNotice /> : null}

          {sorted.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Туры не найдены"
              description="Попробуйте изменить фильтры или сбросить их."
              action={
                activeFilterCount > 0
                  ? { label: "Сбросить фильтры", onClick: resetFilters, variant: "outline" }
                  : undefined
              }
              secondaryAction={
                activeFilterCount > 0
                  ? { label: "Весь каталог", href: "/tours" }
                  : { label: "Экскурсии", href: "/excursions" }
              }
              className="mt-8"
            />
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
