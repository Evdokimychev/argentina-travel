import type { ExcursionFormatKind, ExcursionListing, ExcursionPartner, ExcursionCity } from "@/types/excursion";
import { resolveExcursionPriceUsd } from "@/lib/excursion-price-display";

export type ExcursionSortOption = "popular" | "rating" | "price_asc" | "price_desc";

/** Catalog filter compares USD amounts only (ignores ARS/RUB listing values). */
export const EXCURSION_FILTER_PRICE_MAX_USD = 400;

/** Values above this are treated as non-USD outliers when computing slider bounds. */
const EXCURSION_PRICE_OUTLIER_USD = 800;

export type ExcursionDurationBucket = "short" | "medium" | "long";

export type ExcursionCatalogFilters = {
  query: string;
  citySlug: string;
  sort: ExcursionSortOption;
  formats: ExcursionFormatKind[];
  durationBuckets: ExcursionDurationBucket[];
  minRating: number | null;
  maxPrice: number | null;
  partners: ExcursionPartner[];
};

export const EXCURSION_DURATION_OPTIONS: {
  id: ExcursionDurationBucket;
  label: string;
  hint: string;
}[] = [
  { id: "short", label: "До 2 ч", hint: "≤ 120 мин" },
  { id: "medium", label: "2–4 ч", hint: "121–240 мин" },
  { id: "long", label: "4+ ч", hint: "> 240 мин" },
];

export function getDefaultExcursionCatalogFilters(
  overrides: Partial<ExcursionCatalogFilters> = {},
): ExcursionCatalogFilters {
  return {
    query: "",
    citySlug: "",
    sort: "popular",
    formats: [],
    durationBuckets: [],
    minRating: null,
    maxPrice: null,
    partners: [],
    ...overrides,
  };
}

export function dedupeCitiesForCatalog(cities: ExcursionCity[]): ExcursionCity[] {
  const merged = new Map<string, ExcursionCity>();

  for (const city of cities) {
    const key = city.slug.trim().toLowerCase();
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, city);
      continue;
    }
    merged.set(key, {
      ...existing,
      experienceCount: existing.experienceCount + city.experienceCount,
      coverImage: existing.coverImage ?? city.coverImage,
    });
  }

  return [...merged.values()].sort((a, b) => b.experienceCount - a.experienceCount);
}

function matchesDurationBucket(minutes: number | undefined, bucket: ExcursionDurationBucket): boolean {
  if (minutes == null) return false;
  if (bucket === "short") return minutes <= 120;
  if (bucket === "medium") return minutes > 120 && minutes <= 240;
  return minutes > 240;
}

export function getExcursionFilterPriceUsd(
  item: Pick<ExcursionListing, "priceValue" | "priceCurrency">,
): number | null {
  return resolveExcursionPriceUsd(item);
}

export function sanitizeExcursionMaxPrice(
  value: number | null | undefined,
  catalogMax?: number,
): number | null {
  if (value == null || !Number.isFinite(value) || value <= 0) return null;

  const cap =
    catalogMax != null
      ? Math.min(Math.max(50, catalogMax), EXCURSION_FILTER_PRICE_MAX_USD)
      : EXCURSION_FILTER_PRICE_MAX_USD;

  const rounded = Math.round(value);
  if (rounded >= cap) return null;
  return Math.min(rounded, cap);
}

export type ExcursionPriceBounds = {
  min: number;
  max: number;
  /** At least one listing has a USD price suitable for the slider */
  hasUsdPrices: boolean;
};

export function getExcursionPriceBounds(items: ExcursionListing[]): ExcursionPriceBounds {
  const prices = items
    .map(getExcursionFilterPriceUsd)
    .filter(
      (value): value is number =>
        value != null && value > 0 && value <= EXCURSION_PRICE_OUTLIER_USD,
    );

  if (prices.length === 0) {
    return { min: 0, max: 200, hasUsdPrices: false };
  }

  const catalogMax = Math.max(...prices);
  const max = Math.min(
    EXCURSION_FILTER_PRICE_MAX_USD,
    Math.max(50, Math.ceil(catalogMax / 10) * 10),
  );

  return { min: 0, max, hasUsdPrices: true };
}

export function filterExcursions(
  items: ExcursionListing[],
  filters: ExcursionCatalogFilters,
): ExcursionListing[] {
  const normalizedQuery = filters.query.trim().toLowerCase();

  return items.filter((item) => {
    if (filters.citySlug && item.citySlug !== filters.citySlug) return false;

    if (normalizedQuery) {
      const haystack = [
        item.title,
        item.tagline,
        item.cityName,
        item.guide?.name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const terms = normalizedQuery.split(/\s+/).filter(Boolean);
      if (!terms.every((term) => haystack.includes(term))) return false;
    }

    if (filters.formats.length > 0) {
      const kind = item.formatKind ?? "individual";
      if (!filters.formats.includes(kind)) return false;
    }

    if (filters.durationBuckets.length > 0) {
      const minutes = item.durationMinutes;
      if (minutes == null) return false;
      if (!filters.durationBuckets.some((bucket) => matchesDurationBucket(minutes, bucket))) {
        return false;
      }
    }

    if (filters.minRating != null) {
      const rating = item.rating;
      if (rating == null || rating < filters.minRating) return false;
    }

    if (filters.maxPrice != null) {
      const usd = getExcursionFilterPriceUsd(item);
      if (usd != null && usd > filters.maxPrice) return false;
    }

    if (filters.partners.length > 0 && !filters.partners.includes(item.partner)) return false;

    return true;
  });
}

export function countActiveExcursionFilters(filters: ExcursionCatalogFilters): number {
  let count = 0;
  if (filters.query.trim()) count += 1;
  if (filters.citySlug) count += 1;
  if (filters.formats.length) count += 1;
  if (filters.durationBuckets.length) count += 1;
  if (filters.minRating != null) count += 1;
  if (filters.maxPrice != null) count += 1;
  if (filters.partners.length) count += 1;
  return count;
}

export function sortExcursions(items: ExcursionListing[], sort: ExcursionSortOption): ExcursionListing[] {
  const copy = [...items];
  switch (sort) {
    case "rating":
      return copy.sort((a, b) => {
        const ar = a.rating ?? -1;
        const br = b.rating ?? -1;
        if (br !== ar) return br - ar;
        return b.reviewCount - a.reviewCount;
      });
    case "price_asc":
      return copy.sort((a, b) => {
        const ap = getExcursionFilterPriceUsd(a);
        const bp = getExcursionFilterPriceUsd(b);
        if (ap == null && bp == null) return b.reviewCount - a.reviewCount;
        if (ap == null) return 1;
        if (bp == null) return -1;
        if (ap !== bp) return ap - bp;
        return b.reviewCount - a.reviewCount;
      });
    case "price_desc":
      return copy.sort((a, b) => {
        const ap = getExcursionFilterPriceUsd(a);
        const bp = getExcursionFilterPriceUsd(b);
        if (ap == null && bp == null) return b.reviewCount - a.reviewCount;
        if (ap == null) return 1;
        if (bp == null) return -1;
        if (ap !== bp) return bp - ap;
        return b.reviewCount - a.reviewCount;
      });
    default:
      return copy.sort((a, b) => b.reviewCount - a.reviewCount);
  }
}

export function parseExcursionFiltersFromSearchParams(
  params: URLSearchParams,
  initialCitySlug?: string,
): ExcursionCatalogFilters {
  const formats = params
    .get("format")
    ?.split(",")
    .filter((value): value is ExcursionFormatKind => value === "group" || value === "individual") ?? [];

  const durationBuckets = params
    .get("duration")
    ?.split(",")
    .filter((value): value is ExcursionDurationBucket =>
      value === "short" || value === "medium" || value === "long",
    ) ?? [];

  const partners = params
    .get("partner")
    ?.split(",")
    .filter((value): value is ExcursionPartner => value === "tripster" || value === "sputnik8") ?? [];

  const minRatingRaw = params.get("minRating");
  const maxPriceRaw = params.get("maxPrice");
  const sort = params.get("sort") as ExcursionSortOption | null;

  return getDefaultExcursionCatalogFilters({
    query: params.get("query") ?? "",
    citySlug: initialCitySlug ?? params.get("city") ?? "",
    sort: sort || "popular",
    formats,
    durationBuckets,
    minRating: minRatingRaw ? Number.parseFloat(minRatingRaw) : null,
    maxPrice: maxPriceRaw ? sanitizeExcursionMaxPrice(Number.parseInt(maxPriceRaw, 10)) : null,
    partners,
  });
}

export function excursionFiltersToSearchParams(filters: ExcursionCatalogFilters, page = 1): URLSearchParams {
  const params = new URLSearchParams();
  if (filters.query.trim()) params.set("query", filters.query.trim());
  if (filters.citySlug) params.set("city", filters.citySlug);
  if (filters.sort !== "popular") params.set("sort", filters.sort);
  if (filters.formats.length) params.set("format", filters.formats.join(","));
  if (filters.durationBuckets.length) params.set("duration", filters.durationBuckets.join(","));
  if (filters.minRating != null) params.set("minRating", String(filters.minRating));
  const sanitizedMax = sanitizeExcursionMaxPrice(filters.maxPrice);
  if (sanitizedMax != null) params.set("maxPrice", String(sanitizedMax));
  if (filters.partners.length) params.set("partner", filters.partners.join(","));
  if (page > 1) params.set("page", String(page));
  return params;
}
