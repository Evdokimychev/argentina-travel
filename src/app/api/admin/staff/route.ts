import { NextResponse } from "next/server";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import {
  assertStaffTargetMutationAllowed,
  authorizeStaffManagementRequest,
  fetchStaffSecurityRecord,
  hasConsistentOwnerGrant,
  isAdminPresetId,
  parseAdminCapabilities,
} from "@/lib/admin/staff-management";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "users.manage");
  if (!auth.ok) return auth.response;
  const supabase = createSupabaseAdminClient();

  const [staffRes, presetsRes] = await Promise.all([
    supabase
      .from("admin_staff")
      .select("user_id, preset, capabilities, is_active, notes, created_at, updated_at")
      .order("created_at", { ascending: false }),
    supabase.from("admin_role_presets").select("id, label, description, capabilities"),
  ]);

  if (staffRes.error) {
    return NextResponse.json({ error: staffRes.error.message }, { status: 500 });
  }

  const userIds = (staffRes.data ?? []).map((row) => row.user_id);
  let profiles: Array<{ id: string; email: string | null; first_name: string; last_name: string }> = [];
  if (userIds.length) {
    const { data } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name")
      .in("id", userIds);
    profiles = data ?? [];
  }
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  return NextResponse.json({
    presets: presetsRes.data ?? [],
    staff: (staffRes.data ?? []).map((row) => {
      const profile = profileById.get(row.user_id);
      return {
        userId: row.user_id,
        email: profile?.email ?? null,
        fullName: profile
          ? [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim()
          : row.user_id,
        preset: row.preset,
        capabilities: row.capabilities,
        isActive: row.is_active,
        notes: row.notes,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    }),
  });
}

type PostBody = {
  userId?: unknown;
  email?: unknown;
  preset?: unknown;
  capabilities?: unknown;
  notes?: unknown;
};

export async function POST(request: Request) {
  const access = await authorizeStaffManagementRequest(request);
  if (!access.ok) return access.response;

  const body = (await request.json()) as PostBody;
  const { auth, supabase } = access;

  if (body.userId !== undefined && typeof body.userId !== "string") {
    return NextResponse.json({ error: "userId должен быть строкой" }, { status: 400 });
  }
  if (body.email !== undefined && typeof body.email !== "string") {
    return NextResponse.json({ error: "email должен быть строкой" }, { status: 400 });
  }
  if (body.notes !== undefined && typeof body.notes !== "string") {
    return NextResponse.json({ error: "notes должен быть строкой" }, { status: 400 });
  }

  let userId = body.userId?.trim();
  if (!userId && body.email?.trim()) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", body.email.trim())
      .maybeSingle();
    userId = profile?.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Укажите userId или email" }, { status: 400 });
  }

  const existingStaff = await fetchStaffSecurityRecord(supabase, userId);
  const targetGuard = assertStaffTargetMutationAllowed({
    actorId: auth.actorId,
    target: existingStaff ?? { userId, preset: null, capabilities: [], isActive: false },
  });
  if (!targetGuard.ok) {
    return NextResponse.json(
      { error: targetGuard.error, code: targetGuard.code },
      { status: targetGuard.status },
    );
  }
  if (existingStaff) {
    return NextResponse.json(
      { error: "Сотрудник уже назначен. Используйте изменение записи." },
      { status: 409 },
    );
  }

  const preset = body.preset === undefined ? "support_agent" : body.preset;
  if (!isAdminPresetId(preset)) {
    return NextResponse.json({ error: "Неизвестный preset" }, { status: 400 });
  }
  const parsedCapabilities = parseAdminCapabilities(body.capabilities ?? []);
  if (!parsedCapabilities.ok) {
    return NextResponse.json({ error: parsedCapabilities.error }, { status: 400 });
  }
  const assignment = {
    userId,
    preset,
    capabilities: parsedCapabilities.capabilities,
    isActive: true,
  };
  if (!hasConsistentOwnerGrant(assignment)) {
    return NextResponse.json(
      { error: "super_admin требует явный wildcard; wildcard допустим только для super_admin" },
      { status: 400 },
    );
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  const roles = profile.roles ?? [];
  const { error } = await supabase.from("admin_staff").insert({
    user_id: userId,
    preset: assignment.preset,
    capabilities: assignment.capabilities,
    is_active: true,
    notes: body.notes?.trim() || null,
    invited_by: auth.actorId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!roles.includes("admin")) {
    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({ roles: [...roles, "admin"], active_role: "admin" })
      .eq("id", userId);

    if (profileUpdateError) {
      // Fail closed: a half-created staff row must not survive a profile update
      // failure and block a safe retry. Access still requires both records.
      await supabase.from("admin_staff").delete().eq("user_id", userId);
      return NextResponse.json(
        { error: "Не удалось подтвердить роль администратора" },
        { status: 500 },
      );
    }
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "staff.assign",
    entityType: "admin_staff",
    entityId: userId,
    payload: { preset: assignment.preset, capabilities: assignment.capabilities },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
