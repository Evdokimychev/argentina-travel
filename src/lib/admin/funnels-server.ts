import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  formatMonthLabel,
  periodMonthKeys,
  periodStartIso,
} from "@/lib/admin/analytics-period";
import type {
  AdminAnalyticsFunnelsPayload,
  AnalyticsFunnelStep,
  AnalyticsFunnelStepId,
  AnalyticsMetric,
  AnalyticsMetricSource,
  AnalyticsPeriod,
} from "@/types/admin-analytics";
import { ANALYTICS_FUNNEL_STEP_LABELS } from "@/types/admin-analytics";
import { resolveAnalyticsFunnelTrust } from "@/lib/analytics/funnel-data-status";

type DbClient = SupabaseClient<Database>;
type CountMetric = AnalyticsMetric<number>;

const METRIC_SOURCES: Record<AnalyticsFunnelStepId, AnalyticsMetricSource> = {
  tour_view: "controlled_analytics_events",
  booking_started: "bookings",
  confirmed: "bookings",
  paid: "payment_ledger",
  review: "published_reviews",
};

function available(value: number, source: AnalyticsMetricSource): CountMetric {
  return { value, status: "available", source, message: null };
}

function unavailable(source: AnalyticsMetricSource, message: string): CountMetric {
  return { value: null, status: "unavailable", source, message };
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

function unavailableFunnelMetrics(message: string): Record<AnalyticsFunnelStepId, CountMetric> {
  return {
    tour_view: unavailable(METRIC_SOURCES.tour_view, message),
    booking_started: unavailable(METRIC_SOURCES.booking_started, message),
    confirmed: unavailable(METRIC_SOURCES.confirmed, message),
    paid: unavailable(METRIC_SOURCES.paid, message),
    review: unavailable(METRIC_SOURCES.review, message),
  };
}

async function fetchFunnelMetrics(
  supabase: DbClient,
  since: string | null,
): Promise<Record<AnalyticsFunnelStepId, CountMetric>> {
  let response: Awaited<ReturnType<typeof supabase.rpc<"admin_analytics_funnel_counts">>>;
  try {
    response = await supabase.rpc("admin_analytics_funnel_counts", { p_since: since });
  } catch {
    return unavailableFunnelMetrics("Не удалось подтвердить показатели в базе данных.");
  }
  const { data, error } = response;
  const row = data?.[0];
  if (error || !row) {
    return unavailableFunnelMetrics("Не удалось подтвердить показатели в базе данных.");
  }

  const values: Record<AnalyticsFunnelStepId, unknown> = {
    tour_view: row.tour_views,
    booking_started: row.booking_started,
    confirmed: row.confirmed,
    paid: row.paid,
    review: row.review,
  };
  const metrics = {} as Record<AnalyticsFunnelStepId, CountMetric>;
  for (const id of Object.keys(values) as AnalyticsFunnelStepId[]) {
    const value = Number(values[id]);
    metrics[id] = Number.isFinite(value) && value >= 0
      ? available(value, METRIC_SOURCES[id])
      : unavailable(METRIC_SOURCES[id], "Источник вернул некорректное значение.");
  }
  return metrics;
}

async function fetchBookingCohorts(
  supabase: DbClient,
  since: string | null,
  monthKeys: string[],
): Promise<Pick<AdminAnalyticsFunnelsPayload, "cohorts" | "cohortsMetric">> {
  let response: Awaited<ReturnType<typeof supabase.rpc<"admin_analytics_booking_cohorts">>>;
  try {
    response = await supabase.rpc("admin_analytics_booking_cohorts", { p_since: since });
  } catch {
    return {
      cohorts: [],
      cohortsMetric: unavailable("bookings", "Данные по месяцам сейчас недоступны."),
    };
  }
  const { data, error } = response;
  if (error || !data) {
    return {
      cohorts: [],
      cohortsMetric: unavailable("bookings", "Данные по месяцам сейчас недоступны."),
    };
  }

  const counts = new Map(data.map((row) => [row.month_key, Number(row.bookings) || 0]));
  const cohorts = monthKeys.map((month) => ({
    month,
    label: formatMonthLabel(month),
    bookings: counts.get(month) ?? 0,
    retentionStub: null,
  }));
  return {
    cohorts,
    cohortsMetric: available(
      cohorts.reduce((sum, row) => sum + row.bookings, 0),
      "bookings",
    ),
  };
}

export async function fetchAdminFunnels(
  supabase: DbClient,
  period: AnalyticsPeriod = "30d",
): Promise<AdminAnalyticsFunnelsPayload> {
  const since = periodStartIso(period);
  const monthKeys = periodMonthKeys(period);
  const [metrics, cohortData] = await Promise.all([
    fetchFunnelMetrics(supabase, since),
    fetchBookingCohorts(supabase, since, monthKeys),
  ]);
  const metricsAvailable = Object.values(metrics).every(
    (metric) => metric.status === "available" && metric.value !== null,
  );
  const trust = resolveAnalyticsFunnelTrust({ metricsAvailable });

  const funnelCounts = {} as Record<AnalyticsFunnelStepId, number>;
  if (metricsAvailable) {
    for (const id of Object.keys(metrics) as AnalyticsFunnelStepId[]) {
      funnelCounts[id] = metrics[id].value as number;
    }
  }

  return {
    period,
    periodStart: since,
    generatedAt: new Date().toISOString(),
    funnel: trust.trustedForKpi ? buildFunnelSteps(funnelCounts) : [],
    cohorts: cohortData.cohorts,
    metrics,
    cohortsMetric: cohortData.cohortsMetric,
    meta: trust,
  };
}
