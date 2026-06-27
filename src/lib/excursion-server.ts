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

function mergeCities(tripster: ExcursionCity[], sputnik8: ExcursionCity[]): ExcursionCity[] {
  const merged = new Map<string, ExcursionCity>();

  for (const city of [...tripster, ...sputnik8]) {
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

async function fetchTripsterListResult(
  supabase: ReturnType<typeof createSupabaseAdminClient> | null,
  filters: ExcursionListFilters,
  allItems = false
): Promise<ExcursionListResult> {
  if (supabase) {
    if (allItems) {
      const first = await fetchTripsterExcursionListings(supabase, { ...filters, page: 1, pageSize: 500 });
      return first;
    }
    return fetchTripsterExcursionListings(supabase, filters);
  }

  const pgResult = await pgFetchTripsterExcursionsServer(allItems ? { ...filters, page: 1, pageSize: 500 } : filters);
  if (pgResult) return pgResult;

  return { items: [], total: 0, page: filters.page ?? 1, pageSize: filters.pageSize ?? 24, cities: [] };
}

async function fetchSputnik8ListResult(
  supabase: ReturnType<typeof createSupabaseAdminClient> | null,
  filters: ExcursionListFilters,
  allItems = false
): Promise<ExcursionListResult> {
  if (supabase) {
    if (allItems) {
      return fetchSputnik8ExcursionListings(supabase, { ...filters, page: 1, pageSize: 500 });
    }
    return fetchSputnik8ExcursionListings(supabase, filters);
  }

  const pgResult = await pgFetchSputnik8ExcursionsServer(allItems ? { ...filters, page: 1, pageSize: 500 } : filters);
  if (pgResult) return pgResult;

  return { items: [], total: 0, page: filters.page ?? 1, pageSize: filters.pageSize ?? 24, cities: [] };
}

export async function fetchExcursionsServer(
  filters: ExcursionListFilters = {}
): Promise<ExcursionListResult> {
  const supabase = getClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(500, Math.max(1, filters.pageSize ?? 24));

  const [tripster, sputnik8] = await Promise.all([
    fetchTripsterListResult(supabase, { ...filters, page: 1, pageSize: 500 }, true),
    fetchSputnik8ListResult(supabase, { ...filters, page: 1, pageSize: 500 }, true),
  ]);

  const cities = mergeCities(tripster.cities, sputnik8.cities);
  const mergedItems = sortListings([...tripster.items, ...sputnik8.items], filters.sort);
  const total = mergedItems.length;
  const from = (page - 1) * pageSize;
  const items = mergedItems.slice(from, from + pageSize);

  return { items, total, page, pageSize, cities };
}

async function fetchTripsterDetail(slug: string): Promise<ExcursionDetail | null> {
  const supabase = getClient();
  const detail = supabase
    ? await fetchTripsterExcursionBySlug(supabase, slug)
    : await pgFetchTripsterExcursionDetailServer(slug);
  if (!detail) return null;
  const enriched = await enrichTripsterGuideProfile(detail);
  return {
    ...enriched,
    tripsterPartnerApiConfigured: isTripsterConfigured(),
  };
}

async function fetchSputnik8Detail(slug: string): Promise<ExcursionDetail | null> {
  const supabase = getClient();
  return supabase
    ? await fetchSputnik8ExcursionBySlug(supabase, slug)
    : await pgFetchSputnik8ExcursionDetailServer(slug);
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

const cachedExcursionDetailBySlug = unstable_cache(
  loadExcursionDetailServer,
  ["excursion-detail"],
  { revalidate: 600, tags: ["excursions"] }
);

/** Request-scoped memoization on top of the time-based cache for API routes and RSC. */
export const fetchExcursionDetailServer = cache(
  (slug: string): Promise<ExcursionDetail | null> => cachedExcursionDetailBySlug(slug)
);

export async function fetchExcursionCityServer(citySlug: string): Promise<ExcursionCity | null> {
  const supabase = getClient();

  let tripsterCity: ExcursionCity | null = null;
  let sputnik8City: ExcursionCity | null = null;

  if (supabase) {
    [tripsterCity, sputnik8City] = await Promise.all([
      fetchTripsterExcursionCityBySlug(supabase, citySlug),
      fetchSputnik8ExcursionCityBySlug(supabase, citySlug),
    ]);
  } else {
    const [tripsterCities, sputnik8Cities] = await Promise.all([
      pgFetchTripsterExcursionCities(),
      pgFetchSputnik8ExcursionCities(),
    ]);
    tripsterCity = tripsterCities.find((city) => city.slug === citySlug) ?? null;
    sputnik8City = sputnik8Cities.find((city) => city.slug === citySlug) ?? null;
  }

  if (!tripsterCity && !sputnik8City) return null;

  const merged = mergeCities(
    tripsterCity ? [tripsterCity] : [],
    sputnik8City ? [sputnik8City] : []
  );
  return merged[0] ?? null;
}

export async function fetchExcursionSlugsServer(): Promise<string[]> {
  const supabase = getClient();

  if (supabase) {
    const [tripster, sputnik8] = await Promise.all([
      fetchTripsterExcursionSlugs(supabase),
      fetchSputnik8ExcursionSlugs(supabase),
    ]);
    return [...new Set([...tripster, ...sputnik8])].sort();
  }

  const [tripster, sputnik8] = await Promise.all([
    pgFetchTripsterExcursionSlugsServer(),
    pgFetchSputnik8ExcursionSlugsServer(),
  ]);
  return [...new Set([...tripster, ...sputnik8])].sort();
}

export async function fetchSimilarExcursionsServer(
  cityId: number,
  excludeId: number,
  limit = 6,
  partner: ExcursionPartner = "tripster"
): Promise<ExcursionListing[]> {
  const supabase = getClient();

  if (partner === "sputnik8") {
    if (supabase) {
      return fetchSimilarSputnik8ExcursionListings(supabase, { cityId, excludeId, limit });
    }
    return pgFetchSimilarSputnik8Excursions(cityId, excludeId, limit);
  }

  if (supabase) {
    return fetchSimilarTripsterExcursionListings(supabase, { cityId, excludeId, limit });
  }
  return pgFetchSimilarTripsterExcursions(cityId, excludeId, limit);
}

export async function fetchExcursionCitiesServer(): Promise<ExcursionCity[]> {
  const supabase = getClient();

  if (supabase) {
    const [tripster, sputnik8] = await Promise.all([
      fetchTripsterExcursionCities(supabase),
      fetchSputnik8ExcursionCities(supabase),
    ]);
    return mergeCities(tripster, sputnik8);
  }

  const [tripster, sputnik8] = await Promise.all([
    pgFetchTripsterExcursionCities(),
    pgFetchSputnik8ExcursionCities(),
  ]);
  return mergeCities(tripster, sputnik8);
}

export { parseExcursionSlug };
