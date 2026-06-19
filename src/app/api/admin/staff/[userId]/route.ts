import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminPresetId } from "@/types/admin";
import type { Database } from "@/types/database";

type PatchBody = {
  preset?: AdminPresetId | null;
  capabilities?: string[];
  isActive?: boolean;
  notes?: string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await authorizeAdminRequest(request, "users.manage");
  if (!auth.ok) return auth.response;

  const { userId } = await context.params;
  const body = (await request.json()) as PatchBody;
  const supabase = createSupabaseAdminClient();

  const update: Database["public"]["Tables"]["admin_staff"]["Update"] = {};
  if (body.preset !== undefined) update.preset = body.preset;
  if (body.capabilities !== undefined) update.capabilities = body.capabilities;
  if (body.isActive !== undefined) update.is_active = body.isActive;
  if (body.notes !== undefined) update.notes = body.notes?.trim() || null;

  const { error } = await supabase.from("admin_staff").update(update).eq("user_id", userId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "staff.update",
    entityType: "admin_staff",
    entityId: userId,
    payload: update,
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const auth = await authorizeAdminRequest(request, "users.manage");
  if (!auth.ok) return auth.response;

  const { userId } = await context.params;
  const supabase = createSupabaseAdminClient();

  const { error } = await supabase.from("admin_staff").delete().eq("user_id", userId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles, active_role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.roles.includes("admin")) {
    const nextRoles = profile.roles.filter((r) => r !== "admin");
    await supabase
      .from("profiles")
      .update({
        roles: nextRoles.length ? nextRoles : ["tourist"],
        active_role: profile.active_role === "admin" ? "tourist" : profile.active_role,
      })
      .eq("id", userId);
  }

  return NextResponse.json({ ok: true });
}
