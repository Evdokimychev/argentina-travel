import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { resolveAdminCapabilitiesWithClient } from "@/lib/admin/staff";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { AdminSessionPayload } from "@/types/admin";

export async function GET() {
  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });
  }

  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);

  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const staff = await resolveAdminCapabilitiesWithClient(supabase, sessionUser);
  if (!staff) {
    return NextResponse.json({ error: "Нет доступа", code: "FORBIDDEN" }, { status: 403 });
  }

  const payload: AdminSessionPayload = {
    userId: staff.userId,
    capabilities: staff.capabilities,
    preset: staff.preset,
    via: "session",
  };

  return NextResponse.json(payload);
}
