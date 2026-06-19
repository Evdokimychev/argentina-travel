import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { parseAnalyticsPeriod } from "@/lib/admin/analytics-period";
import { fetchAdminAnalytics } from "@/lib/admin/analytics-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "analytics.view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const period = parseAnalyticsPeriod(url.searchParams.get("period"));

  const supabase = createSupabaseAdminClient();
  const analytics = await fetchAdminAnalytics(supabase, period);

  return NextResponse.json({ analytics });
}
