import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { parseAnalyticsPeriod } from "@/lib/admin/analytics-period";
import {
  buildExportFilename,
  fetchAdminAnalyticsExport,
  parseAnalyticsExportType,
} from "@/lib/admin/analytics-export-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "analytics.view");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const type = parseAnalyticsExportType(url.searchParams.get("type"));
  if (!type) {
    return NextResponse.json(
      { error: "Укажите type: bookings, reviews или payments" },
      { status: 400 }
    );
  }

  const period = parseAnalyticsPeriod(url.searchParams.get("period"));
  const supabase = createSupabaseAdminClient();
  const csv = await fetchAdminAnalyticsExport(supabase, type, period);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${buildExportFilename(type, period)}"`,
    },
  });
}
