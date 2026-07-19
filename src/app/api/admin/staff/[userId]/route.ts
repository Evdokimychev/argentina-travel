import { NextResponse } from "next/server";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import {
  assertStaffTargetMutationAllowed,
  authorizeStaffManagementRequest,
  fetchStaffSecurityRecord,
  hasConsistentOwnerGrant,
  isAdminPresetId,
  parseAdminCapabilities,
} from "@/lib/admin/staff-management";
import type { Database } from "@/types/database";

type PatchBody = {
  preset?: unknown;
  capabilities?: unknown;
  isActive?: unknown;
  notes?: unknown;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ userId: string }> }
) {
  const access = await authorizeStaffManagementRequest(request);
  if (!access.ok) return access.response;

  const { userId } = await context.params;
  const body = (await request.json()) as PatchBody;
  const { auth, supabase } = access;
  const current = await fetchStaffSecurityRecord(supabase, userId);
  if (!current) {
    return NextResponse.json({ error: "Сотрудник не найден" }, { status: 404 });
  }
  const targetGuard = assertStaffTargetMutationAllowed({ actorId: auth.actorId, target: current });
  if (!targetGuard.ok) {
    return NextResponse.json(
      { error: targetGuard.error, code: targetGuard.code },
      { status: targetGuard.status },
    );
  }

  const update: Database["public"]["Tables"]["admin_staff"]["Update"] = {};
  if (body.preset !== undefined) {
    if (!isAdminPresetId(body.preset)) {
      return NextResponse.json({ error: "Неизвестный preset" }, { status: 400 });
    }
    update.preset = body.preset;
  }
  let nextCapabilities = current.capabilities;
  if (body.capabilities !== undefined) {
    const parsedCapabilities = parseAdminCapabilities(body.capabilities);
    if (!parsedCapabilities.ok) {
      return NextResponse.json({ error: parsedCapabilities.error }, { status: 400 });
    }
    nextCapabilities = parsedCapabilities.capabilities;
    update.capabilities = nextCapabilities;
  }
  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be boolean" }, { status: 400 });
    }
    update.is_active = body.isActive;
  }
  if (body.notes !== undefined) {
    if (typeof body.notes !== "string") {
      return NextResponse.json({ error: "notes must be a string" }, { status: 400 });
    }
    update.notes = body.notes.trim() || null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Нет данных для обновления" }, { status: 400 });
  }
  const nextRecord = {
    ...current,
    preset: body.preset === undefined ? current.preset : body.preset,
    capabilities: nextCapabilities,
    isActive: typeof body.isActive === "boolean" ? body.isActive : current.isActive,
  };
  if (!hasConsistentOwnerGrant(nextRecord)) {
    return NextResponse.json(
      { error: "super_admin требует явный wildcard; wildcard допустим только для super_admin" },
      { status: 400 },
    );
  }

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
  const access = await authorizeStaffManagementRequest(request);
  if (!access.ok) return access.response;

  const { userId } = await context.params;
  const { auth, supabase } = access;
  const current = await fetchStaffSecurityRecord(supabase, userId);
  if (!current) {
    return NextResponse.json({ error: "Сотрудник не найден" }, { status: 404 });
  }
  const targetGuard = assertStaffTargetMutationAllowed({ actorId: auth.actorId, target: current });
  if (!targetGuard.ok) {
    return NextResponse.json(
      { error: targetGuard.error, code: targetGuard.code },
      { status: targetGuard.status },
    );
  }

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

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "staff.remove",
    entityType: "admin_staff",
    entityId: userId,
    payload: { preset: current.preset, capabilities: current.capabilities },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
