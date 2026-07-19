import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Json } from "@/types/database";
import {
  createAnalyticsEventPayload,
  sanitizeAnalyticsParams,
} from "@/lib/analytics/event-contract";

export type AnalyticsEventType = "tour_view" | "booking_started" | "assistant_ask";

export async function logAnalyticsEvent(input: {
  eventType: AnalyticsEventType;
  userId?: string | null;
  sessionId?: string | null;
  tourSlug?: string | null;
  tourId?: string | null;
  metadata?: Record<string, Json>;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const supabase = createSupabaseAdminClient();
    const identifiers = sanitizeAnalyticsParams({
      session_id: input.sessionId,
      tour_slug: input.tourSlug,
      tour_id: input.tourId,
    });
    const metadata = createAnalyticsEventPayload(input.metadata ?? {});
    await supabase.from("analytics_events").insert({
      event_type: input.eventType,
      user_id: input.userId ?? null,
      session_id: typeof identifiers.session_id === "string" ? identifiers.session_id : null,
      tour_slug: typeof identifiers.tour_slug === "string" ? identifiers.tour_slug : null,
      tour_id: typeof identifiers.tour_id === "string" ? identifiers.tour_id : null,
      metadata: metadata as Json,
    });
  } catch {
    /* analytics must not block user flows */
  }
}
