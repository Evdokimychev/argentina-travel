import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveModerationItem, type ModerationResolveAction } from "@/lib/admin/moderation-server";

type PatchBody = {
  action?: ModerationResolveAction;
  note?: string;
  expectedQueueStatus?: string;
  expectedQueueVersion?: number;
  expectedEntityStatus?: string;
  expectedEntityVersion?: number;
  expectedRelatedStatus?: string;
  expectedRelatedVersion?: number;
  expectedReportStatus?: string;
  expectedCommentStatus?: string;
};

const MODERATION_ACTIONS = new Set<ModerationResolveAction>([
  "approve",
  "reject",
  "hide_comment",
  "restore_comment",
  "dismiss_report",
]);

function resolveModerationActorId(
  request: Request,
  auth: { actorId: string; via: "session" | "automation" }
) {
  if (auth.via === "session") return auth.actorId;
  const delegatedActorId = request.headers.get("x-admin-actor-id")?.trim() ?? "";
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(delegatedActorId)
    ? delegatedActorId
    : null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as PatchBody;

  if (!body.action || !MODERATION_ACTIONS.has(body.action)) {
    return NextResponse.json({ error: "Укажите корректное действие модерации" }, { status: 400 });
  }

  const actorId = resolveModerationActorId(request, auth);
  if (!actorId) {
    return NextResponse.json(
      { error: "Для служебной модерации укажите UUID администратора в X-Admin-Actor-Id" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseAdminClient();
  if (body.action === "approve") {
    const { data: queueItem } = await supabase
      .from("moderation_queue")
      .select("entity_type")
      .eq("id", id)
      .maybeSingle();

    if (queueItem?.entity_type === "author_article") {
      const publishAuth = await authorizeAdminRequest(request, "content.publish");
      if (!publishAuth.ok) return publishAuth.response;
    }
  }

  const result = await resolveModerationItem(
    supabase,
    id,
    body.action,
    actorId,
    body.note,
    {
      queueStatus: body.expectedQueueStatus,
      queueVersion: body.expectedQueueVersion,
      entityStatus: body.expectedEntityStatus,
      entityVersion: body.expectedEntityVersion,
      relatedStatus: body.expectedRelatedStatus,
      relatedVersion: body.expectedRelatedVersion,
      reportStatus: body.expectedReportStatus,
      commentStatus: body.expectedCommentStatus,
      ipAddress: clientIpFromRequest(request),
    },
  );

  if ("error" in result) {
    const status =
      result.code === "version_conflict" || result.code === "expected_state_required"
        ? 409
        : result.code === "forbidden"
          ? 403
          : result.code === "not_found"
            ? 404
            : result.code === "invalid_action" || result.code === "invalid_transition"
              ? 400
              : 500;
    return NextResponse.json(
      {
        error: result.error,
        code: result.code,
        actualQueueStatus: result.actualQueueStatus,
        actualQueueVersion: result.actualQueueVersion,
        actualEntityStatus: result.actualEntityStatus,
        actualEntityVersion: result.actualEntityVersion,
        actualRelatedStatus: result.actualRelatedStatus,
        actualRelatedVersion: result.actualRelatedVersion,
        actualReportStatus: result.actualReportStatus,
        actualCommentStatus: result.actualCommentStatus,
      },
      { status },
    );
  }

  if (
    result.entityType !== "review" &&
    result.entityType !== "blog_comment_report" &&
    (body.action === "approve" || body.action === "reject")
  ) {
    const { notifyModerationOutcome } = await import("@/lib/admin/moderation-notify");
    try {
      await notifyModerationOutcome({
        entityType: result.entityType,
        entityTitle: result.entityTitle,
        ownerEmail: result.ownerEmail,
        action: body.action,
        note: body.note,
      });
    } catch {
      // Business truth and durable delivery intent were already committed atomically.
    }
  }

  if (result.entityType === "tour" || result.entityType === "excursion") {
    revalidateTag("tours");
    revalidateTag("excursions");
  }

  return NextResponse.json({ ok: true });
}
