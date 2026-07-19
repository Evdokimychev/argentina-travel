import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { TourContentAdminSummary } from "@/types/tour-content";
import {
  sendOrganizerNewReviewEmail,
  sendReviewModerationEmail,
} from "@/lib/notifications/email-delivery";
import { notifyReviewApprovedInApp } from "@/lib/notifications/event-emitters";
import type { ModerationReviewSummary, ModerationReviewReportSummary } from "@/lib/reviews-db-mapper";
import {
  fetchModerationReviewSummaries,
  fetchModerationReviewReportSummaries,
} from "@/lib/reviews-server";
import {
  fetchForumPostModerationSummaries,
  type ForumPostModerationSummary,
} from "@/lib/forum/forum-server";
import {
  fetchBlogCommentReportModerationSummaries,
  resolveBlogCommentReportModeration,
  type BlogCommentReportModerationAction,
  type BlogCommentReportModerationSummary,
} from "@/lib/blog-comments-server";

function metadataString(metadata: Json | null, key: string): string | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return undefined;
  const value = metadata[key];
  return typeof value === "string" ? value : undefined;
}

type DbClient = SupabaseClient<Database>;

export type ModerationQueueItem = {
  id: string;
  entityType: string;
  entityId: string;
  status: string;
  priority: number;
  reason: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  queueVersion: number;
  entityVersion: number | null;
  entityStatus: string | null;
  relatedVersion: number | null;
  relatedStatus: string | null;
  tour?: TourContentAdminSummary | null;
  review?: ModerationReviewSummary | null;
  reviewReport?: ModerationReviewReportSummary | null;
  forumPost?: ForumPostModerationSummary | null;
  blogCommentReport?: BlogCommentReportModerationSummary | null;
};

export type ModerationResolveAction =
  | "approve"
  | "reject"
  | BlogCommentReportModerationAction;

export type ModerationExpectedState = {
  queueStatus?: string;
  queueVersion?: number;
  entityStatus?: string;
  entityVersion?: number;
  relatedStatus?: string;
  relatedVersion?: number;
  reportStatus?: string;
  commentStatus?: string;
  ipAddress?: string | null;
};

export async function syncPendingToursToQueue(supabase: DbClient): Promise<number> {
  const { data: queuedTourItems } = await supabase
    .from("moderation_queue")
    .select("id, entity_id")
    .eq("entity_type", "tour")
    .in("status", ["pending", "in_review"])
    .limit(200);

  if (queuedTourItems?.length) {
    const ids = queuedTourItems.map((item) => item.entity_id);
    const { data: currentTours } = await supabase
      .from("tours")
      .select("id, moderation_status")
      .in("id", ids);
    const pendingIds = new Set(
      (currentTours ?? [])
        .filter((tour) => tour.moderation_status === "pending")
        .map((tour) => tour.id)
    );
    const staleQueueIds = queuedTourItems
      .filter((item) => !pendingIds.has(item.entity_id))
      .map((item) => item.id);
    if (staleQueueIds.length) {
      await supabase
        .from("moderation_queue")
        .update({ status: "cancelled", resolved_at: new Date().toISOString() })
        .in("id", staleQueueIds);
    }
  }

  const { data: pendingTours, error } = await supabase
    .from("tours")
    .select("id, slug, title, owner_user_id, product_type, status, moderation_status, updated_at")
    .eq("moderation_status", "pending")
    .limit(100);

  if (error || !pendingTours?.length) return 0;

  let synced = 0;
  for (const tour of pendingTours) {
    const { error: upsertError } = await supabase.from("moderation_queue").upsert(
      {
        entity_type: "tour",
        entity_id: tour.id,
        status: "pending",
        reason:
          tour.product_type === "excursion"
            ? "Публикация экскурсии организатором"
            : "Публикация тура организатором",
        metadata: {
          slug: tour.slug,
          title: tour.title,
          ownerUserId: tour.owner_user_id,
          productType: tour.product_type,
        } as Json,
      },
      { onConflict: "entity_type,entity_id" }
    );
    if (!upsertError) synced += 1;
  }
  return synced;
}

export async function fetchModerationQueue(supabase: DbClient): Promise<ModerationQueueItem[]> {
  const [activeResult, reversibleBlogResult] = await Promise.all([
    supabase
      .from("moderation_queue")
      .select("*")
      .in("status", ["pending", "in_review"])
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(100),
    supabase
      .from("moderation_queue")
      .select("*")
      .eq("entity_type", "blog_comment_report")
      .eq("status", "approved")
      .order("resolved_at", { ascending: false })
      .limit(20),
  ]);

  if (activeResult.error) return [];
  const queueRows = [
    ...(activeResult.data ?? []),
    ...(reversibleBlogResult.error ? [] : (reversibleBlogResult.data ?? [])),
  ];

  if (!queueRows.length) return [];

  const tourIds = queueRows.filter((r) => r.entity_type === "tour").map((r) => r.entity_id);
  const reviewIds = queueRows.filter((r) => r.entity_type === "review").map((r) => r.entity_id);
  const reportIds = queueRows
    .filter((r) => r.entity_type === "review_report")
    .map((r) => r.entity_id);
  const forumPostIds = queueRows
    .filter((r) => r.entity_type === "forum_post")
    .map((r) => r.entity_id);
  const blogCommentReportIds = queueRows
    .filter((r) => r.entity_type === "blog_comment_report")
    .map((r) => r.entity_id);
  const toursById = new Map<string, TourContentAdminSummary>();
  const reviewsById = await fetchModerationReviewSummaries(supabase, reviewIds);
  const reviewReportsById = await fetchModerationReviewReportSummaries(supabase, reportIds);
  const forumPostsById = await fetchForumPostModerationSummaries(supabase, forumPostIds);
  const blogCommentReportsById = await fetchBlogCommentReportModerationSummaries(
    supabase,
    blogCommentReportIds,
  );

  type ExpectedState = {
    entityVersion: number;
    entityStatus: string;
    relatedVersion?: number;
    relatedStatus?: string;
  };
  const expectedStateByQueueId = new Map<string, ExpectedState>();

  const authorDocumentIds = queueRows
    .filter((row) => row.entity_type === "author_article")
    .map((row) => row.entity_id);
  const forumReportIds = queueRows
    .filter((row) => row.entity_type === "forum_post")
    .map((row) => metadataString(row.metadata, "reportId"))
    .filter((id): id is string => Boolean(id));

  const [tourStates, reviewStates, reportStates, forumPostStates, forumReportStates, documentStates] =
    await Promise.all([
      tourIds.length
        ? supabase.from("tours").select("id, row_version, moderation_status").in("id", tourIds)
        : Promise.resolve({ data: [] }),
      reviewIds.length || reportIds.length
        ? supabase
            .from("tourist_reviews")
            .select("id, row_version, status")
            .in("id", [
              ...reviewIds,
              ...Array.from(reviewReportsById.values()).map((report) => report.reviewId),
            ])
        : Promise.resolve({ data: [] }),
      reportIds.length
        ? supabase
            .from("review_reports")
            .select("id, row_version, status, review_id")
            .in("id", reportIds)
        : Promise.resolve({ data: [] }),
      forumPostIds.length
        ? supabase.from("forum_posts").select("id, row_version, status").in("id", forumPostIds)
        : Promise.resolve({ data: [] }),
      forumReportIds.length
        ? supabase
            .from("forum_post_reports")
            .select("id, row_version, status, post_id")
            .in("id", forumReportIds)
        : Promise.resolve({ data: [] }),
      authorDocumentIds.length
        ? supabase
            .from("content_documents")
            .select("id, row_version, status")
            .in("id", authorDocumentIds)
        : Promise.resolve({ data: [] }),
    ]);

  const tourStateById = new Map((tourStates.data ?? []).map((row) => [row.id, row]));
  const reviewStateById = new Map((reviewStates.data ?? []).map((row) => [row.id, row]));
  const reportStateById = new Map((reportStates.data ?? []).map((row) => [row.id, row]));
  const forumPostStateById = new Map((forumPostStates.data ?? []).map((row) => [row.id, row]));
  const forumReportStateById = new Map((forumReportStates.data ?? []).map((row) => [row.id, row]));
  const documentStateById = new Map((documentStates.data ?? []).map((row) => [row.id, row]));

  for (const row of queueRows) {
    if (row.entity_type === "tour") {
      const state = tourStateById.get(row.entity_id);
      if (state) {
        expectedStateByQueueId.set(row.id, {
          entityVersion: state.row_version,
          entityStatus: state.moderation_status,
        });
      }
    } else if (row.entity_type === "review") {
      const state = reviewStateById.get(row.entity_id);
      if (state) {
        expectedStateByQueueId.set(row.id, {
          entityVersion: state.row_version,
          entityStatus: state.status,
        });
      }
    } else if (row.entity_type === "review_report") {
      const state = reportStateById.get(row.entity_id);
      const related = state ? reviewStateById.get(state.review_id) : null;
      if (state && related) {
        expectedStateByQueueId.set(row.id, {
          entityVersion: state.row_version,
          entityStatus: state.status,
          relatedVersion: related.row_version,
          relatedStatus: related.status,
        });
      }
    } else if (row.entity_type === "forum_post") {
      const state = forumPostStateById.get(row.entity_id);
      const reportId = metadataString(row.metadata, "reportId");
      const related = reportId ? forumReportStateById.get(reportId) : null;
      if (state && related) {
        expectedStateByQueueId.set(row.id, {
          entityVersion: state.row_version,
          entityStatus: state.status,
          relatedVersion: related.row_version,
          relatedStatus: related.status,
        });
      }
    } else if (row.entity_type === "author_article") {
      const state = documentStateById.get(row.entity_id);
      if (state) {
        expectedStateByQueueId.set(row.id, {
          entityVersion: state.row_version,
          entityStatus: state.status,
        });
      }
    }
  }

  if (tourIds.length) {
    const { data: tours } = await supabase.from("tours").select("*").in("id", tourIds);
    if (tours?.length) {
      const { rowToAdminSummary } = await import("@/lib/tour-content-mapper");
      for (const row of tours) {
        toursById.set(row.id, rowToAdminSummary(row));
      }
    }
  }

  return queueRows.map((row) => {
    const expectedState = expectedStateByQueueId.get(row.id);
    return ({
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status,
    priority: row.priority,
    reason: row.reason,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    queueVersion: row.row_version,
    entityVersion: expectedState?.entityVersion ?? null,
    entityStatus: expectedState?.entityStatus ?? null,
    relatedVersion: expectedState?.relatedVersion ?? null,
    relatedStatus: expectedState?.relatedStatus ?? null,
    tour: row.entity_type === "tour" ? (toursById.get(row.entity_id) ?? null) : null,
    review: row.entity_type === "review" ? (reviewsById.get(row.entity_id) ?? null) : null,
    reviewReport:
      row.entity_type === "review_report" ? (reviewReportsById.get(row.entity_id) ?? null) : null,
    forumPost:
      row.entity_type === "forum_post" ? enrichForumPostSummary(row, forumPostsById.get(row.entity_id)) : null,
    blogCommentReport:
      row.entity_type === "blog_comment_report"
        ? (blogCommentReportsById.get(row.entity_id) ?? null)
        : null,
    });
  });
}

function enrichForumPostSummary(
  row: Database["public"]["Tables"]["moderation_queue"]["Row"],
  base: ForumPostModerationSummary | undefined
): ForumPostModerationSummary | null {
  if (!base) return null;

  const metadata = (row.metadata as Record<string, unknown>) ?? {};
  return {
    ...base,
    reason: typeof metadata.reason === "string" ? metadata.reason : base.reason,
    reasonLabel:
      typeof metadata.reasonLabel === "string" ? metadata.reasonLabel : base.reasonLabel,
    details: typeof metadata.details === "string" ? metadata.details : base.details,
  };
}

type ModerationFailureCode =
  | "not_found"
  | "version_conflict"
  | "expected_state_required"
  | "invalid_transition"
  | "invalid_action"
  | "forbidden"
  | "unexpected";

type ModerationFailure = {
  error: string;
  code?: ModerationFailureCode;
  actualQueueVersion?: number;
  actualQueueStatus?: string;
  actualEntityVersion?: number;
  actualEntityStatus?: string;
  actualRelatedVersion?: number;
  actualRelatedStatus?: string;
  actualReportStatus?: string;
  actualCommentStatus?: string;
};

function jsonRecord(value: Json | null): Record<string, Json | undefined> {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function numberFromJson(value: Json | undefined): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function moderationFailure(result: Record<string, Json | undefined>): ModerationFailure {
  const code = typeof result.code === "string" ? (result.code as ModerationFailureCode) : "unexpected";
  const messages: Record<ModerationFailureCode, string> = {
    not_found: "Материал модерации больше не найден. Обновите очередь.",
    version_conflict: "Материал уже изменился. Очередь обновлена — проверьте актуальное состояние.",
    expected_state_required: "Не хватает версии материала. Обновите очередь и повторите действие.",
    invalid_transition: "Это решение больше нельзя применить к текущему состоянию материала.",
    invalid_action: "Действие не поддерживается для этого материала.",
    forbidden: "Недостаточно прав для модерации.",
    unexpected: "Не удалось применить решение модерации.",
  };
  return {
    error: messages[code],
    code,
    actualQueueVersion: numberFromJson(result.actualQueueVersion),
    actualQueueStatus:
      typeof result.actualQueueStatus === "string" ? result.actualQueueStatus : undefined,
    actualEntityVersion: numberFromJson(result.actualEntityVersion),
    actualEntityStatus:
      typeof result.actualEntityStatus === "string" ? result.actualEntityStatus : undefined,
    actualRelatedVersion: numberFromJson(result.actualRelatedVersion),
    actualRelatedStatus:
      typeof result.actualRelatedStatus === "string" ? result.actualRelatedStatus : undefined,
  };
}

function profileName(profile: {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
} | null): string | null {
  if (!profile) return null;
  return [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim() || profile.email;
}

async function deliverReviewModerationNotifications(
  supabase: DbClient,
  reviewId: string,
  action: "approve" | "reject",
  note?: string,
): Promise<void> {
  const { data: review } = await supabase
    .from("tourist_reviews")
    .select(
      "id, user_id, organizer_user_id, tour_title, tour_slug, rating, review_text, trip_date",
    )
    .eq("id", reviewId)
    .maybeSingle();
  if (!review) return;

  const profileIds = [review.user_id, review.organizer_user_id].filter(
    (id): id is string => Boolean(id),
  );
  const { data: profiles } = profileIds.length
    ? await supabase
        .from("profiles")
        .select("id, first_name, last_name, email")
        .in("id", profileIds)
    : { data: [] };
  const profilesById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const author = review.user_id ? profilesById.get(review.user_id) ?? null : null;
  const organizer = review.organizer_user_id
    ? profilesById.get(review.organizer_user_id) ?? null
    : null;

  await sendReviewModerationEmail({
    userId: review.user_id,
    touristEmail: author?.email ?? null,
    touristName: profileName(author),
    tourTitle: review.tour_title,
    tourSlug: review.tour_slug,
    action,
    note,
  });

  if (action !== "approve") return;
  await sendOrganizerNewReviewEmail({
    organizerEmail: organizer?.email ?? null,
    organizerName: profileName(organizer),
    tourTitle: review.tour_title,
    tourSlug: review.tour_slug,
    touristName: profileName(author),
    rating: review.rating,
    reviewText: review.review_text,
    tripDate: review.trip_date,
  });
  await notifyReviewApprovedInApp({
    reviewId,
    tourTitle: review.tour_title,
    tourSlug: review.tour_slug,
    authorUserId: review.user_id,
    organizerUserId: review.organizer_user_id,
    rating: review.rating,
  });
}

export async function resolveModerationItem(
  supabase: DbClient,
  queueId: string,
  action: ModerationResolveAction,
  actorUserId: string,
  note?: string,
  expectedState?: ModerationExpectedState,
): Promise<
  | { ok: true; entityType: string; entityTitle: string; ownerEmail: string | null }
  | ModerationFailure
> {
  const { data: item, error } = await supabase
    .from("moderation_queue")
    .select("*")
    .eq("id", queueId)
    .maybeSingle();

  if (error || !item) return { error: "Элемент очереди не найден" };

  if (item.entity_type === "blog_comment_report") {
    if (
      action !== "hide_comment" &&
      action !== "restore_comment" &&
      action !== "dismiss_report"
    ) {
      return { error: "Выберите действие для жалобы на комментарий", code: "invalid_action" };
    }
    if (
      !expectedState?.queueStatus ||
      !expectedState.reportStatus ||
      !expectedState.commentStatus
    ) {
      return {
        error: "Ожидаемое состояние жалобы обязательно. Обновите очередь.",
        code: "version_conflict",
      };
    }

    const result = await resolveBlogCommentReportModeration(supabase, {
      queueId,
      reportId: item.entity_id,
      actorUserId,
      action,
      expectedQueueStatus: expectedState.queueStatus,
      expectedReportStatus: expectedState.reportStatus,
      expectedCommentStatus: expectedState.commentStatus,
      note,
      ipAddress: expectedState.ipAddress,
    });
    if ("error" in result) return result;

    return {
      ok: true,
      entityType: "blog_comment_report",
      entityTitle: metadataString(item.metadata, "articleSlug") ?? item.entity_id,
      ownerEmail: null,
    };
  }

  if (action !== "approve" && action !== "reject") {
    return { error: "Действие не поддерживается для этого типа материала", code: "invalid_action" };
  }
  if (
    !expectedState?.queueVersion ||
    !expectedState.queueStatus ||
    !expectedState.entityVersion ||
    !expectedState.entityStatus
  ) {
    return moderationFailure({ code: "expected_state_required" });
  }

  const { data, error: rpcError } = await supabase.rpc("admin_resolve_moderation_item_atomic", {
    p_queue_id: queueId,
    p_action: action,
    p_actor_user_id: actorUserId,
    p_expected_queue_version: expectedState.queueVersion,
    p_expected_queue_status: expectedState.queueStatus,
    p_expected_entity_version: expectedState.entityVersion,
    p_expected_entity_status: expectedState.entityStatus,
    p_expected_related_version: expectedState.relatedVersion ?? null,
    p_expected_related_status: expectedState.relatedStatus ?? null,
    p_note: note?.trim() || null,
    p_ip_address: expectedState.ipAddress ?? null,
  });

  if (rpcError) {
    const conflict = rpcError.code === "40001";
    return {
      error: conflict
        ? "Материал уже изменился. Обновите очередь и проверьте актуальное состояние."
        : "Не удалось применить решение модерации.",
      code: conflict ? "version_conflict" : "unexpected",
    };
  }

  const result = jsonRecord(data);
  if (result.ok !== true) return moderationFailure(result);

  const ownerUserId = typeof result.ownerUserId === "string" ? result.ownerUserId : null;
  let ownerEmail: string | null = null;
  if (ownerUserId) {
    const { data: owner } = await supabase
      .from("profiles")
      .select("email")
      .eq("id", ownerUserId)
      .maybeSingle();
    ownerEmail = owner?.email ?? null;
  }

  let entityType = typeof result.entityType === "string" ? result.entityType : item.entity_type;
  const entityTitle =
    typeof result.entityTitle === "string"
      ? result.entityTitle
      : metadataString(item.metadata, "title") ?? item.entity_id;

  if (entityType === "tour") {
    const { data: tour } = await supabase
      .from("tours")
      .select("product_type")
      .eq("id", item.entity_id)
      .maybeSingle();
    if (tour?.product_type === "excursion") entityType = "excursion";
  }

  if (item.entity_type === "review") {
    try {
      await deliverReviewModerationNotifications(supabase, item.entity_id, action, note);
    } catch {
      // The transactional outbox remains the delivery source of truth.
    }
  }

  return { ok: true, entityType, entityTitle, ownerEmail };
}

export async function enqueueTourModeration(
  supabase: DbClient,
  tourId: string,
  metadata: Record<string, unknown>
): Promise<{ ok: true } | { error: string }> {
  const { error } = await supabase.from("moderation_queue").upsert(
    {
      entity_type: "tour",
      entity_id: tourId,
      status: "pending",
      assigned_to: null,
      resolved_at: null,
      resolved_by: null,
      reason:
        metadata.productType === "excursion"
          ? "Публикация экскурсии организатором"
          : "Публикация тура организатором",
      metadata: metadata as Json,
    },
    { onConflict: "entity_type,entity_id" }
  );
  return error ? { error: error.message } : { ok: true };
}
