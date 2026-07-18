import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { buildContentInventory } from "@/lib/admin/content-inventory";
import { fetchTopAttributionSources } from "@/lib/attribution/attribution-server";
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
  const { count, error } = await query;
  if (error) throw new Error(`${table}_count_unavailable`);
  return count ?? 0;
}

async function fetchTimestampsSince(
  supabase: DbClient,
  table: "newsletter_subscribers" | "contact_submissions" | "shop_orders" | "bookings",
  since: string | null
): Promise<string[]> {
  let query = supabase.from(table).select("created_at").order("created_at", { ascending: false }).limit(5000);
  query = applySince(query, since);
  const { data, error } = await query;
  if (error) throw new Error(`${table}_timestamps_unavailable`);
  return (data ?? []).map((row) => row.created_at);
}

async function fetchBookingMetrics(
  supabase: DbClient,
  since: string | null
): Promise<{ byStatus: Record<string, number>; pipelineUsd: number }> {
  let query = supabase.from("bookings").select("status, total_price_usd").limit(5000);
  query = applySince(query, since);
  const { data, error } = await query;
  if (error) throw new Error("booking_metrics_unavailable");

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
  const { data, error } = await query;
  if (error) throw new Error("shop_revenue_unavailable");

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
  const { data, error } = await query;
  if (error) throw new Error("contacts_by_kind_unavailable");

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
  const unavailableMetrics: string[] = [];

  async function metric<T>(key: string, load: () => Promise<T>): Promise<T | null> {
    try {
      return await load();
    } catch {
      unavailableMetrics.push(key);
      return null;
    }
  }

  const [
    newsletterCount,
    contactCount,
    shopOrderCount,
    bookingCount,
    tourCount,
    pendingModerationCount,
    excursionExperienceCount,
    newToursInPeriod,
    bookingMetrics,
    shopRevenue,
    contactsByKind,
    topAttributionSources,
    newsletterTs,
    contactTs,
    shopTs,
    bookingTs,
  ] = await Promise.all([
    metric("operations.newsletterCount", () => countSince(supabase, "newsletter_subscribers", since)),
    metric("operations.contactCount", () => countSince(supabase, "contact_submissions", since)),
    metric("operations.shopOrderCount", () => countSince(supabase, "shop_orders", since)),
    metric("operations.bookingCount", () => countSince(supabase, "bookings", since)),
    metric("marketplace.tourCount", () => countSince(supabase, "tours", null)),
    metric("marketplace.pendingModerationCount", async () => {
      const { count, error } = await supabase
        .from("moderation_queue")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      if (error) throw new Error("moderation_count_unavailable");
      return count ?? 0;
    }),
    metric("marketplace.excursionExperienceCount", async () => {
      const { count, error } = await supabase
        .from("tripster_experiences")
        .select("id", { count: "exact", head: true });
      if (error) throw new Error("experience_count_unavailable");
      return count ?? 0;
    }),
    metric("marketplace.newToursInPeriod", () => countSince(supabase, "tours", since)),
    metric("operations.bookingMetrics", () => fetchBookingMetrics(supabase, since)),
    metric("operations.shopRevenue", () => fetchShopRevenue(supabase, since)),
    metric("operations.contactsByKind", () => fetchContactsByKind(supabase, since)),
    metric("operations.topAttributionSources", () => fetchTopAttributionSources(supabase, since)),
    metric("trends.newsletterByDay", () => fetchTimestampsSince(supabase, "newsletter_subscribers", since)),
    metric("trends.contactsByDay", () => fetchTimestampsSince(supabase, "contact_submissions", since)),
    metric("trends.shopOrdersByDay", () => fetchTimestampsSince(supabase, "shop_orders", since)),
    metric("trends.bookingsByDay", () => fetchTimestampsSince(supabase, "bookings", since)),
  ]);

  const trends =
    dayKeys.length > 0
      ? {
          bookingsByDay: bookingTs ? bucketCreatedAtByDay(bookingTs, dayKeys) : null,
          contactsByDay: contactTs ? bucketCreatedAtByDay(contactTs, dayKeys) : null,
          shopOrdersByDay: shopTs ? bucketCreatedAtByDay(shopTs, dayKeys) : null,
          newsletterByDay: newsletterTs ? bucketCreatedAtByDay(newsletterTs, dayKeys) : null,
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
      bookingsByStatus: bookingMetrics?.byStatus ?? null,
      contactsByKind,
      bookingPipelineUsd: bookingMetrics ? Math.round(bookingMetrics.pipelineUsd) : null,
      shopPaidUsd: shopRevenue ? Math.round(shopRevenue.paidUsd) : null,
      shopOrderUsd: shopRevenue ? Math.round(shopRevenue.orderUsd) : null,
      topAttributionSources,
    },
    marketplace: {
      tourCount,
      pendingModerationCount,
      excursionExperienceCount,
      newToursInPeriod,
    },
    content: content.counts,
    trends,
    dataQuality: {
      status: unavailableMetrics.length > 0 ? "partial" : "ok",
      checkedAt: new Date().toISOString(),
      unavailableMetrics: [...new Set(unavailableMetrics)].sort(),
    },
  };
}
