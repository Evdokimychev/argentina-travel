import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAdminAnalytics } from "@/lib/admin/analytics-server";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "analytics.view");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const analytics = await fetchAdminAnalytics(supabase);

  return NextResponse.json({ analytics });
}
