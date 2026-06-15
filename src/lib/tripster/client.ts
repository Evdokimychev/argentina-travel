import "server-only";

import { getTripsterAccessToken, clearTripsterTokenCache } from "@/lib/tripster/auth";
import { getTripsterConfig } from "@/lib/tripster/env";
import {
  matchesSyncCountry,
  resolveSyncCities,
  resolveSyncCountry,
} from "@/lib/tripster/argentina-resolver";
import type {
  TripsterCity,
  TripsterCountry,
  TripsterExperience,
  TripsterExperienceListParams,
  TripsterPaginated,
  TripsterReview,
} from "@/lib/tripster/types";

export class TripsterApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(message: string, status: number, path: string) {
    super(message);
    this.name = "TripsterApiError";
    this.status = status;
    this.path = path;
  }
}

function partnerBasePath(): string {
  const { partner, apiBase } = getTripsterConfig();
  return `${apiBase}/partners/${encodeURIComponent(partner)}`;
}

function buildQuery(params: Record<string, string | number | boolean | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `?${query}` : "";
}

async function tripsterFetch<T>(path: string, retryOnAuth = true): Promise<T> {
  const token = await getTripsterAccessToken(!retryOnAuth);

  const response = await fetch(`${partnerBasePath()}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  if (response.status === 401 && retryOnAuth) {
    clearTripsterTokenCache();
    return tripsterFetch<T>(path, false);
  }

  const body = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    throw new TripsterApiError(
      `Tripster API request failed (${response.status})`,
      response.status,
      path
    );
  }

  if (body == null) {
    throw new TripsterApiError("Tripster API returned empty response", response.status, path);
  }

  return body;
}

export async function fetchTripsterCountries(): Promise<TripsterCountry[]> {
  const data = await tripsterFetch<TripsterCountry[] | TripsterPaginated<TripsterCountry>>("/countries/");
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export async function fetchTripsterCities(countryId: number): Promise<TripsterCity[]> {
  const data = await tripsterFetch<TripsterCity[] | TripsterPaginated<TripsterCity>>(
    `/cities${buildQuery({ country: countryId })}`
  );
  if (Array.isArray(data)) return data;
  return data.results ?? [];
}

export function isArgentinaCountry(country: TripsterCountry): boolean {
  return matchesSyncCountry(country, ["argentina", "аргентина"]);
}

export async function resolveArgentinaCountry(): Promise<TripsterCountry | null> {
  return resolveSyncCountry((path) => tripsterFetch(path));
}

export async function fetchArgentinaCities(): Promise<TripsterCity[]> {
  const country = await resolveArgentinaCountry();
  if (!country) return [];
  return resolveSyncCities((path) => tripsterFetch(path), country);
}

export async function fetchTripsterExperiences(
  params: TripsterExperienceListParams = {}
): Promise<TripsterPaginated<TripsterExperience>> {
  const query = buildQuery({
    city: params.city,
    country: params.country,
    country__slug: params.countrySlug,
    city__slug: params.citySlug,
    page: params.page ?? 1,
    page_size: params.pageSize ?? 100,
    detailed: params.detailed,
    price_format: params.priceFormat,
    updated_after: params.updatedAfter,
    search: params.search,
  });

  return tripsterFetch<TripsterPaginated<TripsterExperience>>(`/experiences${query}`);
}

export async function fetchAllTripsterExperiences(
  params: Omit<TripsterExperienceListParams, "page" | "pageSize"> = {},
  options?: { maxPages?: number }
): Promise<TripsterExperience[]> {
  const maxPages = options?.maxPages ?? 200;
  const collected: TripsterExperience[] = [];
  let page = 1;

  while (page <= maxPages) {
    const batch = await fetchTripsterExperiences({ ...params, page, pageSize: 100 });
    collected.push(...(batch.results ?? []));
    if (!batch.next) break;
    page += 1;
  }

  return collected;
}

export async function fetchTripsterExperience(
  experienceId: number,
  options?: { detailed?: boolean; priceFormat?: "detailed" }
): Promise<TripsterExperience> {
  const query = buildQuery({
    detailed: options?.detailed ?? true,
    price_format: options?.priceFormat ?? "detailed",
  });

  return tripsterFetch<TripsterExperience>(`/experiences/${experienceId}${query}`);
}

export async function fetchTripsterExperienceReviews(
  experienceId: number,
  page = 1,
  pageSize = 50
): Promise<TripsterPaginated<TripsterReview>> {
  const query = buildQuery({ page, page_size: pageSize });
  return tripsterFetch<TripsterPaginated<TripsterReview>>(`/experiences/${experienceId}/reviews${query}`);
}

export async function fetchTripsterExperienceSchedule(experienceId: number) {
  return tripsterFetch<unknown>(`/experiences/${experienceId}/schedule/`);
}

export async function fetchAllArgentinaExperiences(): Promise<{
  country: TripsterCountry;
  cities: TripsterCity[];
  experiences: TripsterExperience[];
}> {
  const country = await resolveArgentinaCountry();
  if (!country) {
    throw new TripsterApiError("Argentina country not found in Tripster API", 404, "/countries/");
  }

  const cities = await resolveSyncCities((path) => tripsterFetch(path), country);
  const experiences: TripsterExperience[] = [];

  for (const city of cities) {
    const cityExperiences = await fetchAllTripsterExperiences({ city: city.id, detailed: false });
    experiences.push(...cityExperiences);
  }

  return { country, cities, experiences };
}

export { isTripsterConfigured } from "@/lib/tripster/env";
