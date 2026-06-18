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
} from "@/lib/tripster/mapper";
import { mapTripsterReviewRow } from "@/lib/tripster/review-mapper";
import { isTripsterTourExperience } from "@/lib/tripster/partner-tour-utils";

type DbClient = SupabaseClient<Database>;

const DEFAULT_PAGE_SIZE = 24;

export async function fetchExcursionCities(supabase: DbClient): Promise<ExcursionCity[]> {
  const { data, error } = await supabase
    .from("tripster_cities")
    .select("id, slug, name_ru, name_en, experience_count, cover_image")
    .order("experience_count", { ascending: false });

  if (error || !data) return [];
  return data.map((row) => rowToExcursionCity(row));
}

export async function fetchExcursionCityBySlug(
  supabase: DbClient,
  citySlug: string
): Promise<ExcursionCity | null> {
  const { data, error } = await supabase
    .from("tripster_cities")
    .select("id, slug, name_ru, name_en, experience_count, cover_image")
    .eq("slug", citySlug)
    .maybeSingle();

  if (error || !data) return null;
  return rowToExcursionCity(data);
}

export async function fetchExcursionListings(
  supabase: DbClient,
  filters: ExcursionListFilters = {}
): Promise<ExcursionListResult> {
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(48, Math.max(1, filters.pageSize ?? DEFAULT_PAGE_SIZE));
  const cities = await fetchExcursionCities(supabase);

  let cityId: number | undefined;
  if (filters.citySlug) {
    const city = cities.find((c) => c.slug === filters.citySlug);
    if (!city) {
      return { items: [], total: 0, page, pageSize, cities };
    }
    cityId = city.id;
  }

  let query = supabase
    .from("tripster_experiences")
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
  const items = data
    .filter((row) => !isTripsterTourExperience(row))
    .map((row) => {
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

export async function fetchExcursionSlugs(supabase: DbClient): Promise<string[]> {
  const { data, error } = await supabase.from("tripster_experiences").select("slug, experience_type, payload");
  if (error || !data) return [];
  return data.filter((row) => !isTripsterTourExperience(row)).map((row) => row.slug);
}

export async function fetchExcursionListingsByGuideId(
  supabase: DbClient,
  guideId: number
): Promise<ExcursionListing[]> {
  const cities = await fetchExcursionCities(supabase);
  const cityMap = new Map(cities.map((city) => [city.id, city]));

  const { data, error } = await supabase
    .from("tripster_experiences")
    .select(
      "id, slug, country_id, city_id, title, tagline, rating, review_count, price_value, price_currency, price_display, duration_minutes, format, cover_image, payload"
    )
    .filter("payload->guide->>id", "eq", String(guideId))
    .order("review_count", { ascending: false });

  if (error || !data) return [];

  return data
    .filter((row) => !isTripsterTourExperience(row))
    .map((row) => {
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

export async function fetchExcursionGuideIds(supabase: DbClient): Promise<number[]> {
  const { data, error } = await supabase
    .from("tripster_experiences")
    .select("payload");

  if (error || !data) return [];

  const ids = new Set<number>();
  for (const row of data) {
    const payload = row.payload as { guide?: { id?: number } } | null;
    const guideId = payload?.guide?.id;
    if (typeof guideId === "number" && Number.isFinite(guideId)) {
      ids.add(guideId);
    }
  }

  return [...ids].sort((a, b) => a - b);
}

export async function fetchExcursionReviews(
  supabase: DbClient,
  experienceId: number
): Promise<import("@/types/excursion").ExcursionReview[]> {
  const { data, error } = await supabase
    .from("tripster_reviews")
    .select("id, rating, author_name, review_text, created_at, payload")
    .eq("experience_id", experienceId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];

  return data.map((row) => mapTripsterReviewRow(row));
}

export async function fetchSimilarExcursionListings(
  supabase: DbClient,
  input: { cityId: number; excludeId: number; limit?: number }
): Promise<ExcursionListing[]> {
  const limit = Math.min(6, Math.max(1, input.limit ?? 6));
  const cities = await fetchExcursionCities(supabase);
  const cityMap = new Map(cities.map((city) => [city.id, city]));

  const { data, error } = await supabase
    .from("tripster_experiences")
    .select(
      "id, slug, country_id, city_id, title, tagline, rating, review_count, price_value, price_currency, price_display, duration_minutes, format, cover_image, payload"
    )
    .eq("city_id", input.cityId)
    .neq("id", input.excludeId)
    .order("review_count", { ascending: false })
    .limit(limit);

  if (error || !data) return [];

  return data
    .filter((row) => !isTripsterTourExperience(row))
    .map((row) => {
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

export async function fetchExcursionBySlug(
  supabase: DbClient,
  slug: string
): Promise<ExcursionDetail | null> {
  const { data, error } = await supabase
    .from("tripster_experiences")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  if (isTripsterTourExperience(data)) return null;

  const { data: city } = await supabase
    .from("tripster_cities")
    .select("id, slug, name_ru, name_en, experience_count, cover_image")
    .eq("id", data.city_id)
    .maybeSingle();

  const detail = rowToExcursionDetail(data, city);
  const reviews = await fetchExcursionReviews(supabase, data.id);
  return { ...detail, reviews };
}

export async function fetchExcursionListingBySlug(
  supabase: DbClient,
  slug: string
): Promise<ExcursionListing | null> {
  const detail = await fetchExcursionBySlug(supabase, slug);
  if (!detail) return null;

  return {
    id: detail.id,
    partner: detail.partner,
    slug: detail.slug,
    title: detail.title,
    tagline: detail.tagline,
    cityId: detail.cityId,
    citySlug: detail.citySlug,
    cityName: detail.cityName,
    coverImage: detail.coverImage,
    rating: detail.rating,
    reviewCount: detail.reviewCount,
    priceValue: detail.priceValue,
    priceCurrency: detail.priceCurrency,
    priceDisplay: detail.priceDisplay,
    durationMinutes: detail.durationMinutes,
    format: detail.format,
  };
}

export async function fetchExperienceForAffiliate(
  supabase: DbClient,
  slug: string
): Promise<{
  id: number;
  slug: string;
  tripster_url: string;
  partner_url: string | null;
  city_id: number;
} | null> {
  const { data, error } = await supabase
    .from("tripster_experiences")
    .select("id, slug, tripster_url, partner_url, city_id")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

export async function updateExperiencePartnerUrl(
  supabase: DbClient,
  experienceId: number,
  partnerUrl: string
): Promise<void> {
  await supabase
    .from("tripster_experiences")
    .update({ partner_url: partnerUrl })
    .eq("id", experienceId);
}

export async function logAffiliateClick(
  supabase: DbClient,
  input: {
    experienceId?: number;
    experienceSlug: string;
    partnerUrl: string;
    referer?: string;
    userAgent?: string;
  }
): Promise<void> {
  await supabase.from("affiliate_link_clicks").insert({
    experience_id: input.experienceId ?? null,
    experience_slug: input.experienceSlug,
    partner_url: input.partnerUrl,
    referer: input.referer ?? null,
    user_agent: input.userAgent ?? null,
  });
}
