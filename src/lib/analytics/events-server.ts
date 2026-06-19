import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Json } from "@/types/database";

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
    await supabase.from("analytics_events").insert({
      event_type: input.eventType,
      user_id: input.userId ?? null,
      session_id: input.sessionId ?? null,
      tour_slug: input.tourSlug ?? null,
      tour_id: input.tourId ?? null,
      metadata: (input.metadata ?? {}) as Json,
    });
  } catch {
    /* analytics must not block user flows */
  }
}
