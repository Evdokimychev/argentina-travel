"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ExcursionCard from "@/components/excursions/ExcursionCard";
import ExcursionSearchPanel from "@/components/excursions/ExcursionSearchPanel";
import ExcursionFilterBar from "@/components/excursions/ExcursionFilterBar";
import ExcursionCatalogFiltersSheet from "@/components/excursions/ExcursionCatalogFiltersSheet";
import ExcursionCatalogMapStub from "@/components/excursions/ExcursionCatalogMapStub";
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
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  const [page, setPage] = useState(Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
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
    setPage(Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
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
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedCityName = uniqueCities.find((city) => city.slug === filters.citySlug)?.name;

  const basePath =
    catalogBasePath ??
    (initialCitySlug ? `/excursions/city/${initialCitySlug}` : "/excursions");

  const updateUrl = (nextFilters: ExcursionCatalogFilters, nextPage = 1) => {
    const params = excursionFiltersToSearchParams(nextFilters, nextPage);
    const qs = params.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  const applyFilters = useCallback(
    (next: ExcursionCatalogFilters) => {
      setFilters(next);
      setPage(1);
      const params = excursionFiltersToSearchParams(next, 1);
      const qs = params.toString();
      router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
    },
    [basePath, router],
  );

  const resetFilters = useCallback(() => {
    const next = getDefaultExcursionCatalogFilters({ citySlug: initialCitySlug ?? "" });
    setFilters(next);
    setPage(1);
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
    <div className="pb-16">
      <section className="border-b border-gray-100 bg-gradient-to-b from-sky/[0.06] via-white to-white">
        <div className={cn(siteContainerClass, "py-8 sm:py-10")}>
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky">Tripster · Sputnik8</p>
            <h1 className="mt-2 font-display text-3xl font-bold text-charcoal sm:text-4xl">{resolvedTitle}</h1>
            <p className="mt-2 text-base leading-relaxed text-slate">{resolvedSubtitle}</p>
          </div>

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

          <CatalogStickyBar inset={false} className="-mx-4 mt-4 px-4 sm:-mx-6 sm:px-6">
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
      </section>

      <div className={cn(siteContainerClass, "mt-8")}>
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
                  <ExcursionCatalogMapStub cityName={selectedCityName} query={filters.query} />
                ) : (
                  <div
                    className={cn(
                      "mt-6",
                      viewMode === "grid"
                        ? "grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
                        : "flex flex-col gap-5",
                    )}
                  >
                    {pageItems.map((excursion) => (
                      <ExcursionCard key={`${excursion.partner}-${excursion.slug}`} excursion={excursion} />
                    ))}
                  </div>
                )}

                {viewMode !== "map" && totalPages > 1 ? (
                  <div className="mt-8 flex items-center justify-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage <= 1}
                      onClick={() => {
                        const next = currentPage - 1;
                        setPage(next);
                        updateUrl(filters, next);
                      }}
                    >
                      <ChevronLeft className="h-4 w-4" aria-hidden />
                      {t("excursions.prev")}
                    </Button>
                    <span className="text-sm text-slate">
                      {currentPage} / {totalPages}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={currentPage >= totalPages}
                      onClick={() => {
                        const next = currentPage + 1;
                        setPage(next);
                        updateUrl(filters, next);
                      }}
                    >
                      {t("excursions.next")}
                      <ChevronRight className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                ) : null}
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
  );
}
