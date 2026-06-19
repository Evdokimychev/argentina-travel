import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { parseAnalyticsPeriod } from "@/lib/admin/analytics-period";
import { fetchAdminDashboardWidgets } from "@/lib/admin/dashboard-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "dashboard.view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const period = parseAnalyticsPeriod(url.searchParams.get("period"));

  const supabase = createSupabaseAdminClient();
  const widgets = await fetchAdminDashboardWidgets(supabase, period);

  return NextResponse.json({ widgets });
}
