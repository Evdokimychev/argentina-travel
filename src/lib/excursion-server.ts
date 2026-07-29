import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { parseExcursionSlug } from "@/lib/excursion-slug";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchExcursionCityBySlug as fetchTripsterExcursionCityBySlug,
  fetchExcursionCities as fetchTripsterExcursionCities,
  fetchExcursionListingsResult as fetchTripsterExcursionListingsResult,
  fetchExcursionBySlugResult as fetchTripsterExcursionBySlugResult,
  fetchExcursionSlugs as fetchTripsterExcursionSlugs,
  fetchSimilarExcursionListings as fetchSimilarTripsterExcursionListings,
} from "@/lib/tripster/repository";
import {
  pgFetchExcursionDetailServer as pgFetchTripsterExcursionDetailServer,
  pgFetchExcursionSlugsServer as pgFetchTripsterExcursionSlugsServer,
  pgFetchExcursionsServer as pgFetchTripsterExcursionsServer,
  pgFetchExcursionCities as pgFetchTripsterExcursionCities,
  pgFetchSimilarExcursions as pgFetchSimilarTripsterExcursions,
} from "@/lib/tripster/pg-repository";
import { fetchGuideProfileServer } from "@/lib/tripster/guide-server";
import { isTripsterConfigured } from "@/lib/tripster/env";
import {
  fetchSputnik8ExcursionBySlugResult,
  fetchSputnik8ExcursionCityBySlug,
  fetchSputnik8ExcursionCities,
  fetchSputnik8ExcursionListingsResult,
  fetchSputnik8ExcursionSlugs,
  fetchSimilarSputnik8ExcursionListings,
} from "@/lib/sputnik8/repository";
import {
  pgFetchSputnik8ExcursionDetailServer,
  pgFetchSputnik8ExcursionSlugsServer,
  pgFetchSputnik8ExcursionsServer,
  pgFetchSputnik8ExcursionCities,
  pgFetchSimilarSputnik8Excursions,
} from "@/lib/sputnik8/pg-repository";
import type {
  ExcursionCity,
  ExcursionDetail,
  ExcursionListFilters,
  ExcursionListResult,
  ExcursionListing,
  ExcursionPartner,
} from "@/types/excursion";
import { excursionCityMergeKey, normalizeExcursionCitySlug } from "@/data/excursion-city-links";
import {
  fetchPublishedExcursionBySlugResult,
  fetchPublishedExcursionListingsResult,
} from "@/lib/tour-content-server";
import {
  nativeExcursionCities,
  nativeTourDetailToExcursion,
  nativeTourListingToExcursion,
} from "@/lib/native-excursion-mapper";
import {
  partnerOk,
  partnerUnavailable,
  partnerUnavailableFromError,
  type PartnerSourceResult,
} from "@/lib/partner-source-result";
import { withCatalogRestResultCircuit } from "@/lib/catalog-rest-circuit";

export type ExcursionCatalogSource = "platform" | "tripster" | "sputnik8";
type ExcursionSourceResult<T> = PartnerSourceResult<T>;

export class ExcursionCatalogUnavailableError extends Error {
  readonly code = "catalog_unavailable";

  constructor(readonly unavailableSources: ExcursionCatalogSource[]) {
    super("Excursion catalog sources are unavailable");
    this.name = "ExcursionCatalogUnavailableError";
  }
}

function getClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

function sortListings(items: ExcursionListing[], sort?: ExcursionListFilters["sort"]): ExcursionListing[] {
  const sorted = [...items];
  switch (sort) {
    case "rating":
      sorted.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    case "price_asc":
      sorted.sort((a, b) => (a.priceValue ?? Number.MAX_SAFE_INTEGER) - (b.priceValue ?? Number.MAX_SAFE_INTEGER));
      break;
    case "price_desc":
      sorted.sort((a, b) => (b.priceValue ?? 0) - (a.priceValue ?? 0));
      break;
    default:
      sorted.sort((a, b) => b.reviewCount - a.reviewCount);
  }
  return sorted;
}

function mergeCities(...sources: ExcursionCity[][]): ExcursionCity[] {
  const merged = new Map<string, ExcursionCity>();

  for (const city of sources.flat()) {
    const key = excursionCityMergeKey(city);
    const slug = normalizeExcursionCitySlug(city.slug, city.name);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, { ...city, slug });
      continue;
    }

    merged.set(key, {
      ...existing,
      slug: existing.slug || slug,
      experienceCount: existing.experienceCount + city.experienceCount,
      coverImage: existing.coverImage ?? city.coverImage,
    });
  }

  return [...merged.values()].sort((a, b) => b.experienceCount - a.experienceCount);
}

async function fetchNativeExcursionListings(
  supabase: ReturnType<typeof createSupabaseAdminClient> | null
): Promise<ExcursionListing[]> {
  const result = await fetchNativeExcursionListingsResult(supabase);
  return result.status === "ok" ? result.data : [];
}

async function fetchNativeExcursionListingsResult(
  supabase: ReturnType<typeof createSupabaseAdminClient> | null
): Promise<ExcursionSourceResult<ExcursionListing[]>> {
  if (!supabase) return partnerUnavailable("db_unavailable", "Supabase client is not configured");
  try {
    const result = await withCatalogRestResultCircuit(() =>
      fetchPublishedExcursionListingsResult(supabase),
    );
    return result.status === "ok"
      ? partnerOk(result.data.map(nativeTourListingToExcursion))
      : result;
  } catch (error) {
    return partnerUnavailableFromError(error);
  }
}

function filterNativeExcursions(
  items: ExcursionListing[],
  filters: ExcursionListFilters
): ExcursionListing[] {
  const query = filters.query?.trim().toLocaleLowerCase("ru") ?? "";
  return items.filter((item) => {
    if (filters.citySlug && item.citySlug !== filters.citySlug) return false;
    if (query && !`${item.title} ${item.tagline ?? ""} ${item.cityName}`.toLocaleLowerCase("ru").includes(query)) {
      return false;
    }
    if (filters.minPrice != null && (item.priceValue ?? 0) < filters.minPrice) return false;
    if (filters.maxPrice != null && (item.priceValue ?? Number.MAX_SAFE_INTEGER) > filters.maxPrice) return false;
    return true;
  });
}

async function fetchTripsterListResult(
  supabase: ReturnType<typeof createSupabaseAdminClient> | null,
  filters: ExcursionListFilters,
  allItems = false
): Promise<ExcursionSourceResult<ExcursionListResult>> {
  const pgFilters = allItems ? { ...filters, page: 1, pageSize: 500 } : filters;

  const restResult = supabase
    ? await withCatalogRestResultCircuit(() =>
        fetchTripsterExcursionListingsResult(supabase, pgFilters),
      ).catch(partnerUnavailableFromError)
    : partnerUnavailable("db_unavailable", "Supabase client is not configured");
  if (restResult.status === "ok" && restResult.data.total > 0) return restResult;

  const pgResult = await pgFetchTripsterExcursionsServer(pgFilters);
  if (pgResult && pgResult.total > 0) return partnerOk(pgResult);

  if (isTripsterConfigured()) {
    try {
      const { fetchLiveTripsterExcursionsFallback } = await import(
        "@/lib/tripster/live-catalog-fallback"
      );
      return partnerOk(await fetchLiveTripsterExcursionsFallback(pgFilters));
    } catch (error) {
      if (restResult.status === "ok") return restResult;
      if (pgResult) return partnerOk(pgResult);
      return partnerUnavailableFromError(error);
    }
  }

  if (restResult.status === "ok") return restResult;
  if (pgResult) return partnerOk(pgResult);
  return partnerUnavailable("auth_restricted", "Tripster API and catalog stores are unavailable");
}

async function fetchSputnik8ListResult(
  supabase: ReturnType<typeof createSupabaseAdminClient> | null,
  filters: ExcursionListFilters,
  allItems = false
): Promise<ExcursionSourceResult<ExcursionListResult>> {
  const pgFilters = allItems ? { ...filters, page: 1, pageSize: 500 } : filters;

  const restResult = supabase
    ? await withCatalogRestResultCircuit(() =>
        fetchSputnik8ExcursionListingsResult(supabase, pgFilters),
      ).catch(partnerUnavailableFromError)
    : partnerUnavailable("db_unavailable", "Supabase client is not configured");
  if (restResult.status === "ok" && restResult.data.total > 0) return restResult;

  const pgResult = await pgFetchSputnik8ExcursionsServer(pgFilters);
  if (pgResult) return partnerOk(pgResult);
  if (restResult.status === "ok") return restResult;
  return partnerUnavailable("db_unavailable", "Sputnik8 catalog stores are unavailable");
}

export function resolveExcursionCatalogSources(
  filters: ExcursionListFilters,
  sources: Record<ExcursionCatalogSource, ExcursionSourceResult<ExcursionListResult | ExcursionListing[]>>,
): ExcursionSourceResult<ExcursionListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(500, Math.max(1, filters.pageSize ?? 24));
  const unavailableSources = (Object.entries(sources) as Array<
    [ExcursionCatalogSource, ExcursionSourceResult<ExcursionListResult | ExcursionListing[]>]
  >)
    .filter(([, result]) => result.status === "unavailable")
    .map(([source]) => source);

  const tripster = sources.tripster.status === "ok"
    ? sources.tripster.data as ExcursionListResult
    : { items: [], cities: [] };
  const sputnik8 = sources.sputnik8.status === "ok"
    ? sources.sputnik8.data as ExcursionListResult
    : { items: [], cities: [] };
  const nativeAll = sources.platform.status === "ok"
    ? sources.platform.data as ExcursionListing[]
    : [];

  const nativeItems = filterNativeExcursions(nativeAll, filters);
  const cities = mergeCities(tripster.cities, sputnik8.cities, nativeExcursionCities(nativeAll));
  const mergedItems = sortListings([...nativeItems, ...tripster.items, ...sputnik8.items], filters.sort);
  const total = mergedItems.length;
  if (total === 0 && unavailableSources.length > 0) {
    const firstUnavailable = sources[unavailableSources[0]!];
    return partnerUnavailable(
      firstUnavailable.status === "unavailable"
        ? firstUnavailable.errorClass
        : "unknown",
      `Excursion sources unavailable: ${unavailableSources.join(",")}`,
    );
  }

  const from = (page - 1) * pageSize;
  return partnerOk({
    items: mergedItems.slice(from, from + pageSize),
    total,
    page,
    pageSize,
    cities,
    catalogState: total === 0 ? "empty" : unavailableSources.length > 0 ? "partial" : "ready",
    unavailableSources,
  });
}

export async function fetchExcursionsResultServer(
  filters: ExcursionListFilters = {}
): Promise<ExcursionSourceResult<ExcursionListResult>> {
  const supabase = getClient();

  const [tripster, sputnik8, platform] = await Promise.all([
    fetchTripsterListResult(supabase, { ...filters, page: 1, pageSize: 500 }, true),
    fetchSputnik8ListResult(supabase, { ...filters, page: 1, pageSize: 500 }, true),
    fetchNativeExcursionListingsResult(supabase),
  ]);

  return resolveExcursionCatalogSources(filters, { tripster, sputnik8, platform });
}

export async function fetchExcursionsServer(
  filters: ExcursionListFilters = {}
): Promise<ExcursionListResult> {
  const result = await fetchExcursionsResultServer(filters);
  if (result.status === "unavailable") {
    throw new ExcursionCatalogUnavailableError([]);
  }
  return result.data;
}

async function withTripsterGuide(
  detail: ExcursionDetail,
): Promise<ExcursionDetail> {
  try {
    const enriched = await enrichTripsterGuideProfile(detail);
    return { ...enriched, tripsterPartnerApiConfigured: isTripsterConfigured() };
  } catch {
    return { ...detail, tripsterPartnerApiConfigured: isTripsterConfigured() };
  }
}

async function fetchTripsterDetailResult(
  slug: string,
): Promise<ExcursionSourceResult<ExcursionDetail | null>> {
  // Prefer Postgres under REST egress pressure: listing already falls back to PG,
  // but a throwing/hanging Supabase detail read must not skip the durable path.
  const pgDetail = await pgFetchTripsterExcursionDetailServer(slug);
  if (pgDetail) return partnerOk(await withTripsterGuide(pgDetail));

  const supabase = getClient();
  const restResult = supabase
    ? await withCatalogRestResultCircuit(() =>
        fetchTripsterExcursionBySlugResult(supabase, slug),
      ).catch(partnerUnavailableFromError)
    : partnerUnavailable("db_unavailable", "Supabase client is not configured");
  if (restResult.status === "ok" && restResult.data) {
    return partnerOk(await withTripsterGuide(restResult.data));
  }

  if (isTripsterConfigured()) {
    try {
      const { fetchLiveTripsterExcursionDetailFallback } = await import(
        "@/lib/tripster/live-catalog-fallback"
      );
      const live = await fetchLiveTripsterExcursionDetailFallback(slug);
      return partnerOk(live ? await withTripsterGuide(live) : null);
    } catch (error) {
      if (typeof error === "object" && error && "status" in error && error.status === 404) {
        return partnerOk(null);
      }
      return partnerUnavailableFromError(error);
    }
  }

  return restResult.status === "ok"
    ? restResult
    : partnerUnavailable("db_unavailable", "Tripster detail stores are unavailable");
}

async function fetchSputnik8DetailResult(
  slug: string,
): Promise<ExcursionSourceResult<ExcursionDetail | null>> {
  const detail = await pgFetchSputnik8ExcursionDetailServer(slug);
  if (detail) return partnerOk(detail);

  const supabase = getClient();
  if (!supabase) return partnerUnavailable("db_unavailable", "Sputnik8 detail stores are unavailable");
  return withCatalogRestResultCircuit(() =>
    fetchSputnik8ExcursionBySlugResult(supabase, slug),
  ).catch(partnerUnavailableFromError);
}

async function fetchNativeDetailResult(
  slug: string,
): Promise<ExcursionSourceResult<ExcursionDetail | null>> {
  const supabase = getClient();
  if (!supabase) return partnerUnavailable("db_unavailable", "Supabase client is not configured");
  try {
    const source = await withCatalogRestResultCircuit(() =>
      fetchPublishedExcursionBySlugResult(supabase, slug),
    );
    return source.status === "ok"
      ? partnerOk(
          source.data ? nativeTourDetailToExcursion(source.data.canonical, source.data.detail) : null,
        )
      : source;
  } catch (error) {
    return partnerUnavailableFromError(error);
  }
}

async function enrichTripsterGuideProfile(detail: ExcursionDetail): Promise<ExcursionDetail> {
  if (detail.partner !== "tripster" || !detail.guide?.id) return detail;

  const profile = await fetchGuideProfileServer(detail.guide.id);
  if (!profile) return detail;

  return {
    ...detail,
    guide: {
      ...detail.guide,
      ...profile,
      name: profile.name || detail.guide.name,
      avatar: profile.avatar || detail.guide.avatar,
      url: profile.url || detail.guide.url,
    },
  };
}

export function resolveExcursionDetailSources(
  sources: Array<[ExcursionCatalogSource, ExcursionSourceResult<ExcursionDetail | null>]>,
): ExcursionSourceResult<ExcursionDetail | null> {
  for (const [, result] of sources) {
    if (result.status === "ok" && result.data) return result;
  }
  const unavailable = sources.find(([, result]) => result.status === "unavailable");
  return unavailable?.[1] ?? partnerOk(null);
}

async function loadExcursionDetailResultServer(
  slug: string,
): Promise<ExcursionSourceResult<ExcursionDetail | null>> {
  const native = await fetchNativeDetailResult(slug);
  if (native.status === "ok" && native.data) return native;

  const parsed = parseExcursionSlug(slug);

  if (parsed?.partner === "sputnik8") {
    return resolveExcursionDetailSources([
      ["platform", native],
      ["sputnik8", await fetchSputnik8DetailResult(slug)],
    ]);
  }

  if (parsed?.partner === "tripster") {
    return resolveExcursionDetailSources([
      ["platform", native],
      ["tripster", await fetchTripsterDetailResult(slug)],
    ]);
  }

  const tripster = await fetchTripsterDetailResult(slug);
  if (tripster.status === "ok" && tripster.data) return tripster;
  return resolveExcursionDetailSources([
    ["platform", native],
    ["tripster", tripster],
    ["sputnik8", await fetchSputnik8DetailResult(slug)],
  ]);
}

function getCachedExcursionDetail(slug: string): Promise<ExcursionDetail | null> {
  return unstable_cache(
    async () => {
      const result = await loadExcursionDetailResultServer(slug);
      if (result.status === "unavailable") {
        throw new ExcursionCatalogUnavailableError([]);
      }
      return result.data;
    },
    ["excursion-detail-v4", slug],
    { revalidate: 600, tags: ["excursions"] },
  )();
}

/** Request-scoped memoization on top of the time-based cache for API routes and RSC. */
export const fetchExcursionDetailResultServer = cache(
  async (slug: string): Promise<ExcursionSourceResult<ExcursionDetail | null>> => {
    try {
      return partnerOk(await getCachedExcursionDetail(slug));
    } catch (error) {
      return partnerUnavailableFromError(error);
    }
  },
);

export async function fetchExcursionDetailServer(slug: string): Promise<ExcursionDetail | null> {
  const result = await fetchExcursionDetailResultServer(slug);
  if (result.status === "unavailable") throw new ExcursionCatalogUnavailableError([]);
  return result.data;
}

export async function fetchExcursionCityServer(citySlug: string): Promise<ExcursionCity | null> {
  const supabase = getClient();
  const requestedCityKey = normalizeExcursionCitySlug(citySlug).toLowerCase();
  const matchesRequestedCity = (city: ExcursionCity) =>
    normalizeExcursionCitySlug(city.slug, city.name).toLowerCase() === requestedCityKey;

  let tripsterCity: ExcursionCity | null = null;
  let sputnik8City: ExcursionCity | null = null;

  if (supabase) {
    [tripsterCity, sputnik8City] = await Promise.all([
      fetchTripsterExcursionCityBySlug(supabase, citySlug),
      fetchSputnik8ExcursionCityBySlug(supabase, citySlug),
    ]);
  }

  if (!tripsterCity) {
    const tripsterCities = await pgFetchTripsterExcursionCities();
    tripsterCity = tripsterCities.find(matchesRequestedCity) ?? null;
  }
  if (!sputnik8City) {
    const sputnik8Cities = await pgFetchSputnik8ExcursionCities();
    sputnik8City = sputnik8Cities.find(matchesRequestedCity) ?? null;
  }

  const nativeCities = nativeExcursionCities(await fetchNativeExcursionListings(supabase));
  const nativeCity = nativeCities.find(matchesRequestedCity) ?? null;

  if (!tripsterCity && !sputnik8City && !nativeCity) {
    const catalog = await fetchExcursionsServer({ pageSize: 1 });
    return catalog.cities.find(matchesRequestedCity) ?? null;
  }

  const merged = mergeCities(
    tripsterCity ? [tripsterCity] : [],
    sputnik8City ? [sputnik8City] : [],
    nativeCity ? [nativeCity] : []
  );
  return merged[0] ?? null;
}

export async function fetchExcursionSlugsServer(): Promise<string[]> {
  const supabase = getClient();

  let tripster: string[] = [];
  let sputnik8: string[] = [];

  if (supabase) {
    [tripster, sputnik8] = await Promise.all([
      fetchTripsterExcursionSlugs(supabase),
      fetchSputnik8ExcursionSlugs(supabase),
    ]);
  }

  if (tripster.length === 0) {
    tripster = await pgFetchTripsterExcursionSlugsServer();
  }
  if (sputnik8.length === 0) {
    sputnik8 = await pgFetchSputnik8ExcursionSlugsServer();
  }

  const native = await fetchNativeExcursionListings(supabase);
  return [...new Set([...native.map((item) => item.slug), ...tripster, ...sputnik8])].sort();
}

export async function fetchSimilarExcursionsServer(
  cityId: number,
  excludeId: number,
  limit = 6,
  partner: ExcursionPartner = "tripster"
): Promise<ExcursionListing[]> {
  const supabase = getClient();

  if (partner === "platform") return [];

  if (partner === "sputnik8") {
    if (supabase) {
      const items = await fetchSimilarSputnik8ExcursionListings(supabase, { cityId, excludeId, limit });
      if (items.length > 0) return items;
    }
    return pgFetchSimilarSputnik8Excursions(cityId, excludeId, limit);
  }

  if (supabase) {
    const items = await fetchSimilarTripsterExcursionListings(supabase, { cityId, excludeId, limit });
    if (items.length > 0) return items;
  }
  return pgFetchSimilarTripsterExcursions(cityId, excludeId, limit);
}

async function loadExcursionCitiesUncached(): Promise<ExcursionCity[]> {
  const supabase = getClient();
  const nativePromise = fetchNativeExcursionListings(supabase);

  let tripster: ExcursionCity[] = [];
  let sputnik8: ExcursionCity[] = [];

  if (supabase) {
    [tripster, sputnik8] = await Promise.all([
      fetchTripsterExcursionCities(supabase),
      fetchSputnik8ExcursionCities(supabase),
    ]);
  }

  const [tripsterFallback, sputnik8Fallback] = await Promise.all([
    tripster.length === 0
      ? pgFetchTripsterExcursionCities()
      : Promise.resolve(tripster),
    sputnik8.length === 0
      ? pgFetchSputnik8ExcursionCities()
      : Promise.resolve(sputnik8),
  ]);
  tripster = tripsterFallback;
  sputnik8 = sputnik8Fallback;

  const native = await nativePromise;
  return mergeCities(tripster, sputnik8, nativeExcursionCities(native));
}

const cachedExcursionCities = unstable_cache(
  loadExcursionCitiesUncached,
  ["excursion-cities-v1"],
  { revalidate: 600, tags: ["excursion-cities"] },
);

export async function fetchExcursionCitiesServer(): Promise<ExcursionCity[]> {
  return cachedExcursionCities();
}

export { parseExcursionSlug };
