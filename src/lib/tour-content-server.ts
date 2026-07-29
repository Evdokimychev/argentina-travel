import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TourListing } from "@/types";
import type { TourDetail } from "@/types";
import type { Tour } from "@/types/tour";
import type { TourContentAdminSummary } from "@/types/tour-content";
import {
  rowToAdminSummary,
  rowToPublicTour,
  rowToPublicTourDetail,
  rowToPublicTourListing,
  tourToContentRow,
} from "@/lib/tour-content-mapper";
import { PUBLIC_TOUR_MODERATION_STATUSES } from "@/lib/tour-content-visibility";
import {
  partnerOk,
  partnerUnavailable,
  partnerUnavailableFromError,
  type PartnerSourceResult,
} from "@/lib/partner-source-result";
type DbClient = SupabaseClient<Database>;
export type TourContentReadResult<T> = PartnerSourceResult<T>;
const PUBLIC_OR_SNAPSHOTTED_MODERATION_STATUSES = [
  ...PUBLIC_TOUR_MODERATION_STATUSES,
  "pending",
  "rejected",
] as const;

export async function fetchPublishedListingsResult(
  supabase: DbClient,
): Promise<TourContentReadResult<TourListing[]>> {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("product_type", "tour")
    .eq("status", "published")
    .in("moderation_status", [...PUBLIC_OR_SNAPSHOTTED_MODERATION_STATUSES])
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) return partnerUnavailableFromError(new Error(error.message));
  if (!data) return partnerUnavailable("malformed_payload", "Supabase tours list returned no data");

  return partnerOk(data
    .filter((row) => !rowToPublicTour(row)?.isPrivate)
    .map((row) => rowToPublicTourListing(row))
    .filter((listing): listing is TourListing => listing != null));
}

export async function fetchPublishedListings(supabase: DbClient): Promise<TourListing[]> {
  const result = await fetchPublishedListingsResult(supabase);
  return result.status === "ok" ? result.data : [];
}

export async function fetchPublishedSlugs(supabase: DbClient): Promise<string[]> {
  const { data, error } = await supabase
    .from("tours")
    .select("slug, payload, approved_payload, moderation_status")
    .eq("product_type", "tour")
    .eq("status", "published")
    .in("moderation_status", [...PUBLIC_OR_SNAPSHOTTED_MODERATION_STATUSES]);

  if (error || !data) return [];
  return data
    .filter((row) => {
      const tour = rowToPublicTour(row as import("@/types/database").TourRow);
      return Boolean(tour && !tour.isPrivate);
    })
    .map((row) => row.slug);
}

export async function fetchTourBySlug(
  supabase: DbClient,
  slug: string,
  accessToken?: string | null
): Promise<Tour | null> {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("product_type", "tour")
    .eq("slug", slug)
    .eq("status", "published")
    .in("moderation_status", [...PUBLIC_OR_SNAPSHOTTED_MODERATION_STATUSES])
    .maybeSingle();

  if (error || !data) return null;
  const tour = rowToPublicTour(data);
  if (!tour) return null;
  if (tour.isPrivate && (!accessToken || accessToken !== tour.privateAccessToken)) return null;
  return tour;
}

export async function fetchTourDetailBySlugResult(
  supabase: DbClient,
  slug: string,
  accessToken?: string | null
): Promise<TourContentReadResult<TourDetail | null>> {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("product_type", "tour")
    .eq("slug", slug)
    .eq("status", "published")
    .in("moderation_status", [...PUBLIC_OR_SNAPSHOTTED_MODERATION_STATUSES])
    .maybeSingle();

  if (error) return partnerUnavailableFromError(new Error(error.message));
  if (!data) return partnerOk(null);
  const canonical = rowToPublicTour(data);
  if (!canonical) {
    return partnerUnavailable("malformed_payload", `Published tour ${slug} cannot be mapped`);
  }
  if (canonical.isPrivate && (!accessToken || accessToken !== canonical.privateAccessToken)) {
    return partnerOk(null);
  }
  const detail = rowToPublicTourDetail(data);
  return detail
    ? partnerOk(detail)
    : partnerUnavailable("malformed_payload", `Published tour detail ${slug} cannot be mapped`);
}

export async function fetchTourDetailBySlug(
  supabase: DbClient,
  slug: string,
  accessToken?: string | null
): Promise<TourDetail | null> {
  const result = await fetchTourDetailBySlugResult(supabase, slug, accessToken);
  return result.status === "ok" ? result.data : null;
}

export async function fetchPublishedTourBookingSourceById(
  supabase: DbClient,
  tourId: string
): Promise<{ tour: TourDetail; ownerUserId: string } | null> {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("id", tourId)
    .eq("status", "published")
    .in("moderation_status", [...PUBLIC_OR_SNAPSHOTTED_MODERATION_STATUSES])
    .maybeSingle();

  if (error || !data) return null;
  const tour = rowToPublicTourDetail(data);
  if (!tour) return null;
  return { tour, ownerUserId: data.owner_user_id };
}

export async function upsertTourFromCanonical(
  supabase: DbClient,
  tour: Tour,
  ownerUserId: string,
  editorDraft?: import("@/types/organizer-tour").OrganizerTourDraft,
  options?: { bypassModeration?: boolean; moderationClient?: DbClient }
): Promise<{ ok: true } | { error: string }> {
  const row = tourToContentRow(tour, ownerUserId);
  if (editorDraft) {
    row.editor_draft = editorDraft as unknown as import("@/types/database").Json;
  }

  const { data: existing } = await supabase
    .from("tours")
    .select("published_at, moderation_status, approved_listing, approved_payload, approved_at, row_version")
    .eq("id", tour.id)
    .maybeSingle();

  if (existing?.published_at && row.status === "published") {
    row.published_at = existing.published_at;
  }

  const isPublishing = row.status === "published";
  const bypassModeration = options?.bypassModeration === true;

  row.approved_listing = existing?.approved_listing ?? null;
  row.approved_payload = existing?.approved_payload ?? null;
  row.approved_at = existing?.approved_at ?? null;
  row.row_version = existing?.row_version ?? 1;

  if (isPublishing && bypassModeration) {
    row.approved_listing = row.listing;
    row.approved_payload = row.payload;
    row.approved_at = new Date().toISOString();
  }

  if (isPublishing && !bypassModeration) {
    row.moderation_status = "pending";
    row.moderation_notes = null;
    row.moderated_by = null;
    row.moderated_at = null;
  } else if (!isPublishing && existing?.moderation_status === "pending") {
    row.moderation_status = "none";
    row.moderation_notes = null;
    row.moderated_by = null;
    row.moderated_at = null;
  } else if (existing?.moderation_status) {
    row.moderation_status = existing.moderation_status;
  }

  const { error } = await supabase.from("tours").upsert(row, { onConflict: "id" });

  if (error) return { error: error.message };

  if (isPublishing && !bypassModeration) {
    const { enqueueTourModeration } = await import("@/lib/admin/moderation-server");
    const moderationResult = await enqueueTourModeration(options?.moderationClient ?? supabase, row.id, {
      slug: tour.slug,
      title: tour.title,
      ownerUserId,
      productType: tour.type,
    });
    if ("error" in moderationResult) return moderationResult;
  }

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

export async function fetchAllToursAdmin(
  supabase: DbClient,
  options: {
    limit?: number;
    offset?: number;
    status?: "draft" | "published" | "archived";
    productType?: "tour" | "excursion";
  } = {}
): Promise<{ tours: TourContentAdminSummary[]; total: number; error?: "unavailable" }> {
  const limit = Math.min(100, Math.max(1, options.limit ?? 50));
  const offset = Math.max(0, options.offset ?? 0);
  let query = supabase
    .from("tours")
    .select("*", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (options.status) query = query.eq("status", options.status);
  if (options.productType) query = query.eq("product_type", options.productType);
  const { data, error, count } = await query;

  if (error || !data) return { tours: [], total: 0, error: "unavailable" };
  return { tours: data.map(rowToAdminSummary), total: count ?? data.length };
}

export async function fetchPublishedExcursionListingsResult(
  supabase: DbClient
): Promise<TourContentReadResult<TourListing[]>> {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("product_type", "excursion")
    .eq("status", "published")
    .in("moderation_status", [...PUBLIC_OR_SNAPSHOTTED_MODERATION_STATUSES])
    .order("published_at", { ascending: false, nullsFirst: false });

  if (error) return partnerUnavailableFromError(new Error(error.message));
  if (!data) {
    return partnerUnavailable("malformed_payload", "Supabase excursion list returned no data");
  }
  return partnerOk(data
    .filter((row) => !rowToPublicTour(row)?.isPrivate)
    .map((row) => rowToPublicTourListing(row))
    .filter((listing): listing is TourListing => listing != null));
}

export async function fetchPublishedExcursionListings(
  supabase: DbClient
): Promise<TourListing[]> {
  const result = await fetchPublishedExcursionListingsResult(supabase);
  return result.status === "ok" ? result.data : [];
}

export async function fetchPublishedExcursionBySlugResult(
  supabase: DbClient,
  slug: string,
  accessToken?: string | null
): Promise<TourContentReadResult<{ canonical: Tour; detail: TourDetail } | null>> {
  const { data, error } = await supabase
    .from("tours")
    .select("*")
    .eq("slug", slug)
    .eq("product_type", "excursion")
    .eq("status", "published")
    .in("moderation_status", [...PUBLIC_OR_SNAPSHOTTED_MODERATION_STATUSES])
    .maybeSingle();

  if (error) return partnerUnavailableFromError(new Error(error.message));
  if (!data) return partnerOk(null);
  const canonical = rowToPublicTour(data);
  const detail = rowToPublicTourDetail(data);
  if (canonical?.isPrivate && (!accessToken || accessToken !== canonical.privateAccessToken)) {
    return partnerOk(null);
  }
  return canonical && detail
    ? partnerOk({ canonical, detail })
    : partnerUnavailable("malformed_payload", `Published excursion ${slug} cannot be mapped`);
}

export async function fetchPublishedExcursionBySlug(
  supabase: DbClient,
  slug: string,
  accessToken?: string | null
): Promise<{ canonical: Tour; detail: TourDetail } | null> {
  const result = await fetchPublishedExcursionBySlugResult(supabase, slug, accessToken);
  return result.status === "ok" ? result.data : null;
}

export async function fetchPublishedExcursionListingsServer(): Promise<TourListing[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  return fetchPublishedExcursionListings(supabase);
}

export async function fetchPublishedExcursionBySlugServer(
  slug: string,
  opts?: { accessToken?: string | null }
) {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  return fetchPublishedExcursionBySlug(supabase, slug, opts?.accessToken);
}

async function getServerSupabase(): Promise<DbClient | null> {
  const result = await getServerSupabaseResult();
  return result.status === "ok" ? result.data : null;
}

async function getServerSupabaseResult(): Promise<TourContentReadResult<DbClient>> {
  try {
    const { createSupabaseAdminClient } = await import("@/lib/supabase/admin");
    return partnerOk(createSupabaseAdminClient());
  } catch (error) {
    return partnerUnavailableFromError(error);
  }
}

export async function fetchPublishedListingsServer(): Promise<TourListing[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  return fetchPublishedListings(supabase);
}

export async function fetchPublishedListingsResultServer(): Promise<
  TourContentReadResult<TourListing[]>
> {
  const client = await getServerSupabaseResult();
  if (client.status === "unavailable") return client;
  return fetchPublishedListingsResult(client.data);
}

export async function fetchPublishedTourBookingSourceByIdServer(tourId: string) {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  return fetchPublishedTourBookingSourceById(supabase, tourId);
}

export async function fetchPublishedSlugsServer(): Promise<string[]> {
  const supabase = await getServerSupabase();
  if (!supabase) return [];
  return fetchPublishedSlugs(supabase);
}

export async function fetchTourDetailBySlugServer(
  slug: string,
  opts?: { accessToken?: string | null }
) {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  return fetchTourDetailBySlug(supabase, slug, opts?.accessToken);
}

export async function fetchTourDetailBySlugResultServer(
  slug: string,
  opts?: { accessToken?: string | null }
): Promise<TourContentReadResult<TourDetail | null>> {
  const client = await getServerSupabaseResult();
  if (client.status === "unavailable") return client;
  return fetchTourDetailBySlugResult(client.data, slug, opts?.accessToken);
}

export async function fetchCanonicalTourBySlugServer(
  slug: string,
  opts?: { accessToken?: string | null }
): Promise<Tour | null> {
  const supabase = await getServerSupabase();
  if (!supabase) return null;
  return fetchTourBySlug(supabase, slug, opts?.accessToken);
}
