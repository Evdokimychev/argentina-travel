import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(request: Request, context: RouteContext) {
  const auth = await authorizeAdminRequest(request, "system.settings");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("api_keys")
    .select("id, label, is_active")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Ключ не найден" }, { status: 404 });
  }
  if (!existing.is_active) {
    return NextResponse.json({ ok: true, alreadyRevoked: true });
  }

  const revokedAt = new Date().toISOString();
  const { error } = await supabase
    .from("api_keys")
    .update({ is_active: false, revoked_at: revokedAt })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "api_key.revoke",
    entityType: "api_keys",
    entityId: id,
    payload: { label: existing.label },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true, revokedAt });
}
