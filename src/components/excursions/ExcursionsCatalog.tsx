"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import ExcursionCard from "@/components/excursions/ExcursionCard";
import ExcursionSearchPanel from "@/components/excursions/ExcursionSearchPanel";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  dedupeCitiesForCatalog,
  excursionFiltersToSearchParams,
  filterExcursions,
  getDefaultExcursionCatalogFilters,
  getExcursionPriceBounds,
  parseExcursionFiltersFromSearchParams,
  sanitizeExcursionMaxPrice,
  sortExcursions,
  type ExcursionCatalogFilters,
} from "@/lib/excursion-catalog-filters";
import { siteContainerClass } from "@/lib/site-container";
import type { ExcursionCity, ExcursionListing } from "@/types/excursion";
import { cn } from "@/lib/cn";
import { ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";

const PAGE_SIZE = 12;

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

  const basePath =
    catalogBasePath ??
    (initialCitySlug ? `/excursions/city/${initialCitySlug}` : "/excursions");

  const updateUrl = (nextFilters: ExcursionCatalogFilters, nextPage = 1) => {
    const params = excursionFiltersToSearchParams(nextFilters, nextPage);
    const qs = params.toString();
    router.replace(qs ? `${basePath}?${qs}` : basePath, { scroll: false });
  };

  const applyFilters = (next: ExcursionCatalogFilters) => {
    setFilters(next);
    setPage(1);
    updateUrl(next, 1);
  };

  const resetFilters = () => {
    const next = getDefaultExcursionCatalogFilters({ citySlug: initialCitySlug ?? "" });
    setFilters(next);
    setPage(1);
    updateUrl(next, 1);
  };

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
            priceMax={priceBounds.max}
            hasUsdPrices={priceBounds.hasUsdPrices}
            onChange={applyFilters}
            onReset={resetFilters}
            labels={{
              searchLabel: t("excursions.filters.searchLabel"),
              searchPlaceholder: t("excursions.searchPlaceholder"),
              cityLabel: t("excursions.filters.cityLabel"),
              cityAll: t("excursions.allCities"),
              sortLabel: t("excursions.sortLabel"),
              sortPopular: t("excursions.sort.popular"),
              sortRating: t("excursions.sort.rating"),
              sortPriceAsc: t("excursions.sort.priceAsc"),
              sortPriceDesc: t("excursions.sort.priceDesc"),
              filtersActive: t("excursions.filters.active"),
              resetFilters: t("excursions.filters.reset"),
            }}
          />
        </div>
      </section>

      <div className={cn(siteContainerClass, "mt-8")}>
        <div className={cn(flightSidebar ? "lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-8 lg:items-start" : undefined)}>
          <div className="min-w-0">
            {sorted.length === 0 ? (
              <EmptyState
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
                  excursions.length > 0
                    ? { label: t("excursions.filters.reset"), onClick: resetFilters }
                    : undefined
                }
                secondaryAction={
                  excursions.length > 0
                    ? { label: t("excursions.allCities"), href: "/excursions" }
                    : undefined
                }
                className="mt-4"
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

                <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
                  <p className="text-sm text-slate">
                    {sorted.length}{" "}
                    {sorted.length === 1
                      ? t("excursions.countOne")
                      : sorted.length < 5
                        ? t("excursions.countFew")
                        : t("excursions.countMany")}
                    {filters.citySlug ? (
                      <span className="text-charcoal">
                        {" "}
                        · {uniqueCities.find((city) => city.slug === filters.citySlug)?.name}
                      </span>
                    ) : null}
                  </p>
                  {uniqueCities.length > 0 ? (
                    <p className="text-xs text-slate">
                      {uniqueCities.length} {uniqueCities.length < 5 ? "города" : "городов"} в каталоге
                    </p>
                  ) : null}
                </div>

                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {pageItems.map((excursion) => (
                    <ExcursionCard key={`${excursion.partner}-${excursion.slug}`} excursion={excursion} />
                  ))}
                </div>

                {totalPages > 1 ? (
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
