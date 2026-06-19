import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { TouristReview, TouristReviewStatus } from "@/types/tourist";
import type { TourReview } from "@/types";
import { getOrganizerTourOwnerId } from "@/lib/organizer-tour-store";
import { sendReviewModerationEmail } from "@/lib/notifications/email-delivery";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_ORGANIZER_OWNER_ID } from "@/types/user";
import {
  reviewToRow,
  rowToModerationReviewSummary,
  rowToReview,
  type ModerationReviewSummary,
  type ModerationReviewReportSummary,
  type TouristReviewRow,
} from "@/lib/reviews-db-mapper";

type DbClient = SupabaseClient<Database>;
type ProfilePublicRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "first_name" | "last_name" | "avatar_url"
>;
type ProfileIdentityRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "first_name" | "last_name" | "email"
>;

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

function normalizeReviewDate(value?: string): string {
  if (!value?.trim()) return "";
  const trimmed = value.trim();
  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return "";
  return trimmed;
}

function resolvePublicAuthorName(profile?: ProfilePublicRow): string {
  if (!profile) return "Путешественник";
  const fullName = [profile.first_name, profile.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
    .trim();
  return fullName || profile.first_name?.trim() || "Путешественник";
}

function resolveProfileDisplayName(profile?: ProfileIdentityRow | null): string | null {
  if (!profile) return null;
  const fullName = [profile.first_name, profile.last_name]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ")
    .trim();

  if (fullName) return fullName;
  if (profile.first_name?.trim()) return profile.first_name.trim();
  if (profile.email?.trim()) return profile.email.trim();
  return profile.id.slice(0, 8);
}

function touristReviewToPublicReview(
  review: TouristReview,
  profile?: ProfilePublicRow
): TourReview {
  return {
    id: review.id,
    author: resolvePublicAuthorName(profile),
    avatar: profile?.avatar_url?.trim() || "",
    rating: review.rating,
    date: normalizeReviewDate(review.createdAt),
    tripDate: normalizeReviewDate(review.tripDate),
    text: review.text,
    photos: review.photos,
    verifiedTrip: Boolean(review.bookingId),
    source: "platform",
    organizerReply: review.organizerReply?.trim() || undefined,
    organizerRepliedAt: normalizeReviewDate(review.organizerRepliedAt) || undefined,
  };
}

async function fetchProfilesByUserIds(
  supabase: DbClient,
  userIds: string[]
): Promise<Map<string, ProfilePublicRow>> {
  const profileMap = new Map<string, ProfilePublicRow>();
  if (!userIds.length) return profileMap;

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, first_name, last_name, avatar_url")
    .in("id", userIds);

  if (error || !profiles?.length) return profileMap;

  for (const profile of profiles as ProfilePublicRow[]) {
    profileMap.set(profile.id, profile);
  }

  return profileMap;
}

export async function fetchTourPublicReviews(tourSlug: string): Promise<TourReview[]> {
  const normalizedSlug = tourSlug.trim();
  if (!normalizedSlug) return [];

  let supabase: DbClient;
  try {
    supabase = createSupabaseAdminClient();
  } catch {
    return [];
  }

  const reviews = await fetchPublishedReviewsByTourSlug(supabase, normalizedSlug);
  if (!reviews.length) return [];

  const userIds = [
    ...new Set(
      reviews.map((review) => review.userId).filter((userId): userId is string => Boolean(userId))
    ),
  ];
  const profilesByUserId = await fetchProfilesByUserIds(supabase, userIds);

  return reviews.map((review) =>
    touristReviewToPublicReview(review, profilesByUserId.get(review.userId))
  );
}

export async function updateOrganizerReviewReply(
  supabase: DbClient,
  input: {
    reviewId: string;
    organizerUserId: string;
    organizerTourSlugs: string[];
    replyText: string;
  }
): Promise<{ review: TouristReview } | { error: string }> {
  const reply = input.replyText.trim();
  if (!reply) {
    return { error: "Введите текст ответа для туриста" };
  }
  if (reply.length > 3000) {
    return { error: "Ответ слишком длинный (максимум 3000 символов)" };
  }

  const { data: existing, error: fetchError } = await supabase
    .from("tourist_reviews")
    .select("*")
    .eq("id", input.reviewId)
    .maybeSingle();

  if (fetchError || !existing) return { error: "Отзыв не найден" };

  const current = existing as TouristReviewRow;
  if (current.status !== "published") {
    return { error: "Можно отвечать только на опубликованные отзывы" };
  }

  const canManageReview =
    current.organizer_user_id === input.organizerUserId ||
    input.organizerTourSlugs.includes(current.tour_slug);
  if (!canManageReview) {
    return { error: "Нет доступа" };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("tourist_reviews")
    .update({
      organizer_reply: reply,
      organizer_replied_at: now,
      organizer_replied_by: input.organizerUserId,
      updated_at: now,
    })
    .eq("id", input.reviewId)
    .select("*")
    .maybeSingle();

  if (error || !data) return { error: error?.message ?? "Не удалось сохранить ответ" };

  return { review: rowToReview(data as TouristReviewRow) };
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
  | {
      ok: true;
      reviewId: string;
      tourTitle: string;
      tourSlug: string;
      rating: number;
      reviewText: string;
      tripDate: string | null;
      authorEmail: string | null;
      authorName: string | null;
      authorUserId: string | null;
      organizerEmail: string | null;
      organizerName: string | null;
      organizerUserId: string | null;
    }
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
    .select("tour_title, tour_slug, rating, review_text, trip_date, user_id, organizer_user_id")
    .maybeSingle();

  if (error || !row) return { error: error?.message ?? "Отзыв не найден" };

  let authorProfile: ProfileIdentityRow | null = null;
  let authorEmail: string | null = null;
  if (row.user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("id", row.user_id)
      .maybeSingle();
    authorProfile = (profile as ProfileIdentityRow | null) ?? null;
    authorEmail = authorProfile?.email ?? null;
  }

  let organizerProfile: ProfileIdentityRow | null = null;
  let organizerEmail: string | null = null;
  if (row.organizer_user_id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .eq("id", row.organizer_user_id)
      .maybeSingle();
    organizerProfile = (profile as ProfileIdentityRow | null) ?? null;
    organizerEmail = organizerProfile?.email ?? null;
  }

  try {
    await sendReviewModerationEmail({
      userId: row.user_id,
      touristEmail: authorEmail,
      touristName: resolveProfileDisplayName(authorProfile),
      tourTitle: row.tour_title,
      tourSlug: row.tour_slug,
      action,
      note,
    });
  } catch {
    // Non-blocking notification channel.
  }

  return {
    ok: true,
    reviewId,
    tourTitle: row.tour_title,
    tourSlug: row.tour_slug,
    rating: row.rating,
    reviewText: row.review_text,
    tripDate: row.trip_date,
    authorEmail,
    authorName: resolveProfileDisplayName(authorProfile),
    authorUserId: row.user_id,
    organizerEmail,
    organizerName: resolveProfileDisplayName(organizerProfile),
    organizerUserId: row.organizer_user_id,
  };
}

const REVIEW_REPORT_REASON_LABELS: Record<string, string> = {
  spam: "Спам",
  offensive: "Оскорбления",
  fake: "Подозрение на фальсификацию",
  irrelevant: "Не относится к туру",
  other: "Другое",
};

type ReviewReportRow = Database["public"]["Tables"]["review_reports"]["Row"];

export async function submitReviewReport(
  supabase: DbClient,
  input: {
    reviewId: string;
    reporterUserId: string;
    reason: string;
    details?: string;
  }
): Promise<{ reportId: string } | { error: string }> {
  const { data: review, error: reviewError } = await supabase
    .from("tourist_reviews")
    .select("id, status, tour_title, tour_slug, rating, review_text")
    .eq("id", input.reviewId)
    .maybeSingle();

  if (reviewError || !review) return { error: "Отзыв не найден" };
  if (review.status !== "published") {
    return { error: "Пожаловаться можно только на опубликованный отзыв" };
  }

  const { data: existing } = await supabase
    .from("review_reports")
    .select("id")
    .eq("review_id", input.reviewId)
    .eq("reporter_user_id", input.reporterUserId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    return { error: "Вы уже отправили жалобу на этот отзыв" };
  }

  const { data: report, error: insertError } = await supabase
    .from("review_reports")
    .insert({
      review_id: input.reviewId,
      reporter_user_id: input.reporterUserId,
      reason: input.reason,
      details: input.details?.trim() || null,
      status: "pending",
    })
    .select("id")
    .maybeSingle();

  if (insertError || !report) {
    return { error: insertError?.message ?? "Не удалось отправить жалобу" };
  }

  const reasonLabel = REVIEW_REPORT_REASON_LABELS[input.reason] ?? input.reason;
  await supabase.from("moderation_queue").upsert(
    {
      entity_type: "review_report",
      entity_id: report.id,
      status: "pending",
      reason: `Жалоба на отзыв: ${reasonLabel}`,
      submitted_by: input.reporterUserId,
      metadata: {
        reviewId: input.reviewId,
        tourTitle: review.tour_title,
        tourSlug: review.tour_slug,
        rating: review.rating,
        reason: input.reason,
        reasonLabel,
        details: input.details?.trim() || null,
      } as Json,
    },
    { onConflict: "entity_type,entity_id" }
  );

  return { reportId: report.id };
}

export async function fetchModerationReviewReportSummaries(
  supabase: DbClient,
  reportIds: string[]
): Promise<Map<string, ModerationReviewReportSummary>> {
  const map = new Map<string, ModerationReviewReportSummary>();
  if (!reportIds.length) return map;

  const { data: rows, error } = await supabase
    .from("review_reports")
    .select("*")
    .in("id", reportIds);

  if (error || !rows?.length) return map;

  const reviewIds = [...new Set((rows as ReviewReportRow[]).map((row) => row.review_id))];
  const reporterIds = [
    ...new Set(
      (rows as ReviewReportRow[])
        .map((row) => row.reporter_user_id)
        .filter((id): id is string => Boolean(id))
    ),
  ];

  const reviewsById = new Map<string, TouristReviewRow>();
  if (reviewIds.length) {
    const { data: reviewRows } = await supabase
      .from("tourist_reviews")
      .select("*")
      .in("id", reviewIds);
    for (const row of reviewRows ?? []) {
      reviewsById.set(row.id, row as TouristReviewRow);
    }
  }

  const namesByUserId = new Map<string, string>();
  if (reporterIds.length) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email")
      .in("id", reporterIds);
    for (const profile of profiles ?? []) {
      const label =
        [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() ||
        profile.email?.trim() ||
        profile.id.slice(0, 8);
      namesByUserId.set(profile.id, label);
    }
  }

  for (const row of rows as ReviewReportRow[]) {
    const review = reviewsById.get(row.review_id);
    map.set(row.id, {
      id: row.id,
      reviewId: row.review_id,
      reason: row.reason,
      details: row.details,
      reporterUserId: row.reporter_user_id,
      reporterName: row.reporter_user_id ? namesByUserId.get(row.reporter_user_id) ?? null : null,
      reviewTourTitle: review?.tour_title ?? "",
      reviewTourSlug: review?.tour_slug ?? "",
      reviewRating: review?.rating ?? 0,
      reviewText: review?.review_text ?? "",
      createdAt: row.created_at,
    });
  }

  return map;
}

export async function resolveReviewReportModeration(
  supabase: DbClient,
  reportId: string,
  action: "approve" | "reject",
  actorUserId: string
): Promise<{ ok: true } | { error: string }> {
  const nextStatus = action === "approve" ? "resolved" : "dismissed";
  const now = new Date().toISOString();

  const { data: report, error } = await supabase
    .from("review_reports")
    .update({
      status: nextStatus,
      resolved_by: actorUserId,
      resolved_at: now,
    })
    .eq("id", reportId)
    .select("review_id")
    .maybeSingle();

  if (error || !report) return { error: error?.message ?? "Жалоба не найдена" };

  if (action === "approve") {
    await supabase
      .from("tourist_reviews")
      .update({
        status: "rejected",
        moderation_notes: "Скрыт по жалобе пользователя",
        moderated_by: actorUserId,
        moderated_at: now,
      })
      .eq("id", report.review_id);
  }

  return { ok: true };
}
