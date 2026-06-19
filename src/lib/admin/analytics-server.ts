import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { buildContentInventory } from "@/lib/admin/content-inventory";
import {
  bucketCreatedAtByDay,
  periodDayKeys,
  periodStartIso,
} from "@/lib/admin/analytics-period";
import type { AdminAnalyticsV2Payload, AnalyticsPeriod } from "@/types/admin-analytics";

type DbClient = SupabaseClient<Database>;

/** @deprecated Use AdminAnalyticsV2Payload */
export type AdminAnalyticsPayload = AdminAnalyticsV2Payload;

function applySince<T extends { gte: (col: string, val: string) => T }>(
  query: T,
  since: string | null,
  column = "created_at"
): T {
  return since ? query.gte(column, since) : query;
}

async function countSince(
  supabase: DbClient,
  table: "newsletter_subscribers" | "contact_submissions" | "shop_orders" | "bookings" | "tours",
  since: string | null
): Promise<number> {
  let query = supabase.from(table).select("id", { count: "exact", head: true });
  query = applySince(query, since);
  const { count } = await query;
  return count ?? 0;
}

async function fetchTimestampsSince(
  supabase: DbClient,
  table: "newsletter_subscribers" | "contact_submissions" | "shop_orders" | "bookings",
  since: string | null
): Promise<string[]> {
  let query = supabase.from(table).select("created_at").order("created_at", { ascending: false }).limit(5000);
  query = applySince(query, since);
  const { data } = await query;
  return (data ?? []).map((row) => row.created_at);
}

async function fetchBookingMetrics(
  supabase: DbClient,
  since: string | null
): Promise<{ byStatus: Record<string, number>; pipelineUsd: number }> {
  let query = supabase.from("bookings").select("status, total_price_usd").limit(5000);
  query = applySince(query, since);
  const { data } = await query;

  const byStatus: Record<string, number> = {};
  let pipelineUsd = 0;
  for (const row of data ?? []) {
    byStatus[row.status] = (byStatus[row.status] ?? 0) + 1;
    if (row.status !== "cancelled") {
      pipelineUsd += Number(row.total_price_usd) || 0;
    }
  }
  return { byStatus, pipelineUsd };
}

async function fetchShopRevenue(
  supabase: DbClient,
  since: string | null
): Promise<{ paidUsd: number; orderUsd: number }> {
  let query = supabase.from("shop_orders").select("price_usd, payment_status, status").limit(5000);
  query = applySince(query, since);
  const { data } = await query;

  let paidUsd = 0;
  let orderUsd = 0;
  for (const row of data ?? []) {
    const price = Number(row.price_usd) || 0;
    orderUsd += price;
    if (row.payment_status === "paid" || row.status === "paid" || row.status === "delivered") {
      paidUsd += price;
    }
  }
  return { paidUsd, orderUsd };
}

async function fetchContactsByKind(
  supabase: DbClient,
  since: string | null
): Promise<Record<string, number>> {
  let query = supabase.from("contact_submissions").select("kind").limit(5000);
  query = applySince(query, since);
  const { data } = await query;

  const byKind: Record<string, number> = {};
  for (const row of data ?? []) {
    byKind[row.kind] = (byKind[row.kind] ?? 0) + 1;
  }
  return byKind;
}

export async function fetchAdminAnalytics(
  supabase: DbClient,
  period: AnalyticsPeriod = "30d"
): Promise<AdminAnalyticsV2Payload> {
  const content = buildContentInventory();
  const since = periodStartIso(period);
  const dayKeys = periodDayKeys(period);

  const [
    newsletterCount,
    contactCount,
    shopOrderCount,
    bookingCount,
    tourCount,
    moderationRes,
    experiencesRes,
    newToursInPeriod,
    bookingMetrics,
    shopRevenue,
    contactsByKind,
    newsletterTs,
    contactTs,
    shopTs,
    bookingTs,
  ] = await Promise.all([
    countSince(supabase, "newsletter_subscribers", since),
    countSince(supabase, "contact_submissions", since),
    countSince(supabase, "shop_orders", since),
    countSince(supabase, "bookings", since),
    countSince(supabase, "tours", null),
    supabase
      .from("moderation_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase.from("tripster_experiences").select("id", { count: "exact", head: true }),
    countSince(supabase, "tours", since),
    fetchBookingMetrics(supabase, since),
    fetchShopRevenue(supabase, since),
    fetchContactsByKind(supabase, since),
    fetchTimestampsSince(supabase, "newsletter_subscribers", since),
    fetchTimestampsSince(supabase, "contact_submissions", since),
    fetchTimestampsSince(supabase, "shop_orders", since),
    fetchTimestampsSince(supabase, "bookings", since),
  ]);

  const trends =
    dayKeys.length > 0
      ? {
          bookingsByDay: bucketCreatedAtByDay(bookingTs, dayKeys),
          contactsByDay: bucketCreatedAtByDay(contactTs, dayKeys),
          shopOrdersByDay: bucketCreatedAtByDay(shopTs, dayKeys),
          newsletterByDay: bucketCreatedAtByDay(newsletterTs, dayKeys),
        }
      : {
          bookingsByDay: [],
          contactsByDay: [],
          shopOrdersByDay: [],
          newsletterByDay: [],
        };

  return {
    period,
    periodStart: since,
    operations: {
      newsletterCount,
      contactCount,
      shopOrderCount,
      bookingCount,
      bookingsByStatus: bookingMetrics.byStatus,
      contactsByKind,
      bookingPipelineUsd: Math.round(bookingMetrics.pipelineUsd),
      shopPaidUsd: Math.round(shopRevenue.paidUsd),
      shopOrderUsd: Math.round(shopRevenue.orderUsd),
    },
    marketplace: {
      tourCount,
      pendingModerationCount: moderationRes.count ?? 0,
      excursionExperienceCount: experiencesRes.count ?? 0,
      newToursInPeriod,
    },
    content: content.counts,
    trends,
  };
}
