import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AccountRoleDb, Database } from "@/types/database";

type PatchBody = {
  isBlocked?: boolean;
  roles?: AccountRoleDb[];
  activeRole?: AccountRoleDb;
  adminNotes?: string | null;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "users.manage");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const body = (await request.json()) as PatchBody;
  const supabase = createSupabaseAdminClient();

  const update: Database["public"]["Tables"]["profiles"]["Update"] = {};
  if (body.isBlocked !== undefined) update.is_blocked = body.isBlocked;
  if (body.roles !== undefined) update.roles = body.roles;
  if (body.activeRole !== undefined) update.active_role = body.activeRole;
  if (body.adminNotes !== undefined) update.admin_notes = body.adminNotes;

  if (!Object.keys(update).length) {
    return NextResponse.json({ error: "Нет полей для обновления" }, { status: 400 });
  }

  const { error } = await supabase.from("profiles").update(update).eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "user.update",
    entityType: "profile",
    entityId: id,
    payload: update,
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
