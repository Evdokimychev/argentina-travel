import "server-only";

import { getSputnik8Config, isSputnik8Configured } from "@/lib/sputnik8/env";
import {
  resolveSyncCities,
  resolveSyncCountry,
} from "@/lib/sputnik8/argentina-resolver";
import type {
  Sputnik8City,
  Sputnik8Country,
  Sputnik8Event,
  Sputnik8OrderOption,
  Sputnik8Paginated,
  Sputnik8Product,
  Sputnik8ProductListParams,
  Sputnik8Review,
} from "@/lib/sputnik8/types";

export class Sputnik8ApiError extends Error {
  readonly status: number;
  readonly path: string;

  constructor(message: string, status: number, path: string) {
    super(message);
    this.name = "Sputnik8ApiError";
    this.status = status;
    this.path = path;
  }
}

function unwrapResults<T>(data: T[] | Sputnik8Paginated<T> | null | undefined): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return (
    data.products ??
    data.cities ??
    data.countries ??
    data.events ??
    data.reviews ??
    data.data ??
    data.results ??
    []
  );
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

async function sputnik8Fetch<T>(path: string, init?: RequestInit, useBasicAuth = false): Promise<T> {
  const { apiKey, username, apiBase } = getSputnik8Config();
  const separator = path.includes("?") ? "&" : "?";
  const authQuery = `api_key=${encodeURIComponent(apiKey)}&username=${encodeURIComponent(username)}`;
  const url = useBasicAuth
    ? `${apiBase}${path}`
    : `${apiBase}${path}${path.includes("api_key=") ? "" : `${separator}${authQuery}`}`;

  const headers: Record<string, string> = {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(init?.headers as Record<string, string> | undefined),
  };

  if (useBasicAuth) {
    headers.Authorization = `Basic ${Buffer.from(`${username}:${apiKey}`).toString("base64")}`;
  }

  const response = await fetch(url, {
    ...init,
    headers,
    cache: "no-store",
  });

  const body = (await response.json().catch(() => null)) as T | null;

  if (!response.ok) {
    if (!useBasicAuth && (response.status === 401 || response.status === 403)) {
      return sputnik8Fetch<T>(path, init, true);
    }
    throw new Sputnik8ApiError(
      `Sputnik8 API request failed (${response.status})`,
      response.status,
      path
    );
  }

  if (body == null) {
    throw new Sputnik8ApiError("Sputnik8 API returned empty response", response.status, path);
  }

  return body;
}

export async function fetchSputnik8Countries(): Promise<Sputnik8Country[]> {
  const data = await sputnik8Fetch<Sputnik8Country[] | Sputnik8Paginated<Sputnik8Country>>("/countries");
  return unwrapResults(data);
}

export async function fetchSputnik8Country(countryId: number): Promise<Sputnik8Country> {
  return sputnik8Fetch<Sputnik8Country>(`/countries/${countryId}`);
}

export async function fetchSputnik8Cities(countryId?: number): Promise<Sputnik8City[]> {
  const query = buildQuery({
    country_id: countryId,
    limit: 500,
  });
  const data = await sputnik8Fetch<Sputnik8City[] | Sputnik8Paginated<Sputnik8City>>(`/cities${query}`);
  return unwrapResults(data);
}

export async function fetchSputnik8City(cityId: number): Promise<Sputnik8City> {
  return sputnik8Fetch<Sputnik8City>(`/cities/${cityId}`);
}

export async function fetchSputnik8Products(
  params: Sputnik8ProductListParams = {}
): Promise<Sputnik8Product[]> {
  const config = getSputnik8Config();
  const query = buildQuery({
    city_id: params.cityId,
    limit: params.limit ?? 100,
    lang: params.lang ?? config.defaultLang,
    currency: params.currency ?? config.defaultCurrency,
    order: params.order,
    order_type: params.orderType,
    page: params.page,
  });

  const data = await sputnik8Fetch<Sputnik8Product[] | Sputnik8Paginated<Sputnik8Product>>(
    `/products${query}`
  );
  return unwrapResults(data);
}

export async function fetchAllSputnik8Products(
  params: Omit<Sputnik8ProductListParams, "page"> = {},
  options?: { maxPages?: number }
): Promise<Sputnik8Product[]> {
  const maxPages = options?.maxPages ?? 50;
  const collected: Sputnik8Product[] = [];
  let page = 1;

  while (page <= maxPages) {
    const batch = await fetchSputnik8Products({ ...params, page, limit: 100 });
    if (!batch.length) break;
    collected.push(...batch);
    if (batch.length < 100) break;
    page += 1;
  }

  return collected;
}

export async function fetchSputnik8Product(productId: number): Promise<Sputnik8Product> {
  const config = getSputnik8Config();
  const query = buildQuery({
    lang: config.defaultLang,
    currency: config.defaultCurrency,
  });
  return sputnik8Fetch<Sputnik8Product>(`/products/${productId}${query}`);
}

export async function fetchSputnik8ProductReviews(productId: number): Promise<Sputnik8Review[]> {
  const data = await sputnik8Fetch<Sputnik8Review[] | Sputnik8Paginated<Sputnik8Review>>(
    `/products/${productId}/reviews`
  );
  return unwrapResults(data);
}

export async function fetchSputnik8Events(productId?: number): Promise<Sputnik8Event[]> {
  const query = buildQuery({ product_id: productId, limit: 200 });
  const data = await sputnik8Fetch<Sputnik8Event[] | Sputnik8Paginated<Sputnik8Event>>(`/events${query}`);
  return unwrapResults(data);
}

export async function fetchSputnik8Event(eventId: number): Promise<Sputnik8Event> {
  return sputnik8Fetch<Sputnik8Event>(`/events/${eventId}`);
}

export async function fetchSputnik8EventOrderOptions(eventId: number): Promise<Sputnik8OrderOption[]> {
  const data = await sputnik8Fetch<Sputnik8OrderOption[] | Sputnik8Paginated<Sputnik8OrderOption>>(
    `/events/${eventId}/order_options`
  );
  return unwrapResults(data);
}

export async function resolveArgentinaCountry(): Promise<Sputnik8Country | null> {
  return resolveSyncCountry((path) => sputnik8Fetch(path));
}

export async function fetchArgentinaCities(): Promise<Sputnik8City[]> {
  const country = await resolveArgentinaCountry();
  if (!country) return [];
  return resolveSyncCities((path) => sputnik8Fetch(path), country);
}

export async function fetchAllArgentinaProducts(): Promise<{
  country: Sputnik8Country;
  cities: Sputnik8City[];
  products: Sputnik8Product[];
}> {
  const country = await resolveArgentinaCountry();
  if (!country) {
    throw new Sputnik8ApiError("Argentina country not found in Sputnik8 API", 404, "/countries");
  }

  const cities = await resolveSyncCities((path) => sputnik8Fetch(path), country);
  const products: Sputnik8Product[] = [];

  for (const city of cities) {
    const cityProducts = await fetchAllSputnik8Products({ cityId: city.id });
    products.push(...cityProducts);
  }

  return { country, cities, products };
}

export { isSputnik8Configured };
