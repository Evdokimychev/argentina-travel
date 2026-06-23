import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchExcursionAdminStats } from "@/lib/tripster/admin-stats";
import { fetchYouTravelAdminBookingStats } from "@/lib/youtravel/admin-stats";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "marketplace.excursions");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();
  const [stats, youtravelStats] = await Promise.all([
    fetchExcursionAdminStats(supabase),
    fetchYouTravelAdminBookingStats(supabase),
  ]);

  return NextResponse.json({ stats: { ...stats, ...youtravelStats } });
}
