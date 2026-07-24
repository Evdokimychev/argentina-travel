import "server-only";

import { cache } from "react";
import { unstable_cache } from "next/cache";
import { parseExcursionSlug } from "@/lib/excursion-slug";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchExcursionBySlug as fetchTripsterExcursionBySlug,
  fetchExcursionCityBySlug as fetchTripsterExcursionCityBySlug,
  fetchExcursionCities as fetchTripsterExcursionCities,
  fetchExcursionListings as fetchTripsterExcursionListings,
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
  fetchSputnik8ExcursionBySlug,
  fetchSputnik8ExcursionCityBySlug,
  fetchSputnik8ExcursionCities,
  fetchSputnik8ExcursionListings,
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
  fetchPublishedExcursionBySlug,
  fetchPublishedExcursionListings,
} from "@/lib/tour-content-server";
import {
  nativeExcursionCities,
  nativeTourDetailToExcursion,
  nativeTourListingToExcursion,
} from "@/lib/native-excursion-mapper";

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
  if (!supabase) return [];
  try {
    const listings = await fetchPublishedExcursionListings(supabase);
    return listings.map(nativeTourListingToExcursion);
  } catch {
    return [];
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
): Promise<ExcursionListResult> {
  const pgFilters = allItems ? { ...filters, page: 1, pageSize: 500 } : filters;
  const empty: ExcursionListResult = {
    items: [],
    total: 0,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 24,
    cities: [],
  };

  if (supabase) {
    try {
      const fromSupabase = await fetchTripsterExcursionListings(supabase, pgFilters);
      if (fromSupabase.items.length > 0 || fromSupabase.total > 0) return fromSupabase;
    } catch {
      // Supabase REST blocked or unavailable — fall through to Postgres.
    }
  }

  const pgResult = await pgFetchTripsterExcursionsServer(pgFilters);
  return pgResult ?? empty;
}

async function fetchSputnik8ListResult(
  supabase: ReturnType<typeof createSupabaseAdminClient> | null,
  filters: ExcursionListFilters,
  allItems = false
): Promise<ExcursionListResult> {
  const pgFilters = allItems ? { ...filters, page: 1, pageSize: 500 } : filters;
  const empty: ExcursionListResult = {
    items: [],
    total: 0,
    page: filters.page ?? 1,
    pageSize: filters.pageSize ?? 24,
    cities: [],
  };

  if (supabase) {
    try {
      const fromSupabase = await fetchSputnik8ExcursionListings(supabase, pgFilters);
      if (fromSupabase.items.length > 0 || fromSupabase.total > 0) return fromSupabase;
    } catch {
      // Supabase REST blocked or unavailable — fall through to Postgres.
    }
  }

  const pgResult = await pgFetchSputnik8ExcursionsServer(pgFilters);
  return pgResult ?? empty;
}

export async function fetchExcursionsServer(
  filters: ExcursionListFilters = {}
): Promise<ExcursionListResult> {
  const supabase = getClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(500, Math.max(1, filters.pageSize ?? 24));

  const [tripster, sputnik8, nativeAll] = await Promise.all([
    fetchTripsterListResult(supabase, { ...filters, page: 1, pageSize: 500 }, true),
    fetchSputnik8ListResult(supabase, { ...filters, page: 1, pageSize: 500 }, true),
    fetchNativeExcursionListings(supabase),
  ]);

  const nativeItems = filterNativeExcursions(nativeAll, filters);
  const cities = mergeCities(tripster.cities, sputnik8.cities, nativeExcursionCities(nativeAll));
  const mergedItems = sortListings([...nativeItems, ...tripster.items, ...sputnik8.items], filters.sort);
  const total = mergedItems.length;
  const from = (page - 1) * pageSize;
  const items = mergedItems.slice(from, from + pageSize);

  return { items, total, page, pageSize, cities };
}

async function fetchTripsterDetail(slug: string): Promise<ExcursionDetail | null> {
  // Prefer Postgres under REST egress pressure: listing already falls back to PG,
  // but a throwing/hanging Supabase detail read must not skip the durable path.
  let detail = await pgFetchTripsterExcursionDetailServer(slug);

  if (!detail) {
    const supabase = getClient();
    if (supabase) {
      try {
        detail = await fetchTripsterExcursionBySlug(supabase, slug);
      } catch {
        detail = null;
      }
    }
  }

  if (!detail) return null;

  try {
    const enriched = await enrichTripsterGuideProfile(detail);
    return {
      ...enriched,
      tripsterPartnerApiConfigured: isTripsterConfigured(),
    };
  } catch {
    return {
      ...detail,
      tripsterPartnerApiConfigured: isTripsterConfigured(),
    };
  }
}

async function fetchSputnik8Detail(slug: string): Promise<ExcursionDetail | null> {
  const detail = await pgFetchSputnik8ExcursionDetailServer(slug);
  if (detail) return detail;

  const supabase = getClient();
  if (!supabase) return null;
  try {
    return await fetchSputnik8ExcursionBySlug(supabase, slug);
  } catch {
    return null;
  }
}

async function fetchNativeDetail(slug: string): Promise<ExcursionDetail | null> {
  const supabase = getClient();
  if (!supabase) return null;
  try {
    const source = await fetchPublishedExcursionBySlug(supabase, slug);
    return source ? nativeTourDetailToExcursion(source.canonical, source.detail) : null;
  } catch {
    return null;
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

async function loadExcursionDetailServer(slug: string): Promise<ExcursionDetail | null> {
  const native = await fetchNativeDetail(slug);
  if (native) return native;

  const parsed = parseExcursionSlug(slug);

  if (parsed?.partner === "sputnik8") {
    return fetchSputnik8Detail(slug);
  }

  if (parsed?.partner === "tripster") {
    return fetchTripsterDetail(slug);
  }

  const tripster = await fetchTripsterDetail(slug);
  if (tripster) return tripster;
  return fetchSputnik8Detail(slug);
}

function getCachedExcursionDetail(slug: string): Promise<ExcursionDetail | null> {
  return unstable_cache(
    () => loadExcursionDetailServer(slug),
    ["excursion-detail-v3", slug],
    { revalidate: 600, tags: ["excursions"] },
  )();
}

/** Request-scoped memoization on top of the time-based cache for API routes and RSC. */
export const fetchExcursionDetailServer = cache(
  (slug: string): Promise<ExcursionDetail | null> => getCachedExcursionDetail(slug),
);

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
