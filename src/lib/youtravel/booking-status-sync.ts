import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { YouTravelBookingRequestView } from "@/types/youtravel-booking";
import {
  fetchYouTravelBookingOrder,
  YouTravelBookingError,
} from "@/lib/youtravel/booking-api";
import {
  fetchYouTravelBookingRequestById,
  updateYouTravelBookingRequestStatus,
} from "@/lib/youtravel/booking-requests-server";

type DbClient = SupabaseClient<Database>;

function resolveRefreshFailureStatus(error: YouTravelBookingError): string {
  if (error.status === 401) return "api_unauthorized";
  if (error.status === 404) return "api_unavailable";
  return "api_unavailable";
}

export async function refreshYouTravelBookingStatus(
  supabase: DbClient,
  requestId: string
): Promise<YouTravelBookingRequestView | null> {
  const current = await fetchYouTravelBookingRequestById(supabase, requestId);
  if (!current) return null;

  if (!current.youtravelOrderId?.trim()) {
    return current;
  }

  const syncedAt = new Date().toISOString();

  try {
    const order = await fetchYouTravelBookingOrder(current.youtravelOrderId);
    await updateYouTravelBookingRequestStatus(supabase, requestId, {
      status: order.status,
      orderUrl: order.url ?? current.youtravelOrderUrl,
      statusSyncedAt: syncedAt,
    });
  } catch (error) {
    if (error instanceof YouTravelBookingError) {
      await updateYouTravelBookingRequestStatus(supabase, requestId, {
        status: resolveRefreshFailureStatus(error),
        statusSyncedAt: syncedAt,
      });
    } else {
      throw error;
    }
  }

  return fetchYouTravelBookingRequestById(supabase, requestId);
}
