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
import CatalogStickyBar from "@/components/marketplace/CatalogStickyBar";
import CatalogActiveFilterChips from "@/components/marketplace/CatalogActiveFilterChips";
import CatalogEmptyResults from "@/components/marketplace/CatalogEmptyResults";
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
import { siteContainerClass } from "@/lib/site-container";
import { buildTourFilterChips } from "@/lib/catalog-filter-chips";
import { formatToursFound } from "@/lib/pluralize";
import { buildPublicOrganizerProfile } from "@/lib/organizer-public";
import { resolveYouTravelExpertOrganizerLabel } from "@/lib/youtravel/partner-tour-guide";
import Link from "next/link";
import { MapPin } from "lucide-react";
import PartnerTourDateFilterNotice from "@/components/marketplace/PartnerTourDateFilterNotice";
import CatalogLazyLoadFooter from "@/components/marketplace/CatalogLazyLoadFooter";
import { useCatalogLazySlice } from "@/hooks/useCatalogLazySlice";
import { isTripsterPartnerListing } from "@/lib/tripster/partner-tour-utils";
import "./catalog-listing-page.css";

const PAGE_SIZE = 12;

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
  const { currency, locale } = useLocaleCurrency();
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
  const lazyResetKey = useMemo(
    () => buildCatalogFilterSearchParams(filters, sort, currency, tours, viewMode).toString(),
    [filters, sort, currency, tours, viewMode],
  );
  const {
    visibleItems,
    visibleCount,
    totalCount,
    hasMore,
    remaining,
    loadMore,
    sentinelRef,
  } = useCatalogLazySlice(sorted, PAGE_SIZE, { resetKey: lazyResetKey });
  const activeFilterCount = countActiveFilters(filters, currency, tours);
  const organizerProfile = filters.organizerSlug.trim()
    ? buildPublicOrganizerProfile(filters.organizerSlug.trim())
    : null;
  const youtravelExpertLabel = filters.organizerSlug.trim()
    ? resolveYouTravelExpertOrganizerLabel(filters.organizerSlug.trim(), tours)
    : null;

  const resetFilters = useCallback(
    () => setFilters(getDefaultFilters(currency, tours)),
    [currency, tours],
  );
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleSearch = () => {
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const hasDateFilter = Boolean(filters.dateFrom || filters.dateTo);
  const showPartnerDateNotice =
    hasDateFilter && sorted.some((tour) => isTripsterPartnerListing(tour));

  const filterChips = useMemo(
    () => buildTourFilterChips(filters, handleFiltersChange, { currency, locale, tours }),
    [filters, handleFiltersChange, currency, locale, tours],
  );

  const emptySuggestions = useMemo(() => {
    const items: { id: string; label: string; href?: string; onClick?: () => void }[] = [];
    if (activeFilterCount > 0) {
      items.push({ id: "reset", label: "Сбросить фильтры", onClick: resetFilters });
    }
    items.push(
      { id: "excursions", label: "Экскурсии", href: "/excursions" },
      { id: "all-tours", label: "Весь каталог туров", href: "/tours" },
    );
    return items;
  }, [activeFilterCount, resetFilters]);

  return (
    <div className="catalog-listing-page-root w-full max-w-full overflow-x-clip pb-16">
      <header className="catalog-listing-page-hero" data-scroll-rail-tone="light">
        <div
          className="catalog-listing-page-hero__glow catalog-listing-page-hero__glow--primary"
          aria-hidden
        />
        <div
          className="catalog-listing-page-hero__glow catalog-listing-page-hero__glow--secondary"
          aria-hidden
        />
        <div className={cn(siteContainerClass, "relative pt-10 pb-9 md:pt-12 sm:pb-10 lg:pt-14 lg:pb-12")}>
          <h1 className="max-w-2xl font-display text-[1.75rem] font-bold leading-tight tracking-tight text-charcoal sm:text-4xl lg:text-[2.35rem]">
            Каталог туров
          </h1>
          <p className="mt-2.5 max-w-xl text-base leading-relaxed text-slate/90 sm:text-[1.05rem]">
            Все авторские путешествия по Аргентине
          </p>
        </div>
      </header>

      <div className={siteContainerClass}>
        <div
          id="tours-search"
          className="catalog-listing-page-search-shell scroll-mt-[calc(var(--site-header-height,72px)+1rem)] space-y-4"
        >
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
          <CatalogStickyBar>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <CatalogFiltersSheet
                  tours={tours}
                  filters={filters}
                  onChange={handleFiltersChange}
                  activeFilterCount={activeFilterCount}
                />
                <div className="hidden min-w-0 flex-1 lg:block">
                  <FilterBar tours={tours} filters={filters} onChange={handleFiltersChange} />
                </div>
              </div>
              <CatalogActiveFilterChips
                chips={filterChips}
                onClearAll={activeFilterCount > 1 ? resetFilters : undefined}
              />
            </div>
          </CatalogStickyBar>
        </div>

        {organizerProfile ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky/20 bg-sky/5 px-4 py-3">
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
        ) : youtravelExpertLabel ? (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky/20 bg-sky/5 px-4 py-3">
            <p className="text-sm text-charcoal">
              Туры эксперта{" "}
              <span className="font-semibold text-brand">{youtravelExpertLabel}</span>
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

        <div className="mt-8" ref={resultsRef}>
          <CatalogToolbar
            countLabel={formatToursFound(sorted.length)}
            sort={sort}
            onSortChange={setSort}
            viewMode={viewMode}
            onViewModeChange={handleViewModeChange}
            activeFilterCount={activeFilterCount}
            onResetFilters={resetFilters}
          />

          {showPartnerDateNotice ? <PartnerTourDateFilterNotice /> : null}

          {sorted.length === 0 ? (
            <CatalogEmptyResults
              icon={MapPin}
              title="Туры не найдены"
              description="Попробуйте изменить фильтры или сбросить поиск."
              action={
                activeFilterCount > 0
                  ? { label: "Сбросить фильтры", onClick: resetFilters }
                  : undefined
              }
              secondaryAction={{ label: "Смотреть экскурсии", href: "/excursions" }}
              suggestions={emptySuggestions}
            />
          ) : viewMode === "map" ? (
            <CatalogMapView tours={sorted} />
          ) : (
            <>
              <div
                className={cn(
                  "mt-6",
                  viewMode === "grid"
                    ? "grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
                    : "flex flex-col gap-5"
                )}
              >
                {visibleItems.map((t) =>
                  viewMode === "list" ? (
                    <MarketplaceTourListCard key={t.id} tour={t} />
                  ) : (
                    <MarketplaceTourCard key={t.id} tour={t} />
                  )
                )}
              </div>
              <CatalogLazyLoadFooter
                hasMore={hasMore}
                pageSize={PAGE_SIZE}
                remaining={remaining}
                visibleCount={visibleCount}
                totalCount={totalCount}
                onLoadMore={loadMore}
                sentinelRef={sentinelRef}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
