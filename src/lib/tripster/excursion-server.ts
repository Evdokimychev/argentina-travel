import "server-only";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchExcursionBySlug,
  fetchExcursionCityBySlug,
  fetchExcursionListings,
  fetchExcursionSlugs,
} from "@/lib/tripster/repository";
import {
  pgFetchExcursionDetailServer,
  pgFetchExcursionSlugsServer,
  pgFetchExcursionsServer,
  pgFetchExcursionCities,
} from "@/lib/tripster/pg-repository";
import type {
  ExcursionCity,
  ExcursionDetail,
  ExcursionListFilters,
  ExcursionListResult,
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
  if (supabase) return fetchExcursionBySlug(supabase, slug);
  return pgFetchExcursionDetailServer(slug);
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
