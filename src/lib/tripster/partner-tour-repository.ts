import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  partnerTourRowToDetail,
  partnerTourRowToListing,
  type PartnerTourExperienceRow,
} from "@/lib/tripster/partner-tour-mapper";
import { isTripsterTourExperience } from "@/lib/tripster/partner-tour-utils";
import { isPartnerTourExperiencePublishable } from "@/lib/tripster/partner-tour-visibility";
import type { TourDetail, TourListing } from "@/types";

type DbClient = SupabaseClient<Database>;

type CityRow = {
  id: number;
  slug: string;
  name_ru: string | null;
  name_en: string | null;
  experience_count: number;
  cover_image: string | null;
};

const LISTING_COLUMNS =
  "id, slug, country_id, city_id, title, tagline, annotation, description, status, experience_type, format, duration_minutes, rating, review_count, price_value, price_currency, price_display, tripster_url, partner_url, cover_image, photos, payload";

async function loadCityMap(supabase: DbClient): Promise<Map<number, CityRow>> {
  const { data } = await supabase
    .from("tripster_cities")
    .select("id, slug, name_ru, name_en, experience_count, cover_image")
    .order("experience_count", { ascending: false });

  const map = new Map<number, CityRow>();
  for (const row of data ?? []) {
    map.set(row.id, row);
  }
  return map;
}

export async function fetchPartnerTourListings(supabase: DbClient): Promise<TourListing[]> {
  const { data, error } = await supabase
    .from("tripster_experiences")
    .select(LISTING_COLUMNS)
    .or("experience_type.eq.tour,payload->>type.eq.tour")
    .order("review_count", { ascending: false });

  if (error || !data?.length) {
    const fallback = await supabase
      .from("tripster_experiences")
      .select(LISTING_COLUMNS)
      .order("review_count", { ascending: false });

    if (fallback.error || !fallback.data) return [];

    const cityMap = await loadCityMap(supabase);
    return fallback.data
      .filter((row) => isTripsterTourExperience(row))
      .filter((row) => isPartnerTourExperiencePublishable(row as PartnerTourExperienceRow))
      .map((row) => {
        const city = cityMap.get(row.city_id) ?? null;
        return partnerTourRowToListing(row as PartnerTourExperienceRow, city);
      });
  }

  const cityMap = await loadCityMap(supabase);
  return data
    .filter((row) => isTripsterTourExperience(row))
    .filter((row) => isPartnerTourExperiencePublishable(row as PartnerTourExperienceRow))
    .map((row) => {
      const city = cityMap.get(row.city_id) ?? null;
      return partnerTourRowToListing(row as PartnerTourExperienceRow, city);
    });
}

export async function fetchPartnerTourDetail(
  supabase: DbClient,
  slug: string
): Promise<TourDetail | null> {
  const { data, error } = await supabase
    .from("tripster_experiences")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data || !isTripsterTourExperience(data)) return null;
  if (!isPartnerTourExperiencePublishable(data as PartnerTourExperienceRow)) return null;

  const { data: city } = await supabase
    .from("tripster_cities")
    .select("id, slug, name_ru, name_en, experience_count, cover_image")
    .eq("id", data.city_id)
    .maybeSingle();

  const { data: reviews } = await supabase
    .from("tripster_reviews")
    .select("id, rating, author_name, review_text, created_at, payload")
    .eq("experience_id", data.id)
    .order("created_at", { ascending: false })
    .limit(50);

  return partnerTourRowToDetail(data as PartnerTourExperienceRow, city, {
    reviews: reviews ?? [],
  });
}

export async function fetchPartnerTourSlugs(supabase: DbClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("tripster_experiences")
    .select("slug, experience_type, payload")
    .or("experience_type.eq.tour,payload->>type.eq.tour");

  if (error || !data?.length) {
    const fallback = await supabase.from("tripster_experiences").select("slug, experience_type, payload");
    if (fallback.error || !fallback.data) return [];
    return fallback.data
      .filter((row) => isTripsterTourExperience(row))
      .filter((row) => isPartnerTourExperiencePublishable(row as PartnerTourExperienceRow))
      .map((row) => row.slug);
  }

  return data
    .filter((row) => isTripsterTourExperience(row))
    .filter((row) => isPartnerTourExperiencePublishable(row as PartnerTourExperienceRow))
    .map((row) => row.slug);
}
