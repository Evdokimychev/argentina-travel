import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type {
  ExcursionCity,
  ExcursionDetail,
  ExcursionListFilters,
  ExcursionListResult,
  ExcursionListing,
} from "@/types/excursion";
import {
  rowToExcursionCity,
  rowToExcursionDetail,
  rowToExcursionListing,
  mapSputnik8ReviewRow,
} from "@/lib/sputnik8/mapper";
import { enrichSputnik8ExcursionDetail } from "@/lib/sputnik8/detail-enrichment";

type DbClient = SupabaseClient<Database>;

const DEFAULT_PAGE_SIZE = 24;

export async function fetchSputnik8ExcursionCities(supabase: DbClient): Promise<ExcursionCity[]> {
  const { data, error } = await supabase
    .from("sputnik8_cities")
    .select("id, slug, name_ru, name_en, experience_count, cover_image")
    .order("experience_count", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToExcursionCity(row));
}

export async function fetchSputnik8ExcursionCityBySlug(
  supabase: DbClient,
  citySlug: string
): Promise<ExcursionCity | null> {
  const cities = await fetchSputnik8ExcursionCities(supabase);
  return cities.find((city) => city.slug === citySlug) ?? null;
}

export async function fetchSputnik8ExcursionListings(
  supabase: DbClient,
  filters: ExcursionListFilters = {}
): Promise<ExcursionListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const cities = await fetchSputnik8ExcursionCities(supabase);

  let cityId: number | undefined;
  if (filters.citySlug) {
    const city = cities.find((c) => c.slug === filters.citySlug);
    if (!city) {
      return { items: [], total: 0, page, pageSize, cities };
    }
    cityId = city.id;
  }

  let query = supabase
    .from("sputnik8_products")
    .select(
      "id, slug, country_id, city_id, title, tagline, rating, review_count, price_value, price_currency, price_display, duration_minutes, format, cover_image, payload",
      { count: "exact" }
    );

  if (cityId != null) {
    query = query.eq("city_id", cityId);
  }

  const queryText = filters.query?.trim();
  if (queryText) {
    query = query.or(`title.ilike.%${queryText}%,tagline.ilike.%${queryText}%`);
  }

  if (filters.minPrice != null) {
    query = query.gte("price_value", filters.minPrice);
  }
  if (filters.maxPrice != null) {
    query = query.lte("price_value", filters.maxPrice);
  }

  switch (filters.sort) {
    case "rating":
      query = query.order("rating", { ascending: false, nullsFirst: false });
      break;
    case "price_asc":
      query = query.order("price_value", { ascending: true, nullsFirst: false });
      break;
    case "price_desc":
      query = query.order("price_value", { ascending: false, nullsFirst: false });
      break;
    default:
      query = query.order("review_count", { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await query.range(from, to);

  if (error || !data) {
    return { items: [], total: 0, page, pageSize, cities };
  }

  const cityMap = new Map(cities.map((city) => [city.id, city]));
  const items = data.map((row) => {
    const city = cityMap.get(row.city_id);
    const cityRow = city
      ? {
          id: city.id,
          slug: city.slug,
          name_ru: city.name,
          name_en: null,
          experience_count: city.experienceCount,
          cover_image: city.coverImage ?? null,
        }
      : null;
    return rowToExcursionListing(row, cityRow);
  });

  return {
    items,
    total: count ?? items.length,
    page,
    pageSize,
    cities,
  };
}

export async function fetchSputnik8ExcursionSlugs(supabase: DbClient): Promise<string[]> {
  const { data, error } = await supabase.from("sputnik8_products").select("slug");
  if (error || !data) return [];
  return data.map((row) => row.slug);
}

export async function fetchSimilarSputnik8ExcursionListings(
  supabase: DbClient,
  input: { cityId: number; excludeId: number; limit?: number }
): Promise<ExcursionListing[]> {
  const limit = Math.min(6, Math.max(1, input.limit ?? 6));
  const cities = await fetchSputnik8ExcursionCities(supabase);
  const cityMap = new Map(cities.map((city) => [city.id, city]));

  const { data, error } = await supabase
    .from("sputnik8_products")
    .select(
      "id, slug, country_id, city_id, title, tagline, rating, review_count, price_value, price_currency, price_display, duration_minutes, format, cover_image, payload"
    )
    .eq("city_id", input.cityId)
    .neq("id", input.excludeId)
    .order("review_count", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data.map((row) => {
    const city = cityMap.get(row.city_id);
    const cityRow = city
      ? {
          id: city.id,
          slug: city.slug,
          name_ru: city.name,
          name_en: null,
          experience_count: city.experienceCount,
          cover_image: city.coverImage ?? null,
        }
      : null;
    return rowToExcursionListing(row, cityRow);
  });
}

export async function fetchSputnik8ExcursionBySlug(
  supabase: DbClient,
  slug: string
): Promise<ExcursionDetail | null> {
  const { data, error } = await supabase
    .from("sputnik8_products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const { data: city } = await supabase
    .from("sputnik8_cities")
    .select("id, slug, name_ru, name_en, experience_count, cover_image")
    .eq("id", data.city_id)
    .maybeSingle();

  const detail = rowToExcursionDetail(data, city);
  const enriched = await enrichSputnik8ExcursionDetail(detail, data.id, data.payload, city);
  const reviews = await fetchSputnik8ExcursionReviews(supabase, data.id);
  const mergedReviews =
    reviews.length > 0
      ? reviews
      : enriched.reviews && enriched.reviews.length > 0
        ? enriched.reviews
        : reviews;
  return { ...enriched, reviews: mergedReviews };
}

export async function fetchSputnik8ExcursionReviews(
  supabase: DbClient,
  productId: number
): Promise<import("@/types/excursion").ExcursionReview[]> {
  const { data, error } = await supabase
    .from("sputnik8_reviews")
    .select("id, rating, author_name, review_text, created_at, payload")
    .eq("product_id", productId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data.map((row) => mapSputnik8ReviewRow(row));
}

export async function fetchSputnik8ProductForAffiliate(
  supabase: DbClient,
  slug: string
): Promise<{
  id: number;
  slug: string;
  sputnik8_url: string;
  partner_url: string | null;
  city_id: number;
} | null> {
  const { data, error } = await supabase
    .from("sputnik8_products")
    .select("id, slug, sputnik8_url, partner_url, city_id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function updateSputnik8ProductPartnerUrl(
  supabase: DbClient,
  productId: number,
  partnerUrl: string
): Promise<void> {
  await supabase
    .from("sputnik8_products")
    .update({ partner_url: partnerUrl })
    .eq("id", productId);
}

export async function logSputnik8AffiliateClick(
  supabase: DbClient,
  input: {
    productId?: number;
    experienceSlug: string;
    partnerUrl: string;
    referer?: string;
    userAgent?: string;
  }
): Promise<void> {
  await supabase.from("affiliate_link_clicks").insert({
    experience_id: input.productId ?? null,
    experience_slug: input.experienceSlug,
    partner_url: input.partnerUrl,
    referer: input.referer ?? null,
    user_agent: input.userAgent ?? null,
  });
}
