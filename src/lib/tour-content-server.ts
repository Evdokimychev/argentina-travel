import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TourListing } from "@/types";
import type { Tour } from "@/types/tour";
import type { TourContentAdminSummary } from "@/types/tour-content";
import {
  rowToAdminSummary,
  rowToTour,
  rowToTourDetail,
  rowToTourListing,
  tourToContentRow,
} from "@/lib/tour-content-mapper";
type DbClient = SupabaseClient<Database>;

export async function fetchPublishedListings(supabase: DbClient): Promise<TourListing[]> {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("status", "published")
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error || !data) return [];

  return data
    .map((row) => rowToTourListing(row))
    .filter((listing): listing is TourListing => listing != null);
}

export async function fetchPublishedSlugs(supabase: DbClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("tours")
    .select("slug")
    .eq("status", "published");

  if (error || !data) return [];
  return data.map((row) => row.slug);
}

export async function fetchTourBySlug(
  supabase: DbClient,
  slug: string
): Promise<Tour | null> {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return rowToTour(data);
}

export async function fetchTourDetailBySlug(
  supabase: DbClient,
  slug: string
) {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return rowToTourDetail(data);
}

export async function upsertTourFromCanonical(
  supabase: DbClient,
  tour: Tour,
  ownerUserId: string
): Promise<{ ok: true } | { error: string }> {
  const row = tourToContentRow(tour, ownerUserId);

  const { data: existing } = await supabase
    .from("tours")
    .select("published_at")
    .eq("slug", tour.slug)
    .maybeSingle();

  if (existing?.published_at && row.status === "published") {
    row.published_at = existing.published_at;
  }

  const { error } = await supabase.from("tours").upsert(row, { onConflict: "slug" });

  if (error) return { error: error.message };
  return { ok: true };
}

export async function deleteTourBySlug(
  supabase: DbClient,
  slug: string,
  ownerUserId: string
): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase
    .from("tours")
    .delete()
    .eq("slug", slug)
    .eq("owner_user_id", ownerUserId);

  if (error) return { error: error.message };
  return { ok: true };
}

export async function fetchAllToursAdmin(supabase: DbClient): Promise<TourContentAdminSummary[]> {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(500);

  if (error || !data) return [];
  return data.map(rowToAdminSummary);
}

async function getServerSupabase(): Promise<DbClient> {
  const { createSupabaseServerClient } = await import("@/lib/supabase/server");
  return createSupabaseServerClient();
}

export async function fetchPublishedListingsServer(): Promise<TourListing[]> {
  const supabase = await getServerSupabase();
  return fetchPublishedListings(supabase);
}

export async function fetchPublishedSlugsServer(): Promise<string[]> {
  const supabase = await getServerSupabase();
  return fetchPublishedSlugs(supabase);
}

export async function fetchTourDetailBySlugServer(slug: string) {
  const supabase = await getServerSupabase();
  return fetchTourDetailBySlug(supabase, slug);
}

export async function fetchCanonicalTourBySlugServer(slug: string): Promise<Tour | null> {
  const supabase = await getServerSupabase();
  return fetchTourBySlug(supabase, slug);
}
