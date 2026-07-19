import { beforeEach, describe, expect, it, vi } from "vitest";

const insert = vi.fn();

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: () => ({ insert }),
  }),
}));

vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: () => true,
}));

import { logAnalyticsEvent } from "@/lib/analytics/events-server";

describe("server analytics ingestion", () => {
  beforeEach(() => {
    insert.mockReset();
    insert.mockResolvedValue({ error: null });
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

    expect(insert).toHaveBeenCalledWith({
      event_type: "assistant_ask",
      user_id: null,
      session_id: "[redacted]",
      tour_slug: null,
      tour_id: null,
      metadata: expect.objectContaining({
        event_version: 3,
        page_url: "https://www.goargentina.ru/guide",
        question_length: 42,
      }),
    });
    expect(insert.mock.calls[0]?.[0].metadata).not.toHaveProperty("contact_record");
  });
});
