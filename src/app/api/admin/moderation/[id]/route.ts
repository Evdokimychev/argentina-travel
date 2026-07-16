import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveModerationItem, type ModerationResolveAction } from "@/lib/admin/moderation-server";

type PatchBody = {
  action?: ModerationResolveAction;
  note?: string;
};

function resolveModerationActorId(
  request: Request,
  auth: { actorId: string; via: "session" | "service_role" }
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

  if (body.action !== "approve" && body.action !== "reject") {
    return NextResponse.json({ error: "Укажите action: approve или reject" }, { status: 400 });
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
    body.note
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorUserId: actorId,
    action: `moderation.${body.action}`,
    entityType: "moderation_queue",
    entityId: id,
    payload: { note: body.note ?? null },
    ipAddress: clientIpFromRequest(request),
  });

  if (result.entityType !== "review") {
    const { notifyModerationOutcome } = await import("@/lib/admin/moderation-notify");
    await notifyModerationOutcome({
      entityType: result.entityType,
      entityTitle: result.entityTitle,
      ownerEmail: result.ownerEmail,
      action: body.action,
      note: body.note,
    });
  }

  if (result.entityType === "tour" || result.entityType === "excursion") {
    revalidateTag("tours");
    revalidateTag("excursions");
  }

  return NextResponse.json({ ok: true });
}
