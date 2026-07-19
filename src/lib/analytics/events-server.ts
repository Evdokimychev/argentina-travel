import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Json } from "@/types/database";
import {
  createAnalyticsEventPayload,
  sanitizeAnalyticsParams,
} from "@/lib/analytics/event-contract";
import {
  isOperationalAnalyticsEventType,
  validateOperationalEventMetadata,
  type OperationalAnalyticsEventType,
} from "@/lib/analytics/operational-event-contract";

export type AnalyticsEventType =
  | "tour_view"
  | "booking_started"
  | "assistant_ask"
  | OperationalAnalyticsEventType;

export async function logAnalyticsEvent(input: {
  eventType: AnalyticsEventType;
  eventId?: string | null;
  userId?: string | null;
  sessionId?: string | null;
  tourSlug?: string | null;
  tourId?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    const operationalEventType = isOperationalAnalyticsEventType(input.eventType)
      ? input.eventType
      : null;
    const operational = operationalEventType !== null;
    const validatedMetadata = operationalEventType
      ? validateOperationalEventMetadata(operationalEventType, input.metadata ?? {})
      : sanitizeAnalyticsParams(input.metadata ?? {});
    if (!validatedMetadata) return;

    const supabase = createSupabaseAdminClient();
    const identifiers = operational
      ? {}
      : sanitizeAnalyticsParams({
          session_id: input.sessionId,
          tour_slug: input.tourSlug,
          tour_id: input.tourId,
        });
    const generatedMetadata = createAnalyticsEventPayload(validatedMetadata);
    const eventId = input.eventId?.trim().slice(0, 100) || generatedMetadata.event_id;
    const metadata = { ...generatedMetadata, event_id: eventId };
    await supabase.from("analytics_events").upsert({
      event_id: eventId,
      event_type: input.eventType,
      ingestion_source: "controlled_server",
      user_id: operational ? null : input.userId ?? null,
      session_id: typeof identifiers.session_id === "string" ? identifiers.session_id : null,
      tour_slug: typeof identifiers.tour_slug === "string" ? identifiers.tour_slug : null,
      tour_id: typeof identifiers.tour_id === "string" ? identifiers.tour_id : null,
      metadata: metadata as Json,
    }, { onConflict: "event_id", ignoreDuplicates: true });
  } catch {
    /* analytics must not block user flows */
  }
}
