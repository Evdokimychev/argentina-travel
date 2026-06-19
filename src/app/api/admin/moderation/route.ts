import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchModerationQueue } from "@/lib/admin/moderation-server";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.moderation");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const items = await fetchModerationQueue(supabase);

  return NextResponse.json({ items, count: items.length });
}
