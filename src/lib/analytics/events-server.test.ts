import { beforeEach, describe, expect, it, vi } from "vitest";

const upsert = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({ upsert }),
  }),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: () => true,
}));

import { logAnalyticsEvent } from "@/lib/analytics/events-server";

describe("server analytics ingestion", () => {
  beforeEach(() => {
    upsert.mockReset();
    upsert.mockResolvedValue({ error: null });
  });

  it("stores only a flat sanitized analytics envelope", async () => {
    await logAnalyticsEvent({
      eventType: "assistant_ask",
      sessionId: "person@example.com",
      metadata: {
        page_url: "https://www.goargentina.ru/guide?email=person@example.com",
        question_length: 42,
        contact_record: { email: "person@example.com" },
      },
    });

    expect(upsert).toHaveBeenCalledWith({
      event_id: expect.stringMatching(/^e-/),
      event_type: "assistant_ask",
      ingestion_source: "controlled_server",
      user_id: null,
      session_id: "[redacted]",
      tour_slug: null,
      tour_id: null,
      metadata: expect.objectContaining({
        event_version: 3,
        page_url: "https://www.goargentina.ru/guide",
        question_length: 42,
      }),
    }, { onConflict: "event_id", ignoreDuplicates: true });
    expect(upsert.mock.calls[0]?.[0].metadata).not.toHaveProperty("contact_record");
  });

  it("stores strict operational events without identity columns", async () => {
    await logAnalyticsEvent({
      eventType: "booking_transition",
      userId: "user-should-not-be-stored",
      sessionId: "s-session-should-not-be-stored",
      metadata: {
        outcome: "native_request_created",
        placement: "tour_detail",
        operation_id: "op-123",
        product_type: "tour",
        product_id: "iguazu",
      },
    });

    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({
      event_type: "booking_transition",
      ingestion_source: "controlled_server",
      user_id: null,
      session_id: null,
      tour_slug: null,
      tour_id: null,
      metadata: expect.objectContaining({
        outcome: "native_request_created",
        operation_id: "op-123",
      }),
    }), { onConflict: "event_id", ignoreDuplicates: true });
  });

  it("does not persist an invalid or PII-bearing operational event", async () => {
    await logAnalyticsEvent({
      eventType: "moderation_conflict",
      metadata: {
        action: "publish",
        expected_state: "review",
        actual_state: "person@example.com",
      },
    });

    expect(upsert).not.toHaveBeenCalled();
  });
});
