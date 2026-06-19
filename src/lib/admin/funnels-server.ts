import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  bucketCreatedAtByMonth,
  formatMonthLabel,
  periodMonthKeys,
  periodStartIso,
} from "@/lib/admin/analytics-period";
import type {
  AdminAnalyticsFunnelsPayload,
  AnalyticsFunnelStep,
  AnalyticsFunnelStepId,
  AnalyticsPeriod,
} from "@/types/admin-analytics";
import { ANALYTICS_FUNNEL_STEP_LABELS } from "@/types/admin-analytics";

type DbClient = SupabaseClient<Database>;

function applySince<T extends { gte: (col: string, val: string) => T }>(
  query: T,
  since: string | null,
  column = "created_at"
): T {
  return since ? query.gte(column, since) : query;
}

function rate(part: number, whole: number): number | null {
  if (whole <= 0) return null;
  return Math.round((part / whole) * 1000) / 10;
}

function buildFunnelSteps(counts: Record<AnalyticsFunnelStepId, number>): AnalyticsFunnelStep[] {
  const order: AnalyticsFunnelStepId[] = [
    "tour_view",
    "booking_started",
    "confirmed",
    "paid",
    "review",
  ];
  const first = counts.tour_view;

  return order.map((id, index) => {
    const count = counts[id];
    const previous = index > 0 ? counts[order[index - 1]!] : null;
    return {
      id,
      label: ANALYTICS_FUNNEL_STEP_LABELS[id],
      count,
      rateFromPrevious: previous != null ? rate(count, previous) : null,
      rateFromFirst: index > 0 ? rate(count, first) : null,
    };
  });
}

async function countTourViews(
  supabase: DbClient,
  since: string | null
): Promise<{ count: number; source: "events" | "estimate"; hasData: boolean }> {
  let query = supabase
    .from("analytics_events")
    .select("id", { count: "exact", head: true })
    .eq("event_type", "tour_view");
  query = applySince(query, since);

  const { count, error } = await query;
  if (!error && (count ?? 0) > 0) {
    return { count: count ?? 0, source: "events", hasData: true };
  }

  const [bookingsRes, inquiriesRes] = await Promise.all([
    applySince(supabase.from("bookings").select("id", { count: "exact", head: true }), since),
    applySince(
      supabase
        .from("contact_submissions")
        .select("id", { count: "exact", head: true })
        .eq("kind", "tour_inquiry"),
      since
    ),
  ]);

  const bookingCount = bookingsRes.count ?? 0;
  const inquiryCount = inquiriesRes.count ?? 0;
  const estimate = bookingCount + inquiryCount;

  return {
    count: estimate,
    source: "estimate",
    hasData: estimate > 0,
  };
}

async function countBookingsStarted(supabase: DbClient, since: string | null): Promise<number> {
  let query = supabase.from("bookings").select("id", { count: "exact", head: true });
  query = applySince(query, since);
  const { count } = await query;
  return count ?? 0;
}

async function countConfirmedBookings(supabase: DbClient, since: string | null): Promise<number> {
  let query = supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("status", ["confirmed", "completed"]);
  query = applySince(query, since);
  const { count } = await query;
  return count ?? 0;
}

async function countPaidBookings(supabase: DbClient, since: string | null): Promise<number> {
  let bookingQuery = supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .in("payment_status", ["paid", "partial"]);
  bookingQuery = applySince(bookingQuery, since);
  const bookingRes = await bookingQuery;

  let txQuery = supabase
    .from("payment_transactions")
    .select("booking_id", { count: "exact", head: true })
    .in("status", ["completed", "succeeded", "paid"])
    .eq("type", "charge");
  txQuery = applySince(txQuery, since);
  const txRes = await txQuery;

  return Math.max(bookingRes.count ?? 0, txRes.count ?? 0);
}

async function countReviews(supabase: DbClient, since: string | null): Promise<number> {
  let query = supabase.from("tourist_reviews").select("id", { count: "exact", head: true });
  query = applySince(query, since);
  const { count } = await query;
  return count ?? 0;
}

async function fetchBookingTimestamps(supabase: DbClient, since: string | null): Promise<string[]> {
  let query = supabase
    .from("bookings")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(5000);
  query = applySince(query, since);
  const { data } = await query;
  return (data ?? []).map((row) => row.created_at);
}

export async function fetchAdminFunnels(
  supabase: DbClient,
  period: AnalyticsPeriod = "30d"
): Promise<AdminAnalyticsFunnelsPayload> {
  const since = periodStartIso(period);
  const monthKeys = periodMonthKeys(period);

  const [tourViews, bookingStarted, confirmed, paid, review, bookingTimestamps] =
    await Promise.all([
      countTourViews(supabase, since),
      countBookingsStarted(supabase, since),
      countConfirmedBookings(supabase, since),
      countPaidBookings(supabase, since),
      countReviews(supabase, since),
      fetchBookingTimestamps(supabase, since),
    ]);

  const funnelCounts: Record<AnalyticsFunnelStepId, number> = {
    tour_view: Math.max(tourViews.count, bookingStarted),
    booking_started: bookingStarted,
    confirmed,
    paid,
    review,
  };

  const monthlyBuckets = bucketCreatedAtByMonth(bookingTimestamps, monthKeys);
  const cohorts = monthlyBuckets.map((row) => ({
    month: row.month,
    label: formatMonthLabel(row.month),
    bookings: row.count,
    retentionStub: null,
  }));

  return {
    period,
    periodStart: since,
    generatedAt: new Date().toISOString(),
    funnel: buildFunnelSteps(funnelCounts),
    cohorts,
    meta: {
      tourViewsSource: tourViews.source,
      hasTourViewData: tourViews.hasData,
    },
  };
}
