import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { parseAnalyticsPeriod } from "@/lib/admin/analytics-period";
import {
  fetchAdminPaymentOverview,
  summarizeAdminPaymentOverview,
} from "@/lib/admin/payments-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { AdminPaymentStatusFilter } from "@/types/admin-payments";

function parsePaymentStatus(value: string | null): AdminPaymentStatusFilter {
  if (value === "pending" || value === "partial" || value === "paid" || value === "refunded") {
    return value;
  }
  return "all";
}

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const period = parseAnalyticsPeriod(url.searchParams.get("period"));
  const status = parsePaymentStatus(url.searchParams.get("status"));

  const supabase = createSupabaseAdminClient();
  const payments = await fetchAdminPaymentOverview(supabase, { period, status });
  const stats = summarizeAdminPaymentOverview(payments);

  return NextResponse.json({ payments, stats, period, status });
}
