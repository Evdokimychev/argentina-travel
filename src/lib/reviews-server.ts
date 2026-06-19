import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { TouristReview, TouristReviewStatus } from "@/types/tourist";
import { getOrganizerTourOwnerId } from "@/lib/organizer-tour-store";
import { DEFAULT_ORGANIZER_OWNER_ID } from "@/types/user";
import {
  reviewToRow,
  rowToModerationReviewSummary,
  rowToReview,
  type ModerationReviewSummary,
  type TouristReviewRow,
} from "@/lib/reviews-db-mapper";

type DbClient = SupabaseClient<Database>;

function resolveOrganizerUserId(input: {
  organizerTourId?: string;
  tourSlug?: string;
}): string {
  if (input.organizerTourId) {
    return getOrganizerTourOwnerId(input.organizerTourId) ?? DEFAULT_ORGANIZER_OWNER_ID;
  }
  return DEFAULT_ORGANIZER_OWNER_ID;
}

export async function fetchUserReviews(
  supabase: DbClient,
  userId: string
): Promise<TouristReview[]> {
  const { data, error } = await supabase
    .from("tourist_reviews")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as TouristReviewRow[]).map(rowToReview);
}

export async function fetchOrganizerPublishedReviews(
  supabase: DbClient,
  organizerUserId: string,
  tourSlugs: string[]
): Promise<TouristReview[]> {
  const byId = new Map<string, TouristReview>();

  const { data: ownerRows } = await supabase
    .from("tourist_reviews")
    .select("*")
    .eq("status", "published")
    .eq("organizer_user_id", organizerUserId)
    .order("created_at", { ascending: false });

  if (ownerRows?.length) {
    for (const row of ownerRows as TouristReviewRow[]) {
      byId.set(row.id, rowToReview(row));
    }
  }

  if (tourSlugs.length) {
    const { data: slugRows } = await supabase
      .from("tourist_reviews")
      .select("*")
      .eq("status", "published")
      .in("tour_slug", tourSlugs)
      .order("created_at", { ascending: false });

    if (slugRows?.length) {
      for (const row of slugRows as TouristReviewRow[]) {
        byId.set(row.id, rowToReview(row));
      }
    }
  }

  return Array.from(byId.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function fetchPublishedReviewsByTourSlug(
  supabase: DbClient,
  tourSlug: string
): Promise<TouristReview[]> {
  const { data, error } = await supabase
    .from("tourist_reviews")
    .select("*")
    .eq("tour_slug", tourSlug)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as TouristReviewRow[]).map(rowToReview);
}

export async function insertReview(
  supabase: DbClient,
  review: TouristReview,
  extras?: { organizerTourId?: string }
): Promise<{ review: TouristReview } | { error: string }> {
  const organizerUserId = resolveOrganizerUserId({
    organizerTourId: extras?.organizerTourId,
    tourSlug: review.tourSlug,
  });

  const row = reviewToRow(review, {
    organizerUserId,
    organizerTourId: extras?.organizerTourId ?? null,
  });

  const { data, error } = await supabase
    .from("tourist_reviews")
    .upsert(row, { onConflict: "id" })
    .select("*")
    .maybeSingle();

  if (error || !data) return { error: error?.message ?? "Не удалось сохранить отзыв" };
  return { review: rowToReview(data as TouristReviewRow) };
}

export async function updateReviewRecord(
  supabase: DbClient,
  reviewId: string,
  patch: Partial<TouristReview> & { status?: TouristReviewStatus },
  actorUserId: string
): Promise<{ review: TouristReview } | { error: string }> {
  const { data: existing, error: fetchError } = await supabase
    .from("tourist_reviews")
    .select("*")
    .eq("id", reviewId)
    .maybeSingle();

  if (fetchError || !existing) return { error: "Отзыв не найден" };

  const row = existing as TouristReviewRow;
  if (row.user_id !== actorUserId) return { error: "Нет доступа" };

  const nextStatus = patch.status ?? (row.status as TouristReviewStatus);
  if (!["draft", "pending", "rejected"].includes(nextStatus) && patch.status) {
    return { error: "Нельзя напрямую опубликовать отзыв" };
  }

  const now = new Date().toISOString();
  const updatePayload: Database["public"]["Tables"]["tourist_reviews"]["Update"] = {
    rating: patch.rating ?? row.rating,
    review_text: patch.text ?? row.review_text,
    photos: (patch.photos ?? parsePhotos(row.photos)) as Json,
    trip_date: patch.tripDate ?? row.trip_date,
    status: nextStatus,
    updated_at: now,
  };

  const { data, error } = await supabase
    .from("tourist_reviews")
    .update(updatePayload)
    .eq("id", reviewId)
    .select("*")
    .maybeSingle();

  if (error || !data) return { error: error?.message ?? "Ошибка обновления" };

  const updated = rowToReview(data as TouristReviewRow);

  if (nextStatus === "pending") {
    await enqueueReviewModeration(supabase, updated, actorUserId);
  }

  return { review: updated };
}

function parsePhotos(raw: Json): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string");
}

export async function enqueueReviewModeration(
  supabase: DbClient,
  review: TouristReview,
  submittedBy?: string
): Promise<void> {
  await supabase.from("moderation_queue").upsert(
    {
      entity_type: "review",
      entity_id: review.id,
      status: "pending",
      reason: "Публикация отзыва туристом",
      submitted_by: submittedBy ?? review.userId ?? null,
      metadata: {
        tourTitle: review.tourTitle,
        tourSlug: review.tourSlug,
        rating: review.rating,
        authorUserId: review.userId,
      } as Json,
    },
    { onConflict: "entity_type,entity_id" }
  );
}

export async function syncPendingReviewsToQueue(supabase: DbClient): Promise<number> {
  const { data: pendingReviews, error } = await supabase
    .from("tourist_reviews")
    .select("id, user_id, tour_slug, tour_title, rating, review_text, status")
    .eq("status", "pending")
    .limit(100);

  if (error || !pendingReviews?.length) return 0;

  let synced = 0;
  for (const row of pendingReviews as TouristReviewRow[]) {
    const review = rowToReview(row);
    await enqueueReviewModeration(supabase, review, row.user_id ?? undefined);
    synced += 1;
  }
  return synced;
}

export async function fetchModerationReviewSummaries(
  supabase: DbClient,
  reviewIds: string[]
): Promise<Map<string, ModerationReviewSummary>> {
  const map = new Map<string, ModerationReviewSummary>();
  if (!reviewIds.length) return map;

  const { data: rows, error } = await supabase
    .from("tourist_reviews")
    .select("*")
    .in("id", reviewIds);

  if (error || !rows?.length) return map;

  const userIds = [
    ...new Set(
      (rows as TouristReviewRow[])
        .map((row) => row.user_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const namesByUserId = new Map<string, string>();
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", userIds);

    for (const profile of profiles ?? []) {
      const label =
        [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
        profile.email?.trim() ||
        profile.id.slice(0, 8);
      namesByUserId.set(profile.id, label);
    }
  }

  for (const row of rows as TouristReviewRow[]) {
    const authorName = row.user_id ? namesByUserId.get(row.user_id) ?? null : null;
    map.set(row.id, rowToModerationReviewSummary(row, authorName));
  }

  return map;
}

export async function resolveReviewModeration(
  supabase: DbClient,
  reviewId: string,
  action: "approve" | "reject",
  actorUserId: string,
  note?: string
): Promise<
  | { ok: true; tourTitle: string; authorEmail: string | null }
  | { error: string }
> {
  const now = new Date().toISOString();
  const nextStatus: TouristReviewStatus = action === "approve" ? "published" : "rejected";

  const { data: row, error } = await supabase
    .from("tourist_reviews")
    .update({
      status: nextStatus,
      moderation_notes: note?.trim() || null,
      moderated_by: actorUserId,
      moderated_at: now,
    })
    .eq("id", reviewId)
    .select("tour_title, user_id")
    .maybeSingle();

  if (error || !row) return { error: error?.message ?? "Отзыв не найден" };

  let authorEmail: string | null = null;
  if (row.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", row.user_id)
      .maybeSingle();
    authorEmail = profile?.email ?? null;
  }

  return { ok: true, tourTitle: row.tour_title, authorEmail };
}
