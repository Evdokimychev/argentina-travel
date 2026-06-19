import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { userHasAccountRole } from "@/types/user";

type RouteContext = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, context: RouteContext) {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Интеграции недоступны" }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);

  if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();

  const { data: existing, error: fetchError } = await admin
    .from("api_keys")
    .select("id, label, is_active, organizer_id")
    .eq("id", id)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!existing) {
    return NextResponse.json({ error: "Ключ не найден" }, { status: 404 });
  }
  if (existing.organizer_id !== sessionUser.id) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }
  if (!existing.is_active) {
    return NextResponse.json({ ok: true, alreadyRevoked: true });
  }

  const revokedAt = new Date().toISOString();
  const { error } = await admin
    .from("api_keys")
    .update({ is_active: false, revoked_at: revokedAt })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, revokedAt });
}
