import "server-only";

import {
  resolveWeGoTripApiLang,
  resolveWeGoTripShopHost,
} from "@/lib/wegottrip/constants";
import type {
  WeGoTripCityRef,
  WeGoTripCountryRef,
  WeGoTripPaginated,
  WeGoTripProductDetail,
  WeGoTripProductSummary,
  WeGoTripSearchResult,
} from "@/lib/wegottrip/types";
import type { CurrencyCode, LocaleCode } from "@/types/locale";

const WEGOTTRIP_API = "https://app.wegotrip.com/api/v2";

type RawCity = { id: number; name: string; slug: string };
type RawCountry = { id: number; name: string; slug: string };

type RawProduct = {
  id: number;
  title: string;
  slug: string;
  preview?: string;
  cover?: string;
  price?: number;
  exprice?: number;
  currency?: string;
  currencyCode?: string;
  duration?: string;
  durationMin?: number;
  durationMax?: number;
  category?: string;
  rating?: number | null;
  reviewsCount?: number;
  city?: RawCity;
  country?: RawCountry;
  tags?: Record<string, boolean>;
  types?: Record<string, boolean>;
  author?: { name?: string };
  description?: string;
  highlights?: string[];
  distance?: string;
  address?: string;
  startLocation?: string;
  finishLocation?: string;
  inclusions?: string[];
  exclusions?: string[];
  importantInfo?: string[];
  images?: Array<{ id: number; preview: string; full: string; description?: string }>;
  tour?: { eventsCount?: number };
  locale?: string;
  type?: string;
  name?: string;
  available?: boolean;
};

async function weGoTripFetch<T>(
  path: string,
  params: Record<string, string | number | undefined>,
  locale: LocaleCode
): Promise<T | null> {
  const url = new URL(`${WEGOTTRIP_API}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value !== "") url.searchParams.set(key, String(value));
  }

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "Accept-Language": locale,
      },
      next: { revalidate: 3600 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

function mapCity(raw?: RawCity): WeGoTripCityRef {
  return {
    id: raw?.id ?? 0,
    name: raw?.name ?? "",
    slug: raw?.slug ?? "",
  };
}

function mapCountry(raw?: RawCountry): WeGoTripCountryRef | undefined {
  if (!raw?.id) return undefined;
  return { id: raw.id, name: raw.name, slug: raw.slug };
}

export function mapWeGoTripProduct(raw: RawProduct): WeGoTripProductSummary {
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    preview: raw.preview ?? raw.cover ?? "",
    cover: raw.cover,
    price: raw.price ?? raw.exprice ?? 0,
    currencySymbol: raw.currency ?? "$",
    currencyCode: raw.currencyCode ?? "USD",
    duration: raw.duration,
    durationMin: raw.durationMin,
    durationMax: raw.durationMax,
    category: raw.category,
    rating: raw.rating ?? null,
    reviewsCount: raw.reviewsCount ?? 0,
    city: mapCity(raw.city),
    country: mapCountry(raw.country),
    tags: raw.tags ?? raw.types,
    authorName: raw.author?.name,
  };
}

export function mapWeGoTripProductDetail(raw: RawProduct): WeGoTripProductDetail {
  const summary = mapWeGoTripProduct(raw);
  return {
    ...summary,
    description: raw.description ?? "",
    highlights: raw.highlights ?? [],
    distance: raw.distance,
    address: raw.address,
    startLocation: raw.startLocation,
    finishLocation: raw.finishLocation,
    inclusions: raw.inclusions ?? [],
    exclusions: raw.exclusions ?? [],
    importantInfo: raw.importantInfo ?? [],
    images: (raw.images ?? []).map((image) => ({
      id: image.id,
      preview: image.preview,
      full: image.full,
      description: image.description,
    })),
    tourEventsCount: raw.tour?.eventsCount,
  };
}

function mapPaginated<T>(payload: {
  data?: {
    count?: number;
    pages?: number;
    current?: number;
    next?: number | null;
    results?: T[];
  };
}): WeGoTripPaginated<T> {
  const data = payload.data ?? {};
  return {
    count: data.count ?? 0,
    pages: data.pages ?? 0,
    current: data.current ?? 1,
    next: data.next ?? null,
    results: data.results ?? [],
  };
}

async function fetchPopularProducts(input: {
  locale: LocaleCode;
  currency: CurrencyCode;
  cityId?: number;
  countryId?: number;
  page?: number;
  lang?: string;
}) {
  const lang = input.lang ?? resolveWeGoTripApiLang(input.locale);
  const payload = await weGoTripFetch<{ data?: { results?: RawProduct[] } & Omit<WeGoTripPaginated<RawProduct>, "results"> }>(
    "/products/popular/",
    {
      lang,
      currency: input.currency,
      city: input.cityId,
      country: input.countryId,
      page: input.page ?? 1,
    },
    input.locale
  );
  if (!payload) return null;
  const paginated = mapPaginated<RawProduct>(payload);
  return {
    ...paginated,
    results: paginated.results.map(mapWeGoTripProduct),
  };
}

export async function getWeGoTripPopularProducts(input: {
  locale: LocaleCode;
  currency: CurrencyCode;
  cityId?: number;
  countryId?: number;
  page?: number;
}): Promise<WeGoTripPaginated<WeGoTripProductSummary>> {
  const primary = await fetchPopularProducts(input);
  if (primary && primary.count > 0) return primary;

  if (resolveWeGoTripApiLang(input.locale) !== "en") {
    const fallback = await fetchPopularProducts({ ...input, lang: "en" });
    if (fallback && fallback.count > 0) return fallback;
  }

  return primary ?? { count: 0, pages: 0, current: 1, next: null, results: [] };
}

export async function getWeGoTripProductById(input: {
  productId: number;
  locale: LocaleCode;
  currency: CurrencyCode;
}): Promise<WeGoTripProductDetail | null> {
  const payload = await weGoTripFetch<{ data?: RawProduct }>(
    `/products/${input.productId}/`,
    { currency: input.currency },
    input.locale
  );
  if (!payload?.data) return null;
  return mapWeGoTripProductDetail(payload.data);
}

export async function searchWeGoTrip(input: {
  query: string;
  locale: LocaleCode;
  currency: CurrencyCode;
}): Promise<WeGoTripSearchResult[]> {
  const term = input.query.trim();
  if (term.length < 3) return [];

  const payload = await weGoTripFetch<{ data?: { results?: RawProduct[] } }>(
    "/search/",
    { query: term, currency: input.currency },
    input.locale
  );

  const rows = payload?.data?.results ?? [];
  return rows.map((row): WeGoTripSearchResult => {
    if (row.type === "city" || (row.name && !row.title)) {
      return {
        type: "city",
        id: row.id,
        name: row.name ?? "",
        slug: row.slug ?? "",
        preview: row.preview,
        country: mapCountry(row.country),
        available: row.available,
      };
    }
    return { type: "product", ...mapWeGoTripProduct(row) };
  });
}

export function buildWeGoTripProductPageUrl(input: {
  locale: LocaleCode;
  city: WeGoTripCityRef;
  product: Pick<WeGoTripProductSummary, "id" | "slug">;
}): string {
  const host = resolveWeGoTripShopHost(input.locale);
  return `https://${host}/${input.city.slug}-d${input.city.id}/${input.product.slug}-p${input.product.id}/`;
}

export function buildWeGoTripCheckoutUrl(input: {
  locale: LocaleCode;
  product: Pick<WeGoTripProductSummary, "id" | "slug">;
}): string {
  const host = resolveWeGoTripShopHost(input.locale);
  return `https://${host}/checkout/${input.product.slug}-p${input.product.id}/booking/`;
}
