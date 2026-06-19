import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { TripsterBookingRequestView } from "@/types/tripster-booking";
import {
  fetchTripsterBookingRequestsAdmin,
  fetchTripsterBookingRequestsStatusStats,
} from "@/lib/tripster/booking-requests-server";

export type ExcursionAdminStats = {
  experiences: number;
  cities: number;
  reviews: number;
  clicksTotal: number;
  clicksLast7Days: number;
  withPartnerUrl: number;
  lastSync: {
    id: string;
    status: string;
    startedAt: string;
    finishedAt: string | null;
    experiencesSynced: number;
    citiesSynced: number;
    errorMessage: string | null;
  } | null;
  topClicks: Array<{ slug: string; count: number }>;
  recentClicks: Array<{
    id: string;
    experienceSlug: string;
    createdAt: string;
    referer: string | null;
  }>;
  tripsterBookingRequestsTotal: number;
  tripsterBookingRequestsByStatus: Record<string, number>;
  recentTripsterBookingRequests: TripsterBookingRequestView[];
};

export async function fetchExcursionAdminStats(
  supabase: SupabaseClient<Database>
): Promise<ExcursionAdminStats> {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [
    experiencesRes,
    citiesRes,
    reviewsRes,
    clicksTotalRes,
    clicksWeekRes,
    partnerUrlRes,
    lastSyncRes,
    recentClicksRes,
    tripsterRequestStats,
    recentTripsterRequests,
  ] = await Promise.all([
    supabase.from("tripster_experiences").select("id", { count: "exact", head: true }),
    supabase.from("tripster_cities").select("id", { count: "exact", head: true }),
    supabase.from("tripster_reviews").select("id", { count: "exact", head: true }),
    supabase.from("affiliate_link_clicks").select("id", { count: "exact", head: true }),
    supabase
      .from("affiliate_link_clicks")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase
      .from("tripster_experiences")
      .select("id", { count: "exact", head: true })
      .not("partner_url", "is", null),
    supabase
      .from("tripster_sync_runs")
      .select(
        "id, status, started_at, finished_at, experiences_synced, cities_synced, error_message"
      )
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("affiliate_link_clicks")
      .select("id, experience_slug, created_at, referer")
      .order("created_at", { ascending: false })
      .limit(20),
    fetchTripsterBookingRequestsStatusStats(supabase),
    fetchTripsterBookingRequestsAdmin(supabase, { limit: 40 }),
  ]);

  const { data: clickRows } = await supabase.from("affiliate_link_clicks").select("experience_slug");
  const counts = new Map<string, number>();
  for (const row of clickRows ?? []) {
    counts.set(row.experience_slug, (counts.get(row.experience_slug) ?? 0) + 1);
  }
  const topClicks = [...counts.entries()]
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const sync = lastSyncRes.data;

  return {
    experiences: experiencesRes.count ?? 0,
    cities: citiesRes.count ?? 0,
    reviews: reviewsRes.count ?? 0,
    clicksTotal: clicksTotalRes.count ?? 0,
    clicksLast7Days: clicksWeekRes.count ?? 0,
    withPartnerUrl: partnerUrlRes.count ?? 0,
    lastSync: sync
      ? {
          id: sync.id,
          status: sync.status,
          startedAt: sync.started_at,
          finishedAt: sync.finished_at,
          experiencesSynced: sync.experiences_synced,
          citiesSynced: sync.cities_synced,
          errorMessage: sync.error_message,
        }
      : null,
    topClicks,
    recentClicks: (recentClicksRes.data ?? []).map((row) => ({
      id: row.id,
      experienceSlug: row.experience_slug,
      createdAt: row.created_at,
      referer: row.referer,
    })),
    tripsterBookingRequestsTotal: tripsterRequestStats.total,
    tripsterBookingRequestsByStatus: tripsterRequestStats.byStatus,
    recentTripsterBookingRequests: recentTripsterRequests,
  };
}
