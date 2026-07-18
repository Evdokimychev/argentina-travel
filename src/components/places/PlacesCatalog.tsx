"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { LayoutGrid, Map as MapIcon, MapPin } from "lucide-react";
import CatalogActiveFilterChips from "@/components/marketplace/CatalogActiveFilterChips";
import PlaceCard from "@/components/places/PlaceCard";
import PlaceSearchPanel from "@/components/places/PlaceSearchPanel";
import PlacesFeaturedCollections from "@/components/places/PlacesFeaturedCollections";
import PlacesRegionExplorer from "@/components/places/PlacesRegionExplorer";
import { EmptyState } from "@/components/ui/empty-state";
import { useLocaleCurrency } from "@/context/LocaleCurrencyContext";
import {
  filterPlaces,
  getDefaultPlaceCatalogFilters,
  getUniqueProvinces,
  getUniqueRegions,
  parsePlaceFiltersFromSearchParams,
  placeFiltersToSearchParams,
  sortPlaces,
  type PlaceCatalogFilters,
} from "@/lib/places-catalog-filters";
import { buildPlaceFilterChips, countPlaceFilterChips } from "@/lib/places-filter-chips";
import { getRegionSummaries } from "@/lib/places-region-stats";
import { siteContainerClass } from "@/lib/site-container";
import type { PlaceCollection, PlaceListing } from "@/types/place";
import { cn } from "@/lib/cn";

const PlacesCatalogMap = dynamic(() => import("@/components/places/PlacesCatalogMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[480px] items-center justify-center rounded-card border border-border-subtle bg-surface-muted text-slate">
      Загрузка карты…
    </div>
  ),
});

const INITIAL_VISIBLE_PLACES = 24;
const PLACES_PAGE_SIZE = 24;

type PlacesCatalogProps = {
  places: PlaceListing[];
  collections?: PlaceCollection[];
  initialFilters: PlaceCatalogFilters;
  initialViewMode: "grid" | "map";
};

export default function PlacesCatalog({
  places,
  collections = [],
  initialFilters,
  initialViewMode,
}: PlacesCatalogProps) {
  const { t } = useLocaleCurrency();
  const router = useRouter();

  const regions = useMemo(() => getUniqueRegions(places), [places]);
  const regionSummaries = useMemo(() => getRegionSummaries(places), [places]);
  const provinces = useMemo(() => getUniqueProvinces(places), [places]);

  const [filters, setFilters] = useState<PlaceCatalogFilters>(initialFilters);
  const [viewMode, setViewMode] = useState<"grid" | "map">(initialViewMode);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_PLACES);

  useEffect(() => {
    const syncFromUrl = () => {
      const params = new URLSearchParams(window.location.search);
      setFilters(parsePlaceFiltersFromSearchParams(params));
      setViewMode(params.get("view") === "map" ? "map" : "grid");
      setVisibleCount(INITIAL_VISIBLE_PLACES);
    };

    window.addEventListener("popstate", syncFromUrl);
    return () => window.removeEventListener("popstate", syncFromUrl);
  }, []);

  const filtered = useMemo(() => filterPlaces(places, filters), [places, filters]);
  const sorted = useMemo(() => sortPlaces(filtered, filters.sort), [filtered, filters.sort]);
  const visiblePlaces = useMemo(() => sorted.slice(0, visibleCount), [sorted, visibleCount]);

  const updateUrl = (nextFilters: PlaceCatalogFilters, view: "grid" | "map" = viewMode) => {
    const params = placeFiltersToSearchParams(nextFilters);
    if (view === "map") params.set("view", "map");
    const qs = params.toString();
    router.replace(qs ? `/places?${qs}` : "/places", { scroll: false });
  };

  const applyFilters = (next: PlaceCatalogFilters) => {
    setFilters(next);
    setVisibleCount(INITIAL_VISIBLE_PLACES);
    updateUrl(next);
  };

  const filterChips = buildPlaceFilterChips(filters, applyFilters, {
    searchPrefix: t("places.filters.search"),
    categoryPrefix: t("places.filters.category"),
    regionPrefix: t("places.filters.region"),
    provincePrefix: t("places.filters.province"),
    seasonPrefix: t("places.filters.season"),
    tagPrefix: t("places.filters.tag"),
  });

  const activeChipCount = useMemo(() => countPlaceFilterChips(filters), [filters]);

  const resetFilters = () => {
    const next = getDefaultPlaceCatalogFilters();
    setFilters(next);
    setVisibleCount(INITIAL_VISIBLE_PLACES);
    updateUrl(next);
  };

  const switchView = (mode: "grid" | "map") => {
    setViewMode(mode);
    updateUrl(filters, mode);
  };

  return (
    <div className="pb-16">
      <section className="border-b border-border-subtle bg-gradient-to-b from-sky/[0.06] via-surface-elevated to-surface-elevated">
        <div className={cn(siteContainerClass, "py-8 sm:py-10")}>
          <div className="max-w-3xl">
            <Link
              href="/destinations"
              className="mb-3 inline-flex items-center gap-1 text-xs font-medium text-sky-ink hover:underline"
            >
              ← Регионы и места
            </Link>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-sky-ink">
              {t("places.eyebrow")}
            </p>
            <h1 className="mt-2 font-display text-3xl font-bold text-charcoal sm:text-4xl">
              {t("places.title")}
            </h1>
            <p className="mt-2 text-base leading-relaxed text-slate">{t("places.subtitle")}</p>
            <p className="mt-3 text-sm text-slate">
              {t("places.hubHint")}{" "}
              <Link href="/destinations" className="font-medium text-sky-ink hover:underline">
                {t("places.hubHintLink")}
              </Link>
              .
            </p>
          </div>

          <PlaceSearchPanel
            filters={filters}
            regions={regions}
            provinces={provinces}
            onChange={applyFilters}
            onReset={resetFilters}
            labels={{
              searchPlaceholder: t("places.searchPlaceholder"),
              categoryLabel: t("places.filters.category"),
              categoryAll: t("places.filters.allCategories"),
              regionLabel: t("places.filters.region"),
              regionAll: t("places.filters.allRegions"),
              provinceLabel: t("places.filters.province"),
              provinceAll: t("places.filters.allProvinces"),
              sortLabel: t("places.sortLabel"),
              sortPopular: t("places.sort.popular"),
              sortRating: t("places.sort.rating"),
              sortNameAsc: t("places.sort.nameAsc"),
              sortNameDesc: t("places.sort.nameDesc"),
              reset: t("places.filters.reset"),
              filters: t("places.filters.title"),
            }}
          />

          <CatalogActiveFilterChips
            chips={filterChips}
            onClearAll={activeChipCount > 1 ? resetFilters : undefined}
            clearAllLabel={t("places.filters.reset")}
            className="mt-4"
          />

          <PlacesRegionExplorer
            regions={regionSummaries}
            activeRegion={filters.region}
            onSelect={(region) => applyFilters({ ...filters, region })}
          />

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate">
              {t("places.resultsCount").replace("{count}", String(sorted.length))}
            </p>
            <div className="flex items-center gap-1 rounded-button border border-border-default bg-surface-elevated p-1">
              <button
                type="button"
                onClick={() => switchView("grid")}
                aria-pressed={viewMode === "grid"}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "grid" ? "bg-sky-ink text-white" : "text-slate hover:text-charcoal",
                )}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden />
                {t("places.viewGrid")}
              </button>
              <button
                type="button"
                onClick={() => switchView("map")}
                aria-pressed={viewMode === "map"}
                className={cn(
                  "inline-flex min-h-11 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  viewMode === "map" ? "bg-sky-ink text-white" : "text-slate hover:text-charcoal",
                )}
              >
                <MapIcon className="h-4 w-4" aria-hidden />
                {t("places.viewMap")}
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className={cn(siteContainerClass, "mt-8")}>
        {collections.length > 0 && !filters.region && !filters.tag && !filters.query && !filters.category ? (
          <PlacesFeaturedCollections
            collections={collections}
            title={t("places.featuredCollections.title")}
            subtitle={t("places.featuredCollections.subtitle")}
            viewAllLabel={t("places.featuredCollections.viewAll")}
          />
        ) : null}

        <div className="mb-8 flex flex-wrap gap-3 text-sm">
          <Link
            href="/collections"
            className="rounded-pill border border-border-default px-4 py-1.5 text-charcoal hover:border-sky hover:text-sky-ink"
          >
            {t("places.linkCollections")}
          </Link>
          <Link
            href="/itineraries"
            className="rounded-pill border border-border-default px-4 py-1.5 text-charcoal hover:border-sky hover:text-sky-ink"
          >
            {t("places.linkItineraries")}
          </Link>
        </div>

        {sorted.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={t("places.emptyTitle")}
            description={t("places.emptyDescription")}
            action={{ label: t("places.filters.reset"), onClick: resetFilters }}
          />
        ) : viewMode === "map" ? (
          <PlacesCatalogMap
            places={sorted}
            selectedSlug={selectedSlug}
            onSelect={setSelectedSlug}
          />
        ) : (
          <>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visiblePlaces.map((place, index) => (
                <PlaceCard key={place.slug} place={place} imagePriority={index < 4} />
              ))}
            </div>
            {visibleCount < sorted.length ? (
              <div className="mt-10 flex flex-col items-center gap-2 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((count) => count + PLACES_PAGE_SIZE)}
                  className="inline-flex min-h-12 items-center justify-center rounded-full border border-sky/25 bg-sky/[0.07] px-7 text-sm font-semibold text-sky-ink transition-colors hover:border-sky/45 hover:bg-sky/[0.12]"
                >
                  Показать ещё места
                </button>
                <p className="text-xs text-slate">
                  Показано {visiblePlaces.length} из {sorted.length}
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
