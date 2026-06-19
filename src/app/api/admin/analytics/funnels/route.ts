import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { parseAnalyticsPeriod } from "@/lib/admin/analytics-period";
import { fetchAdminFunnels } from "@/lib/admin/funnels-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "analytics.view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const period = parseAnalyticsPeriod(url.searchParams.get("period"));

  const supabase = createSupabaseAdminClient();
  const funnels = await fetchAdminFunnels(supabase, period);

  return NextResponse.json({ funnels });
}
