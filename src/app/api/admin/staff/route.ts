import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminPresetId } from "@/types/admin";

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
  userId?: string;
  email?: string;
  preset?: AdminPresetId | null;
  capabilities?: string[];
  notes?: string;
};

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "users.manage");
  if (!auth.ok) return auth.response;

  const body = (await request.json()) as PostBody;
  const supabase = createSupabaseAdminClient();

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("roles")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: "Пользователь не найден" }, { status: 404 });
  }

  const roles = profile.roles ?? [];
  if (!roles.includes("admin")) {
    await supabase
      .from("profiles")
      .update({ roles: [...roles, "admin"], active_role: "admin" })
      .eq("id", userId);
  }

  const { error } = await supabase.from("admin_staff").upsert(
    {
      user_id: userId,
      preset: body.preset ?? "support_agent",
      capabilities: body.capabilities ?? [],
      is_active: true,
      notes: body.notes?.trim() || null,
      invited_by: auth.actorId,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "staff.assign",
    entityType: "admin_staff",
    entityId: userId,
    payload: { preset: body.preset ?? null },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json({ ok: true });
}
