import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  fetchAdminBookingsStats,
  fetchAllBookingsAdmin,
} from "@/lib/admin/bookings-server";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "all";

  const supabase = createSupabaseAdminClient();
  const [bookings, stats] = await Promise.all([
    fetchAllBookingsAdmin(supabase, { status }),
    fetchAdminBookingsStats(supabase),
  ]);

  return NextResponse.json({ bookings, stats });
}
