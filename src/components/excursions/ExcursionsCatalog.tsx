"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ExcursionCard from "@/components/excursions/ExcursionCard";
import ExcursionSearchPanel from "@/components/excursions/ExcursionSearchPanel";
import ExcursionFilterBar from "@/components/excursions/ExcursionFilterBar";
import ExcursionCatalogFiltersSheet from "@/components/excursions/ExcursionCatalogFiltersSheet";
import ExcursionCatalogMapNotice from "@/components/excursions/ExcursionCatalogMapNotice";
import CatalogToolbar, { type CatalogViewMode } from "@/components/marketplace/CatalogToolbar";
import CatalogStickyBar from "@/components/marketplace/CatalogStickyBar";
import CatalogActiveFilterChips from "@/components/marketplace/CatalogActiveFilterChips";
import CatalogEmptyResults from "@/components/marketplace/CatalogEmptyResults";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  countActiveExcursionFilters,
  dedupeCitiesForCatalog,
  excursionFiltersToSearchParams,
  filterExcursions,
  getDefaultExcursionCatalogFilters,
  getExcursionPriceBounds,
  parseExcursionFiltersFromSearchParams,
  sanitizeExcursionMaxPrice,
  sortExcursions,
  type ExcursionCatalogFilters,
  type ExcursionSortOption,
} from "@/lib/excursion-catalog-filters";
import { buildExcursionFilterChips } from "@/lib/catalog-filter-chips";
import { formatExcursionsFound } from "@/lib/pluralize";
import { siteContainerClass } from "@/lib/site-container";
import type { ExcursionCity, ExcursionListing } from "@/types/excursion";
import { cn } from "@/lib/cn";
import { MapPin } from "lucide-react";
import CatalogLazyLoadFooter from "@/components/marketplace/CatalogLazyLoadFooter";
import { useCatalogLazySlice } from "@/hooks/useCatalogLazySlice";
import "@/components/marketplace/catalog-listing-page.css";

const PAGE_SIZE = 12;
const EXCURSION_VIEW_MODE_KEY = "argentina-travel-excursion-catalog-view";

const EXCURSION_SORT_OPTIONS: { value: ExcursionSortOption; label: string }[] = [
  { value: "popular", label: "По популярности" },
  { value: "rating", label: "По рейтингу" },
  { value: "price_asc", label: "Дешевле" },
  { value: "price_desc", label: "Дороже" },
];

function readStoredExcursionViewMode(): CatalogViewMode {
  if (typeof window === "undefined") return "grid";
  try {
    const stored = window.localStorage.getItem(EXCURSION_VIEW_MODE_KEY);
    if (stored === "grid" || stored === "list" || stored === "map") return stored;
  } catch {
    // ignore
  }
  return "grid";
}

type ExcursionsCatalogProps = {
  excursions: ExcursionListing[];
  cities: ExcursionCity[];
  initialCitySlug?: string;
  catalogBasePath?: string;
  title?: string;
  subtitle?: string;
  flightSidebar?: ReactNode;
};

export default function ExcursionsCatalog({
  excursions,
  cities,
  initialCitySlug,
  catalogBasePath,
  title,
  subtitle,
  flightSidebar,
}: ExcursionsCatalogProps) {
  const { t } = useLocaleCurrency();
  const resolvedTitle = title ?? t("excursions.title");
  const resolvedSubtitle = subtitle ?? t("excursions.subtitle");
  const router = useRouter();
  const searchParams = useSearchParams();

  const uniqueCities = useMemo(() => dedupeCitiesForCatalog(cities), [cities]);
  const priceBounds = useMemo(() => getExcursionPriceBounds(excursions), [excursions]);

  const [filters, setFilters] = useState<ExcursionCatalogFilters>(() => {
    const parsed = parseExcursionFiltersFromSearchParams(searchParams, initialCitySlug);
    return {
      ...parsed,
      maxPrice: sanitizeExcursionMaxPrice(parsed.maxPrice, priceBounds.max),
    };
  });
  const [viewMode, setViewMode] = useState<CatalogViewMode>("grid");
  const viewModeHydratedRef = useRef(false);

  useEffect(() => {
    if (viewModeHydratedRef.current) return;
    viewModeHydratedRef.current = true;
    const stored = readStoredExcursionViewMode();
    if (stored !== "grid") setViewMode(stored);
  }, []);

  useEffect(() => {
    const parsed = parseExcursionFiltersFromSearchParams(searchParams, initialCitySlug);
    setFilters({
      ...parsed,
      maxPrice: sanitizeExcursionMaxPrice(parsed.maxPrice, priceBounds.max),
    });
  }, [searchParams, initialCitySlug, priceBounds.max]);

  const filtered = useMemo(() => filterExcursions(excursions, filters), [excursions, filters]);
  const sorted = useMemo(() => sortExcursions(filtered, filters.sort), [filtered, filters.sort]);
  const activeFilterCount = countActiveExcursionFilters(filters);
  const hiddenByDurationFilter = useMemo(() => {
    if (filters.durationBuckets.length === 0) return 0;
    const withoutDuration = filterExcursions(excursions, {
      ...filters,
      durationBuckets: [],
    });
    return withoutDuration.length - filtered.length;
  }, [excursions, filters, filtered.length]);
  const lazyResetKey = useMemo(
    () => excursionFiltersToSearchParams(filters, 1).toString(),
    [filters],
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
  const selectedCityName = uniqueCities.find((city) => city.slug === filters.citySlug)?.name;

  const basePath =
    catalogBasePath ??
    (initialCitySlug ? `/excursions/city/${initialCitySlug}` : "/excursions");

  const applyFilters = useCallback(
    (next: ExcursionCatalogFilters) => {
      setFilters(next);
      const params = excursionFiltersToSearchParams(next, 1);
      const qs = params.toString();
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [basePath, router],
  );

  const resetFilters = useCallback(() => {
    const next = getDefaultExcursionCatalogFilters({ citySlug: initialCitySlug ?? "" });
    setFilters(next);
    const params = excursionFiltersToSearchParams(next, 1);
    const qs = params.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  }, [basePath, initialCitySlug, router]);

  const handleViewModeChange = (mode: CatalogViewMode) => {
    setViewMode(mode);
    try {
      window.localStorage.setItem(EXCURSION_VIEW_MODE_KEY, mode);
    } catch {
      // ignore
    }
  };

  const filterChips = useMemo(
    () => buildExcursionFilterChips(filters, applyFilters, uniqueCities),
    [filters, applyFilters, uniqueCities],
  );

  const emptySuggestions = useMemo(() => {
    const items: { id: string; label: string; href?: string; onClick?: () => void }[] = [];
    if (activeFilterCount > 0) {
      items.push({ id: "reset", label: t("excursions.filters.reset"), onClick: resetFilters });
    }
    for (const city of uniqueCities.slice(0, 4)) {
      items.push({
        id: `city-${city.slug}`,
        label: city.name,
        href: `/excursions/city/${city.slug}`,
      });
    }
    items.push({ id: "tours", label: "Авторские туры", href: "/tours" });
    return items;
  }, [activeFilterCount, resetFilters, t, uniqueCities]);

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
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky/90">
            Tripster · Sputnik8
          </p>
          <h1 className="mt-2 max-w-2xl font-display text-[1.75rem] font-bold leading-tight tracking-tight text-charcoal sm:text-4xl lg:text-[2.35rem]">
            {resolvedTitle}
          </h1>
          <p className="mt-2.5 max-w-xl text-base leading-relaxed text-slate/90 sm:text-[1.05rem]">
            {resolvedSubtitle}
          </p>
        </div>
      </header>

      <div className={siteContainerClass}>
        <div
          id="excursions-search"
          className="catalog-listing-page-search-shell scroll-mt-[calc(var(--site-header-height,72px)+1rem)] space-y-4"
        >
          <ExcursionSearchPanel
            filters={filters}
            cities={uniqueCities}
            onChange={applyFilters}
            labels={{
              searchLabel: t("excursions.filters.searchLabel"),
              searchPlaceholder: t("excursions.searchPlaceholder"),
              cityLabel: t("excursions.filters.cityLabel"),
              cityAll: t("excursions.allCities"),
            }}
          />

          <CatalogStickyBar inset={false}>
            <div className="flex flex-col gap-3">
              <div className="flex items-start gap-3">
                <ExcursionCatalogFiltersSheet
                  filters={filters}
                  priceMax={priceBounds.max}
                  hasUsdPrices={priceBounds.hasUsdPrices}
                  onChange={applyFilters}
                  activeFilterCount={activeFilterCount}
                />
                <div className="hidden min-w-0 flex-1 lg:block">
                  <ExcursionFilterBar
                    filters={filters}
                    priceMax={priceBounds.max}
                    hasUsdPrices={priceBounds.hasUsdPrices}
                    onChange={applyFilters}
                  />
                </div>
              </div>
              <CatalogActiveFilterChips
                chips={filterChips}
                onClearAll={activeFilterCount > 1 ? resetFilters : undefined}
                clearAllLabel={t("excursions.filters.reset")}
              />
            </div>
          </CatalogStickyBar>
        </div>

        <div className="mt-8">
        <div className={cn(flightSidebar ? "lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 lg:items-start" : undefined)}>
          <div className="min-w-0">
            {sorted.length === 0 ? (
              <CatalogEmptyResults
                icon={MapPin}
                title={
                  excursions.length === 0
                    ? t("excursions.emptySoonTitle")
                    : t("excursions.emptyFilterTitle")
                }
                description={
                  excursions.length === 0
                    ? t("excursions.emptySoonDescription")
                    : t("excursions.emptyFilterDescription")
                }
                action={
                  excursions.length > 0 && activeFilterCount > 0
                    ? { label: t("excursions.filters.reset"), onClick: resetFilters }
                    : undefined
                }
                secondaryAction={
                  excursions.length > 0
                    ? { label: t("excursions.allCities"), href: "/excursions" }
                    : undefined
                }
                suggestions={excursions.length > 0 ? emptySuggestions : undefined}
              />
            ) : (
              <>
                {hiddenByDurationFilter > 0 ? (
                  <p className="mb-4 rounded-xl border border-amber-200/80 bg-amber-50 px-4 py-3 text-sm text-charcoal">
                    По фильтру длительности скрыто {hiddenByDurationFilter}{" "}
                    {hiddenByDurationFilter === 1
                      ? "экскурсия"
                      : hiddenByDurationFilter < 5
                        ? "экскурсии"
                        : "экскурсий"}{" "}
                    без указанной длительности в каталоге.
                  </p>
                ) : null}

                <CatalogToolbar
                  countLabel={formatExcursionsFound(sorted.length)}
                  sort={filters.sort}
                  onSortChange={(sort) => applyFilters({ ...filters, sort })}
                  primarySortOptions={EXCURSION_SORT_OPTIONS}
                  secondarySortOptions={[]}
                  viewMode={viewMode}
                  onViewModeChange={handleViewModeChange}
                  activeFilterCount={activeFilterCount}
                  onResetFilters={resetFilters}
                />

                {viewMode === "map" ? (
                  <>
                    <ExcursionCatalogMapNotice cityName={selectedCityName} />
                    <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                      {visibleItems.map((excursion) => (
                        <ExcursionCard key={`${excursion.partner}-${excursion.slug}`} excursion={excursion} />
                      ))}
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
                ) : (
                  <>
                    <div
                      className={cn(
                        "mt-6",
                        viewMode === "grid"
                          ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                          : "flex flex-col gap-5",
                      )}
                    >
                      {visibleItems.map((excursion) => (
                        <ExcursionCard key={`${excursion.partner}-${excursion.slug}`} excursion={excursion} />
                      ))}
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
              </>
            )}

            {uniqueCities.length > 0 ? (
              <div className="mt-10 flex flex-wrap gap-2 border-t border-gray-100 pt-6">
                {uniqueCities.map((city) => (
                  <Link
                    key={city.slug}
                    href={`/excursions/city/${city.slug}`}
                    className="inline-flex items-center gap-1 rounded-full bg-charcoal/5 px-3 py-1 text-xs font-medium text-charcoal transition hover:bg-sky/10 hover:text-sky"
                  >
                    <MapPin className="h-3 w-3" aria-hidden />
                    {city.name}
                    <span className="text-slate">({city.experienceCount})</span>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>

          {flightSidebar ? (
            <aside className="mt-8 lg:mt-0 lg:sticky lg:top-24">{flightSidebar}</aside>
          ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}
