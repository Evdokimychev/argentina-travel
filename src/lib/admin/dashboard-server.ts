import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  bucketCreatedAtByDay,
  periodDayKeys,
  periodStartIso,
} from "@/lib/admin/analytics-period";
import type { AdminDashboardWidgets } from "@/types/admin";
import type { AnalyticsPeriod } from "@/types/admin-analytics";

type DbClient = SupabaseClient<Database>;

function applySince<T extends { gte: (col: string, val: string) => T }>(
  query: T,
  since: string | null,
  column = "created_at"
): T {
  return since ? query.gte(column, since) : query;
}

async function countSince(
  supabase: DbClient,
  table: "newsletter_subscribers" | "contact_submissions" | "shop_orders" | "bookings",
  since: string | null
): Promise<number> {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  query = applySince(query, since);
  const { count } = await query;
  return count ?? 0;
}

async function fetchTimestampsSince(
  supabase: DbClient,
  table: "newsletter_subscribers" | "contact_submissions" | "bookings",
  since: string | null
): Promise<string[]> {
  let query = supabase.from(table).select("created_at").order("created_at", { ascending: false }).limit(5000);
  query = applySince(query, since);
  const { data } = await query;
  return (data ?? []).map((row) => row.created_at);
}

async function fetchBookingRevenueUsd(supabase: DbClient, since: string | null): Promise<number> {
  let query = supabase.from("bookings").select("status, total_price_usd").limit(5000);
  query = applySince(query, since);
  const { data } = await query;

  let total = 0;
  for (const row of data ?? []) {
    if (row.status === "cancelled") continue;
    total += Number(row.total_price_usd) || 0;
  }
  return Math.round(total);
}

export async function fetchAdminDashboardWidgets(
  supabase: DbClient,
  period: AnalyticsPeriod = "30d"
): Promise<AdminDashboardWidgets> {
  const since = periodStartIso(period);
  const dayKeys = periodDayKeys(period);

  const [
    newBookings,
    newsletterCount,
    contactCount,
    shopOrders,
    pendingModerationRes,
    bookingRevenueUsd,
    bookingTimestamps,
    newsletterTimestamps,
    contactTimestamps,
  ] = await Promise.all([
    countSince(supabase, "bookings", since),
    countSince(supabase, "newsletter_subscribers", since),
    countSince(supabase, "contact_submissions", since),
    countSince(supabase, "shop_orders", since),
    supabase
      .from("moderation_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    fetchBookingRevenueUsd(supabase, since),
    fetchTimestampsSince(supabase, "bookings", since),
    fetchTimestampsSince(supabase, "newsletter_subscribers", since),
    fetchTimestampsSince(supabase, "contact_submissions", since),
  ]);

  const bookingsByDay = dayKeys.length > 0 ? bucketCreatedAtByDay(bookingTimestamps, dayKeys) : [];
  const newsletterByDay = dayKeys.length > 0 ? bucketCreatedAtByDay(newsletterTimestamps, dayKeys) : [];
  const contactsByDay = dayKeys.length > 0 ? bucketCreatedAtByDay(contactTimestamps, dayKeys) : [];
  const leadsByDay =
    dayKeys.length > 0
      ? dayKeys.map((date, index) => ({
          date,
          count: (newsletterByDay[index]?.count ?? 0) + (contactsByDay[index]?.count ?? 0),
        }))
      : [];

  return {
    period,
    periodStart: since,
    generatedAt: new Date().toISOString(),
    totals: {
      newBookings,
      newLeads: newsletterCount + contactCount,
      shopOrders,
      pendingModeration: pendingModerationRes.count ?? 0,
      bookingRevenueUsd,
    },
    trends: {
      bookingsByDay,
      leadsByDay,
    },
  };
}
