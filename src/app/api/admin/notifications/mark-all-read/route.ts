import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { markAllRead } from "@/lib/admin/notifications-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "dashboard.view");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const updated = await markAllRead(supabase);

  return NextResponse.json({ ok: true, updated });
}
