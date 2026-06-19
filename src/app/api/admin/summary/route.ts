import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchAdminBookingsStats } from "@/lib/admin/bookings-server";
import type { AdminDashboardSummary } from "@/types/admin";

export async function GET(request: Request) {
  const auth = await authorizeAdminRequest(request, "dashboard.view");
  if (!auth.ok) return auth.response;

  const supabase = createSupabaseAdminClient();

  const [
    newsletterRes,
    contactsRes,
    shopRes,
    toursRes,
    moderationRes,
    experiencesRes,
    bookingStats,
  ] = await Promise.all([
    supabase.from("newsletter_subscribers").select("id", { count: "exact", head: true }),
    supabase.from("contact_submissions").select("id", { count: "exact", head: true }),
    supabase.from("shop_orders").select("id", { count: "exact", head: true }),
    supabase.from("tours").select("id", { count: "exact", head: true }),
    supabase
      .from("moderation_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("tripster_experiences").select("id", { count: "exact", head: true }),
    fetchAdminBookingsStats(supabase),
  ]);

  const summary: AdminDashboardSummary = {
    newsletterCount: newsletterRes.error ? 0 : (newsletterRes.count ?? 0),
    contactCount: contactsRes.error ? 0 : (contactsRes.count ?? 0),
    shopOrderCount: shopRes.error ? 0 : (shopRes.count ?? 0),
    tourCount: toursRes.error ? 0 : (toursRes.count ?? 0),
    pendingModerationCount: moderationRes.error ? 0 : (moderationRes.count ?? 0),
    excursionExperienceCount: experiencesRes.error ? 0 : (experiencesRes.count ?? 0),
    bookingCount: bookingStats.total,
  };

  return NextResponse.json({ summary });
}
