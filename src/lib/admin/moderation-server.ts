import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { TourContentAdminSummary, TourModerationStatus } from "@/types/tour-content";
import { getCmsRevisionById, updateCmsDocument } from "@/lib/cms/content-server";
import { sendOrganizerNewReviewEmail } from "@/lib/notifications/email-delivery";
import { notifyReviewApprovedInApp } from "@/lib/notifications/event-emitters";
import type { ModerationReviewSummary, ModerationReviewReportSummary } from "@/lib/reviews-db-mapper";
import {
  fetchModerationReviewSummaries,
  fetchModerationReviewReportSummaries,
  resolveReviewModeration,
  resolveReviewReportModeration,
  syncPendingReviewsToQueue,
} from "@/lib/reviews-server";
import {
  fetchForumPostModerationSummaries,
  resolveForumPostModeration,
  type ForumPostModerationSummary,
} from "@/lib/forum/forum-server";

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
  tour?: TourContentAdminSummary | null;
  review?: ModerationReviewSummary | null;
  reviewReport?: ModerationReviewReportSummary | null;
  forumPost?: ForumPostModerationSummary | null;
};

export type ModerationResolveAction = "approve" | "reject";

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
  await syncPendingToursToQueue(supabase);
  await syncPendingReviewsToQueue(supabase);

  const { data: queueRows, error } = await supabase
    .from("moderation_queue")
    .select("*")
    .in("status", ["pending", "in_review"])
    .order("priority", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(100);

  if (error || !queueRows?.length) return [];

  const tourIds = queueRows.filter((r) => r.entity_type === "tour").map((r) => r.entity_id);
  const reviewIds = queueRows.filter((r) => r.entity_type === "review").map((r) => r.entity_id);
  const reportIds = queueRows
    .filter((r) => r.entity_type === "review_report")
    .map((r) => r.entity_id);
  const forumPostIds = queueRows
    .filter((r) => r.entity_type === "forum_post")
    .map((r) => r.entity_id);
  const toursById = new Map<string, TourContentAdminSummary>();
  const reviewsById = await fetchModerationReviewSummaries(supabase, reviewIds);
  const reviewReportsById = await fetchModerationReviewReportSummaries(supabase, reportIds);
  const forumPostsById = await fetchForumPostModerationSummaries(supabase, forumPostIds);

  if (tourIds.length) {
    const { data: tours } = await supabase.from("tours").select("*").in("id", tourIds);
    if (tours?.length) {
      const { rowToAdminSummary } = await import("@/lib/tour-content-mapper");
      for (const row of tours) {
        toursById.set(row.id, rowToAdminSummary(row));
      }
    }
  }

  return queueRows.map((row) => ({
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    status: row.status,
    priority: row.priority,
    reason: row.reason,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    tour: row.entity_type === "tour" ? (toursById.get(row.entity_id) ?? null) : null,
    review: row.entity_type === "review" ? (reviewsById.get(row.entity_id) ?? null) : null,
    reviewReport:
      row.entity_type === "review_report" ? (reviewReportsById.get(row.entity_id) ?? null) : null,
    forumPost:
      row.entity_type === "forum_post" ? enrichForumPostSummary(row, forumPostsById.get(row.entity_id)) : null,
  }));
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

export async function resolveModerationItem(
  supabase: DbClient,
  queueId: string,
  action: ModerationResolveAction,
  actorUserId: string,
  note?: string
): Promise<
  | { ok: true; entityType: string; entityTitle: string; ownerEmail: string | null }
  | { error: string }
> {
  const { data: item, error } = await supabase
    .from("moderation_queue")
    .select("*")
    .eq("id", queueId)
    .maybeSingle();

  if (error || !item) return { error: "Элемент очереди не найден" };

  const now = new Date().toISOString();
  const resolvedStatus = action === "approve" ? "approved" : "rejected";
  const tourModerationStatus: TourModerationStatus =
    action === "approve" ? "approved" : "rejected";

  if (item.entity_type === "author_article") {
    const submittedRevisionId = metadataString(item.metadata, "submittedRevisionId");
    if (!submittedRevisionId) {
      return { error: "В заявке не закреплена редакция статьи. Автору нужно отправить материал повторно." };
    }

    const revision = await getCmsRevisionById(supabase, item.entity_id, submittedRevisionId);
    if (!revision) {
      return { error: "Закреплённая редакция статьи не найдена. Публикация остановлена." };
    }

    const documentResult = await updateCmsDocument(
      supabase,
      item.entity_id,
      action === "approve"
        ? {
            title: revision.title,
            body: revision.body,
            seo: revision.seo,
            status: "published",
            actorId: actorUserId,
          }
        : { status: "draft", actorId: actorUserId },
    );
    if ("error" in documentResult || documentResult.document.body.kind !== "author_article") {
      return {
        error:
          "error" in documentResult
            ? documentResult.error
            : "Закреплённая редакция не является авторской статьёй",
      };
    }

    const { error: queueUpdateError } = await supabase
      .from("moderation_queue")
      .update({
        status: resolvedStatus,
        resolved_at: now,
        resolved_by: actorUserId,
        reason: note?.trim() || item.reason,
      })
      .eq("id", queueId)
      .in("status", ["pending", "in_review"]);

    if (queueUpdateError) return { error: queueUpdateError.message };

    let ownerEmail: string | null = null;
    if (documentResult.document.createdBy) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", documentResult.document.createdBy)
        .maybeSingle();
      ownerEmail = ownerProfile?.email ?? null;
    }

    return {
      ok: true,
      entityType: "author_article",
      entityTitle: documentResult.document.title,
      ownerEmail,
    };
  }

  if (item.entity_type === "tour") {
    const { data: previousTour, error: previousTourError } = await supabase
      .from("tours")
      .select(
        "title, owner_user_id, product_type, status, listing, payload, moderation_status, moderation_notes, moderated_by, moderated_at, approved_listing, approved_payload, approved_at"
      )
      .eq("id", item.entity_id)
      .maybeSingle();
    if (previousTourError || !previousTour) {
      return { error: previousTourError?.message ?? "Предложение не найдено" };
    }

    const tourUpdate: Database["public"]["Tables"]["tours"]["Update"] = {
      moderation_status: tourModerationStatus,
      moderation_notes: note?.trim() || null,
      moderated_by: actorUserId,
      moderated_at: now,
    };

    if (action === "approve") {
      tourUpdate.approved_listing = previousTour.listing;
      tourUpdate.approved_payload = previousTour.payload;
      tourUpdate.approved_at = now;
    }

    if (action === "reject" && !previousTour.approved_payload) {
      tourUpdate.status = "draft";
    }

    const { data: tourRow, error: tourError } = await supabase
      .from("tours")
      .update(tourUpdate)
      .eq("id", item.entity_id)
      .select("title, owner_user_id, product_type")
      .maybeSingle();

    if (tourError) return { error: tourError.message };

    const { error: queueUpdateError } = await supabase
      .from("moderation_queue")
      .update({
        status: resolvedStatus,
        resolved_at: now,
        resolved_by: actorUserId,
        reason: note?.trim() || item.reason,
      })
      .eq("id", queueId)
      .in("status", ["pending", "in_review"]);

    if (queueUpdateError) {
      await supabase
        .from("tours")
        .update({
          status: previousTour.status,
          moderation_status: previousTour.moderation_status,
          moderation_notes: previousTour.moderation_notes,
          moderated_by: previousTour.moderated_by,
          moderated_at: previousTour.moderated_at,
          approved_listing: previousTour.approved_listing,
          approved_payload: previousTour.approved_payload,
          approved_at: previousTour.approved_at,
        })
        .eq("id", item.entity_id);
      return { error: queueUpdateError.message };
    }

    let ownerEmail: string | null = null;
    if (tourRow?.owner_user_id) {
      const { data: ownerProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", tourRow.owner_user_id)
        .maybeSingle();
      ownerEmail = ownerProfile?.email ?? null;
    }

    return {
      ok: true,
      entityType: tourRow?.product_type === "excursion" ? "excursion" : "tour",
      entityTitle: tourRow?.title ?? metadataString(item.metadata, "title") ?? item.entity_id,
      ownerEmail,
    };
  }

  const { error: queueUpdateError } = await supabase
    .from("moderation_queue")
    .update({
      status: resolvedStatus,
      resolved_at: now,
      resolved_by: actorUserId,
      reason: note?.trim() || item.reason,
    })
    .eq("id", queueId);

  if (queueUpdateError) return { error: queueUpdateError.message };

  if (item.entity_type === "review") {
    const reviewResult = await resolveReviewModeration(
      supabase,
      item.entity_id,
      action,
      actorUserId,
      note
    );

    if ("error" in reviewResult) return reviewResult;

    if (action === "approve") {
      try {
        await sendOrganizerNewReviewEmail({
          organizerEmail: reviewResult.organizerEmail,
          organizerName: reviewResult.organizerName,
          tourTitle: reviewResult.tourTitle,
          tourSlug: reviewResult.tourSlug,
          touristName: reviewResult.authorName,
          rating: reviewResult.rating,
          reviewText: reviewResult.reviewText,
          tripDate: reviewResult.tripDate,
        });
      } catch {
        // Non-blocking notification channel.
      }

      void notifyReviewApprovedInApp({
        reviewId: item.entity_id,
        tourTitle: reviewResult.tourTitle,
        tourSlug: reviewResult.tourSlug,
        authorUserId: reviewResult.authorUserId ?? null,
        organizerUserId: reviewResult.organizerUserId ?? null,
        rating: reviewResult.rating,
      });
    }

    return {
      ok: true,
      entityType: "review",
      entityTitle: reviewResult.tourTitle,
      ownerEmail: reviewResult.authorEmail,
    };
  }

  if (item.entity_type === "review_report") {
    const reportResult = await resolveReviewReportModeration(
      supabase,
      item.entity_id,
      action,
      actorUserId
    );
    if ("error" in reportResult) return reportResult;

    return {
      ok: true,
      entityType: "review_report",
      entityTitle: metadataString(item.metadata, "tourTitle") ?? item.entity_id,
      ownerEmail: null,
    };
  }

  if (item.entity_type === "forum_post") {
    const forumResult = await resolveForumPostModeration(
      supabase,
      item.entity_id,
      action,
      actorUserId,
      (item.metadata as Record<string, unknown>) ?? null
    );
    if ("error" in forumResult) return forumResult;

    return {
      ok: true,
      entityType: "forum_post",
      entityTitle: metadataString(item.metadata, "threadTitle") ?? item.entity_id,
      ownerEmail: null,
    };
  }

  return {
    ok: true,
    entityType: item.entity_type,
    entityTitle: metadataString(item.metadata, "title") ?? item.entity_id,
    ownerEmail: null,
  };
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
