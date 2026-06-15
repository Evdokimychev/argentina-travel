import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchExcursionBySlug,
  fetchExcursionCityBySlug,
  fetchExcursionListings,
  fetchExcursionSlugs,
  fetchSimilarExcursionListings,
} from "@/lib/tripster/repository";
import {
  pgFetchExcursionDetailServer,
  pgFetchExcursionSlugsServer,
  pgFetchExcursionsServer,
  pgFetchExcursionCities,
  pgFetchSimilarExcursions,
} from "@/lib/tripster/pg-repository";
import { fetchGuideProfileServer } from "@/lib/tripster/guide-server";
import type {
  ExcursionCity,
  ExcursionDetail,
  ExcursionListFilters,
  ExcursionListResult,
  ExcursionListing,
} from "@/types/excursion";

function getClient() {
  try {
    return createSupabaseAdminClient();
  } catch {
    return null;
  }
}

export async function fetchExcursionsServer(
  filters: ExcursionListFilters = {}
): Promise<ExcursionListResult> {
  const supabase = getClient();
  if (supabase) return fetchExcursionListings(supabase, filters);

  const pgResult = await pgFetchExcursionsServer(filters);
  if (pgResult) return pgResult;

  return { items: [], total: 0, page: filters.page ?? 1, pageSize: filters.pageSize ?? 24, cities: [] };
}

export async function fetchExcursionDetailServer(slug: string): Promise<ExcursionDetail | null> {
  const supabase = getClient();
  const detail = supabase
    ? await fetchExcursionBySlug(supabase, slug)
    : await pgFetchExcursionDetailServer(slug);
  if (!detail) return null;
  return enrichExcursionDetailGuideProfile(detail);
}

async function enrichExcursionDetailGuideProfile(
  detail: ExcursionDetail
): Promise<ExcursionDetail> {
  if (!detail.guide?.id) return detail;

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

export async function fetchExcursionCityServer(citySlug: string): Promise<ExcursionCity | null> {
  const supabase = getClient();
  if (supabase) return fetchExcursionCityBySlug(supabase, citySlug);

  const cities = await pgFetchExcursionCities();
  return cities.find((city) => city.slug === citySlug) ?? null;
}

export async function fetchExcursionSlugsServer(): Promise<string[]> {
  const supabase = getClient();
  if (supabase) return fetchExcursionSlugs(supabase);
  return pgFetchExcursionSlugsServer();
}

export async function fetchSimilarExcursionsServer(
  cityId: number,
  excludeId: number,
  limit = 6
): Promise<ExcursionListing[]> {
  const supabase = getClient();
  if (supabase) {
    return fetchSimilarExcursionListings(supabase, { cityId, excludeId, limit });
  }
  return pgFetchSimilarExcursions(cityId, excludeId, limit);
}
