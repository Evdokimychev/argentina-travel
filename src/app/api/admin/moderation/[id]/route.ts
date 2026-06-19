import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { resolveModerationItem, type ModerationResolveAction } from "@/lib/admin/moderation-server";

type PatchBody = {
  action?: ModerationResolveAction;
  note?: string;
};

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

  const supabase = createSupabaseAdminClient();
  const result = await resolveModerationItem(
    supabase,
    id,
    body.action,
    auth.actorId,
    body.note
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: `moderation.${body.action}`,
    entityType: "moderation_queue",
    entityId: id,
    payload: { note: body.note ?? null },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
