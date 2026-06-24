import { buildAffiseAuthHeader } from "@/lib/youtravel/auth";
import { getYouTravelAffiseConfig } from "@/lib/youtravel/env";

export type AffiseStatsPeriod = {
  conversions: number;
  clicks: number | null;
};

export type AffiseConversionSummary = {
  configured: true;
  last7Days: AffiseStatsPeriod;
  last30Days: AffiseStatsPeriod;
};

type AffiseApiBody = {
  status?: number;
  error?: string;
  message?: string;
  pagination?: { total_count?: number };
  conversions?: unknown[];
  clicks?: unknown[];
};

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function resolvePeriodDates(days: number): { dateFrom: string; dateTo: string } {
  const today = new Date();
  const dateTo = formatIsoDate(today);
  const dateFrom = formatIsoDate(new Date(today.getTime() - days * 24 * 60 * 60 * 1000));
  return { dateFrom, dateTo };
}

async function fetchAffiseStatsTotal(
  apiBase: string,
  apiKey: string,
  resource: "conversions" | "clicks",
  dateFrom: string,
  dateTo: string
): Promise<number | null> {
  const path = `/3.0/stats/${resource}?limit=1&date_from=${dateFrom}&date_to=${dateTo}`;
  const response = await fetch(`${apiBase}${path}`, {
    headers: { ...buildAffiseAuthHeader(apiKey), Accept: "application/json" },
    cache: "no-store",
  });
  const body = (await response.json().catch(() => null)) as AffiseApiBody | null;

  if (!response.ok || body?.status !== 1) {
    if (resource === "clicks") return null;
    throw new Error(body?.error ?? body?.message ?? `Affise ${resource} API ${response.status}`);
  }

  const list = resource === "conversions" ? body?.conversions : body?.clicks;
  return body?.pagination?.total_count ?? list?.length ?? 0;
}

async function fetchAffisePeriodStats(
  apiBase: string,
  apiKey: string,
  days: number
): Promise<AffiseStatsPeriod> {
  const { dateFrom, dateTo } = resolvePeriodDates(days);
  const [conversions, clicks] = await Promise.all([
    fetchAffiseStatsTotal(apiBase, apiKey, "conversions", dateFrom, dateTo),
    fetchAffiseStatsTotal(apiBase, apiKey, "clicks", dateFrom, dateTo),
  ]);

  return {
    conversions: conversions ?? 0,
    clicks,
  };
}

export async function fetchAffiseDailyTotals(date: string): Promise<AffiseStatsPeriod> {
  const { apiBase, apiKey } = getYouTravelAffiseConfig();
  const [conversions, clicks] = await Promise.all([
    fetchAffiseStatsTotal(apiBase, apiKey, "conversions", date, date),
    fetchAffiseStatsTotal(apiBase, apiKey, "clicks", date, date),
  ]);

  return {
    conversions: conversions ?? 0,
    clicks,
  };
}

export async function fetchAffiseConversionSummary(): Promise<AffiseConversionSummary> {
  const { apiBase, apiKey } = getYouTravelAffiseConfig();
  const [last7Days, last30Days] = await Promise.all([
    fetchAffisePeriodStats(apiBase, apiKey, 7),
    fetchAffisePeriodStats(apiBase, apiKey, 30),
  ]);

  return {
    configured: true,
    last7Days,
    last30Days,
  };
}
