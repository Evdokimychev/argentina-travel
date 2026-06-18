import type { ReadonlyURLSearchParams } from "next/navigation";
import {
  TourFilters,
  type ActivityType,
  type AccommodationType,
  type ChildrenPolicy,
  type ComfortLevel,
  type DifficultyLevel,
  type DurationBucket,
  type GroupSizeBucket,
  type TourFormat,
  type TourLanguage,
} from "@/types";
import type { TourListing } from "@/types";
import type { CurrencyCode } from "@/types/locale";
import { getDefaultFilters } from "@/lib/filter-tours";
import { isPriceFilterActive } from "@/lib/tour-price-bounds";
import { type TourSortOption } from "@/lib/sort-tours";

export type CatalogViewMode = "grid" | "list" | "map";

const CATALOG_VIEW_MODES: CatalogViewMode[] = ["grid", "list", "map"];

const SORT_OPTIONS: TourSortOption[] = [
  "recommended",
  "price_asc",
  "price_desc",
  "rating_desc",
  "duration_asc",
  "duration_desc",
  "date_asc",
];

function splitList(value: string | null): string[] {
  if (!value?.trim()) return [];
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function joinList(values: readonly string[]): string | null {
  return values.length > 0 ? values.join(",") : null;
}

function parseIsoDate(value: string | null): Date | null {
  if (!value) return null;
  const parsed = new Date(`${value}T12:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatIsoDate(date: Date | null): string | null {
  if (!date) return null;
  return date.toISOString().slice(0, 10);
}

function parseNumber(value: string | null): number | null {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function parseCatalogViewFromSearchParams(
  params: ReadonlyURLSearchParams
): CatalogViewMode {
  const view = params.get("view");
  if (view && CATALOG_VIEW_MODES.includes(view as CatalogViewMode)) {
    return view as CatalogViewMode;
  }
  return "grid";
}

export function parseCatalogSortFromSearchParams(
  params: ReadonlyURLSearchParams
): TourSortOption {
  const sort = params.get("sort");
  if (sort && SORT_OPTIONS.includes(sort as TourSortOption)) {
    return sort as TourSortOption;
  }
  return "recommended";
}

export function parseCatalogFiltersFromSearchParams(
  params: ReadonlyURLSearchParams,
  currency: CurrencyCode,
  tours: TourListing[]
): TourFilters {
  const defaults = getDefaultFilters(currency, tours);

  return {
    ...defaults,
    query: params.get("query") ?? params.get("q") ?? "",
    dateFrom: parseIsoDate(params.get("dateFrom")),
    dateTo: parseIsoDate(params.get("dateTo")),
    activityTypes: splitList(params.get("activity")) as ActivityType[],
    priceMin: parseNumber(params.get("priceMin")) ?? defaults.priceMin,
    priceMax: parseNumber(params.get("priceMax")) ?? defaults.priceMax,
    durationMin: parseNumber(params.get("durationMin")),
    durationMax: parseNumber(params.get("durationMax")),
    dayTripsOnly: params.get("dayTrips") === "1",
    durations: splitList(params.get("durations")) as DurationBucket[],
    accommodations: splitList(params.get("accommodation")) as AccommodationType[],
    comfortLevels: splitList(params.get("comfort")) as ComfortLevel[],
    difficultyLevels: splitList(params.get("difficulty")) as DifficultyLevel[],
    languages: splitList(params.get("language")) as TourLanguage[],
    childrenPolicy: (params.get("children") as ChildrenPolicy | null) || null,
    groupSizes: splitList(params.get("groupSize")) as GroupSizeBucket[],
    tourFormats: splitList(params.get("format")) as TourFormat[],
    nearMe: params.get("nearMe") === "1",
    userCoords: null,
    organizerSlug: params.get("organizer")?.trim() ?? "",
  };
}

export function buildCatalogFilterSearchParams(
  filters: TourFilters,
  sort: TourSortOption,
  currency: CurrencyCode,
  tours: TourListing[],
  viewMode: CatalogViewMode = "grid"
): URLSearchParams {
  const params = new URLSearchParams();
  const defaults = getDefaultFilters(currency, tours);

  if (filters.query.trim()) params.set("query", filters.query.trim());

  const dateFrom = formatIsoDate(filters.dateFrom);
  if (dateFrom) params.set("dateFrom", dateFrom);
  const dateTo = formatIsoDate(filters.dateTo);
  if (dateTo) params.set("dateTo", dateTo);

  const activity = joinList(filters.activityTypes);
  if (activity) params.set("activity", activity);

  if (isPriceFilterActive(filters.priceMin, filters.priceMax, currency, tours)) {
    params.set("priceMin", String(filters.priceMin));
    params.set("priceMax", String(filters.priceMax));
  } else if (
    filters.priceMin !== defaults.priceMin ||
    filters.priceMax !== defaults.priceMax
  ) {
    params.set("priceMin", String(filters.priceMin));
    params.set("priceMax", String(filters.priceMax));
  }

  if (filters.durationMin != null) params.set("durationMin", String(filters.durationMin));
  if (filters.durationMax != null) params.set("durationMax", String(filters.durationMax));
  if (filters.dayTripsOnly) params.set("dayTrips", "1");

  const durations = joinList(filters.durations);
  if (durations) params.set("durations", durations);

  const accommodation = joinList(filters.accommodations);
  if (accommodation) params.set("accommodation", accommodation);

  const comfort = joinList(filters.comfortLevels);
  if (comfort) params.set("comfort", comfort);

  const difficulty = joinList(filters.difficultyLevels);
  if (difficulty) params.set("difficulty", difficulty);

  const language = joinList(filters.languages);
  if (language) params.set("language", language);

  if (filters.childrenPolicy) params.set("children", filters.childrenPolicy);

  const groupSize = joinList(filters.groupSizes);
  if (groupSize) params.set("groupSize", groupSize);

  const format = joinList(filters.tourFormats);
  if (format) params.set("format", format);

  if (filters.nearMe) params.set("nearMe", "1");

  if (filters.organizerSlug.trim()) {
    params.set("organizer", filters.organizerSlug.trim());
  }

  if (sort !== "recommended") params.set("sort", sort);

  if (viewMode !== "grid") params.set("view", viewMode);

  return params;
}

export function buildCatalogFilterHref(
  filters: TourFilters,
  sort: TourSortOption = "recommended",
  currency: CurrencyCode,
  tours: TourListing[],
  viewMode: CatalogViewMode = "grid"
): string {
  const params = buildCatalogFilterSearchParams(filters, sort, currency, tours, viewMode);
  const qs = params.toString();
  return qs ? `/tours?${qs}` : "/tours";
}

export function catalogFilterParamsMatch(
  a: URLSearchParams,
  b: URLSearchParams
): boolean {
  return a.toString() === b.toString();
}
