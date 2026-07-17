import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ANALYTICS_EVENT_VERSION,
  ANALYTICS_SESSION_STORAGE_KEY,
  createAnalyticsEventPayload,
  getAnalyticsSessionId,
  sanitizeAnalyticsParams,
} from "@/lib/analytics/event-contract";

describe("analytics event contract", () => {
  beforeEach(() => {
    const storage = new Map<string, string>();
    vi.stubGlobal("window", {
      sessionStorage: {
        getItem: (key: string) => storage.get(key) ?? null,
        setItem: (key: string, value: string) => storage.set(key, value),
      },
    });
  });

  it("keeps one anonymous session id for the browser session", () => {
    const first = getAnalyticsSessionId();
    expect(first).toMatch(/^s-/);
    expect(getAnalyticsSessionId()).toBe(first);
    expect(window.sessionStorage.getItem(ANALYTICS_SESSION_STORAGE_KEY)).toBe(first);
  });

  it("redacts PII, strips URL query data and drops nested form payloads", () => {
    expect(
      sanitizeAnalyticsParams({
        product_id: "tour-42",
        email: "person@example.com",
        campaign: "+54 11 5555 1234",
        link_url: "https://partner.example/checkout?email=person@example.com#payment",
        contact_record: { name: "Иван" },
      }),
    ).toEqual({
      product_id: "tour-42",
      email: "[redacted]",
      campaign: "[redacted]",
      link_url: "https://partner.example/checkout",
    });
  });

  it("adds the common versioned event envelope", () => {
    const payload = createAnalyticsEventPayload({
      event_version: 999,
      event_id: "forged",
      session_id: "forged",
      product_id: "tour-42",
      booking_mode: "native_request",
      outcome: "native_success",
    });
    expect(payload).toMatchObject({
      event_version: ANALYTICS_EVENT_VERSION,
      product_id: "tour-42",
      booking_mode: "native_request",
      outcome: "native_success",
    });
    expect(payload.event_id).toMatch(/^e-/);
    expect(payload.session_id).toMatch(/^s-/);
    expect(payload.session_id).not.toBe("forged");
    expect(Date.parse(payload.occurred_at)).not.toBeNaN();
  });
});
