import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchAdminPaymentOverview,
  summarizeAdminPaymentOverview,
} from "@/lib/admin/payments-server";
import { countUnreadNotifications } from "@/lib/admin/notifications-server";
import { syncPendingToursToQueue } from "@/lib/admin/moderation-server";
import { countPendingOrganizerApplications } from "@/lib/admin/organizer-applications-server";
import { fetchAdminHealthSnapshot } from "@/lib/admin/health-server";
import { syncPendingReviewsToQueue } from "@/lib/reviews-server";
import type { AdminOperationsSummary } from "@/types/admin";
import type { Database } from "@/types/database";

type DbClient = SupabaseClient<Database>;

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function resolveAgeMinutes(timestamp: string | null): number | null {
  if (!timestamp) return null;
  const parsed = Date.parse(timestamp);
  if (Number.isNaN(parsed)) return null;
  return Math.max(0, Math.floor((Date.now() - parsed) / 60000));
}

async function fetchModerationSummary(
  supabase: DbClient
): Promise<AdminOperationsSummary["moderation"]> {
  await Promise.all([syncPendingToursToQueue(supabase), syncPendingReviewsToQueue(supabase)]);

  const [countRes, oldestRes] = await Promise.all([
    supabase
      .from("moderation_queue")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("moderation_queue")
      .select("created_at")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const oldestPendingCreatedAt = oldestRes.data?.created_at ?? null;

  return {
    pendingCount: countRes.count ?? 0,
    oldestPendingCreatedAt,
    oldestPendingAgeMinutes: resolveAgeMinutes(oldestPendingCreatedAt),
  };
}

async function countLeadsLast24Hours(supabase: DbClient): Promise<number> {
  const since = new Date(Date.now() - ONE_DAY_MS).toISOString();
  const [newsletterRes, contactsRes] = await Promise.all([
    supabase
      .from("newsletter_subscribers")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
    supabase
      .from("contact_submissions")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since),
  ]);
  return (newsletterRes.count ?? 0) + (contactsRes.count ?? 0);
}

async function countPendingOrPartialPayments(supabase: DbClient): Promise<number> {
  const payments = await fetchAdminPaymentOverview(supabase, { period: "all", status: "all" });
  const stats = summarizeAdminPaymentOverview(payments);
  return stats.byStatus.pending + stats.byStatus.partial;
}

export async function fetchAdminOperationsSummary(
  supabase: DbClient
): Promise<AdminOperationsSummary> {
  const [moderation, newLeads24h, unreadCount, pendingPaymentCount, pendingApplications, health] =
    await Promise.all([
      fetchModerationSummary(supabase),
      countLeadsLast24Hours(supabase),
      countUnreadNotifications(supabase),
      countPendingOrPartialPayments(supabase),
      countPendingOrganizerApplications(supabase),
      fetchAdminHealthSnapshot(supabase),
    ]);

  return {
    generatedAt: new Date().toISOString(),
    moderation,
    leads: {
      newLast24h: newLeads24h,
    },
    notifications: {
      unreadCount,
    },
    payments: {
      pendingOrPartialCount: pendingPaymentCount,
    },
    organizerApplications: {
      pendingCount: pendingApplications,
    },
    health: {
      ok: health.ok,
      status: health.ok ? "ok" : "degraded",
      generatedAt: health.generatedAt,
      checks: {
        database: health.checks.database.ok,
        rls: health.checks.rls.ok,
        sync: health.checks.sync.ok,
      },
    },
  };
}
