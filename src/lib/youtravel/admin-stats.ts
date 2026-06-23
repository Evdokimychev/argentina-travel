import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { YouTravelBookingRequestView } from "@/types/youtravel-booking";
import {
  fetchYouTravelBookingRequestsAdmin,
  fetchYouTravelBookingRequestsStatusStats,
} from "@/lib/youtravel/booking-requests-server";

export type YouTravelAdminBookingStats = {
  youtravelBookingRequestsTotal: number;
  youtravelBookingRequestsByStatus: Record<string, number>;
  recentYouTravelBookingRequests: YouTravelBookingRequestView[];
};

export async function fetchYouTravelAdminBookingStats(
  supabase: SupabaseClient<Database>
): Promise<YouTravelAdminBookingStats> {
  const [stats, recent] = await Promise.all([
    fetchYouTravelBookingRequestsStatusStats(supabase),
    fetchYouTravelBookingRequestsAdmin(supabase, { limit: 40 }),
  ]);

  return {
    youtravelBookingRequestsTotal: stats.total,
    youtravelBookingRequestsByStatus: stats.byStatus,
    recentYouTravelBookingRequests: recent,
  };
}
