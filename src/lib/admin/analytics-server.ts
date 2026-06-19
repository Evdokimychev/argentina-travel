import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { buildContentInventory } from "@/lib/admin/content-inventory";
import { fetchAdminBookingsStats } from "@/lib/admin/bookings-server";

type DbClient = SupabaseClient<Database>;

export type AdminAnalyticsPayload = {
  operations: {
    newsletterCount: number;
    contactCount: number;
    shopOrderCount: number;
    bookingCount: number;
    bookingsByStatus: Record<string, number>;
  };
  marketplace: {
    tourCount: number;
    pendingModerationCount: number;
    excursionExperienceCount: number;
  };
  content: ReturnType<typeof buildContentInventory>["counts"];
};

export async function fetchAdminAnalytics(supabase: DbClient): Promise<AdminAnalyticsPayload> {
  const content = buildContentInventory();

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

  return {
    operations: {
      newsletterCount: newsletterRes.count ?? 0,
      contactCount: contactsRes.count ?? 0,
      shopOrderCount: shopRes.count ?? 0,
      bookingCount: bookingStats.total,
      bookingsByStatus: bookingStats.byStatus,
    },
    marketplace: {
      tourCount: toursRes.count ?? 0,
      pendingModerationCount: moderationRes.count ?? 0,
      excursionExperienceCount: experiencesRes.count ?? 0,
    },
    content: content.counts,
  };
}
