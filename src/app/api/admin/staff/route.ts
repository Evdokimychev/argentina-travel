import { NextResponse } from "next/server";
import { clientIpFromRequest, writeCriticalAdminAuditLog } from "@/lib/admin/audit";
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
      .select("user_id, preset, capabilities, is_active, notes, row_version, created_at, updated_at")
      .order("created_at", { ascending: false }),
    supabase.from("admin_role_presets").select("id, label, description, capabilities"),
  ]);

  if (staffRes.error || presetsRes.error) {
    return NextResponse.json({ error: "Не удалось загрузить список команды" }, { status: 503 });
  }

  const userIds = (staffRes.data ?? []).map((row) => row.user_id);
  let profiles: Array<{ id: string; email: string | null; first_name: string; last_name: string }> = [];
  if (userIds.length) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name")
      .in("id", userIds);
    if (error) {
      return NextResponse.json({ error: "Не удалось загрузить данные участников команды" }, { status: 503 });
    }
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
        rowVersion: row.row_version,
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

  const body = (await request.json().catch(() => null)) as PostBody | null;
  if (!body) {
    return NextResponse.json({ error: "Проверьте данные формы" }, { status: 400 });
  }
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
  if (typeof body.notes === "string" && body.notes.trim().length > 5000) {
    return NextResponse.json({ error: "Заметка не должна превышать 5000 символов" }, { status: 400 });
  }

  let userId = body.userId?.trim();
  if (!userId && body.email?.trim()) {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .ilike("email", body.email.trim())
      .maybeSingle();
    if (profileError) {
      return NextResponse.json({ error: "Не удалось найти пользователя" }, { status: 503 });
    }
    userId = profile?.id;
  }

  if (!userId) {
    return NextResponse.json({ error: "Укажите userId или email" }, { status: 400 });
  }

  const existingStaff = await fetchStaffSecurityRecord(supabase, userId);
  const targetGuard = assertStaffTargetMutationAllowed({
    actorId: auth.actorId,
    target: existingStaff ?? {
      userId,
      preset: null,
      capabilities: [],
      isActive: false,
      notes: null,
      rowVersion: 1,
    },
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

  const { error } = await supabase.rpc("admin_assign_staff_atomic", {
    p_actor_user_id: auth.actorId,
    p_target_user_id: userId,
    p_preset: assignment.preset,
    p_capabilities: assignment.capabilities,
    p_notes: body.notes?.trim() || null,
    p_ip_address: clientIpFromRequest(request),
  });
  if (error) {
    if (error.message.includes("USER_NOT_FOUND")) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
    }
    if (error.message.includes("STAFF_ALREADY_ASSIGNED")) {
      return NextResponse.json({ error: "Пользователь уже входит в команду" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "Не удалось назначить доступ. Состав команды не изменён." },
      { status: 409 },
    );
  }

  const audit = await writeCriticalAdminAuditLog({
    actorUserId: auth.actorId,
    action: "staff.role_change",
    entityType: "admin_staff",
    entityId: userId,
    payload: {
      mutation: "assign",
      preset: assignment.preset,
      capabilityCount: assignment.capabilities.length,
    },
    ipAddress: clientIpFromRequest(request),
  });
  if (!audit.ok) {
    return NextResponse.json(
      { error: "Не удалось записать журнал безопасности. Повторите позже.", code: "AUDIT_WRITE_FAILED" },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
