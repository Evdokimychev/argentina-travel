import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/database";
import type { TourContentAdminSummary, TourModerationStatus } from "@/types/tour-content";
import type { ModerationReviewSummary } from "@/lib/reviews-db-mapper";
import {
  fetchModerationReviewSummaries,
  resolveReviewModeration,
  syncPendingReviewsToQueue,
} from "@/lib/reviews-server";

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
};

export type ModerationResolveAction = "approve" | "reject";

export async function syncPendingToursToQueue(supabase: DbClient): Promise<number> {
  const { data: pendingTours, error } = await supabase
    .from("tours")
    .select("id, slug, title, owner_user_id, status, moderation_status, updated_at")
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
        reason: "Публикация тура организатором",
        metadata: {
          slug: tour.slug,
          title: tour.title,
          ownerUserId: tour.owner_user_id,
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
  const toursById = new Map<string, TourContentAdminSummary>();
  const reviewsById = await fetchModerationReviewSummaries(supabase, reviewIds);

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
  }));
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

  if (item.entity_type === "tour") {
    const tourUpdate: Database["public"]["Tables"]["tours"]["Update"] = {
      moderation_status: tourModerationStatus,
      moderation_notes: note?.trim() || null,
      moderated_by: actorUserId,
      moderated_at: now,
    };

    if (action === "reject") {
      tourUpdate.status = "draft";
    }

    const { data: tourRow, error: tourError } = await supabase
      .from("tours")
      .update(tourUpdate)
      .eq("id", item.entity_id)
      .select("title, owner_user_id")
      .maybeSingle();

    if (tourError) return { error: tourError.message };

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
      entityType: "tour",
      entityTitle: tourRow?.title ?? metadataString(item.metadata, "title") ?? item.entity_id,
      ownerEmail,
    };
  }

  if (item.entity_type === "review") {
    const reviewResult = await resolveReviewModeration(
      supabase,
      item.entity_id,
      action,
      actorUserId,
      note
    );

    if ("error" in reviewResult) return reviewResult;

    return {
      ok: true,
      entityType: "review",
      entityTitle: reviewResult.tourTitle,
      ownerEmail: reviewResult.authorEmail,
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
): Promise<void> {
  await supabase.from("moderation_queue").upsert(
    {
      entity_type: "tour",
      entity_id: tourId,
      status: "pending",
      reason: "Публикация тура организатором",
      metadata: metadata as Json,
    },
    { onConflict: "entity_type,entity_id" }
  );
}
