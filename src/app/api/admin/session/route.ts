import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { resolveAdminCapabilitiesWithClient } from "@/lib/admin/staff";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AdminSessionPayload } from "@/types/admin";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json(
      { error: "Вход в панель временно недоступен. Обратитесь к владельцу сайта." },
      { status: 503, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);

  if (!sessionUser) {
    return NextResponse.json(
      { error: "Войдите в аккаунт администратора." },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const staff = await resolveAdminCapabilitiesWithClient(supabase, sessionUser);
  if (!staff) {
    return NextResponse.json(
      { error: "У этого аккаунта нет доступа к панели.", code: "FORBIDDEN" },
      { status: 403, headers: { "Cache-Control": "private, no-store" } },
    );
  }

  const payload: AdminSessionPayload = {
    userId: staff.userId,
    capabilities: staff.capabilities,
    preset: staff.preset,
    via: "session",
  };

  return NextResponse.json(payload, { headers: { "Cache-Control": "private, no-store" } });
}
