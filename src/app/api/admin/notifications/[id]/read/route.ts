import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { markRead } from "@/lib/admin/notifications-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "dashboard.view");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const supabase = createSupabaseAdminClient();
  const notification = await markRead(supabase, id);

  if (!notification) {
    return NextResponse.json({ error: "Уведомление не найдено" }, { status: 404 });
  }

  return NextResponse.json({ notification });
}
