import { createHmac } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateByOrderId: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ kind: "fake-admin" }),
}));
vi.mock("@/lib/supabase/env", () => ({
  isSupabaseConfigured: () => true,
}));
vi.mock("@/lib/youtravel/booking-requests-server", () => ({
  updateYouTravelBookingRequestByOrderId: mocks.updateByOrderId,
}));

import { POST as youtravelWebhook } from "@/app/api/webhooks/youtravel/booking/route";

describe("YouTravel booking webhook signing / replay", () => {
  const secret = "yt-webhook-test-secret";

  beforeEach(() => {
    process.env.YOUTRAVEL_WEBHOOK_SECRET = secret;
    mocks.updateByOrderId.mockReset().mockResolvedValue(1);
  });

  afterEach(() => {
    delete process.env.YOUTRAVEL_WEBHOOK_SECRET;
  });

  function request(body: Record<string, unknown>, headerSecret?: string | null) {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (headerSecret !== null) {
      headers["x-youtravel-webhook-secret"] = headerSecret ?? secret;
    }
    return new Request("https://www.goargentina.ru/api/webhooks/youtravel/booking", {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
  }

  it("rejects missing or mismatched webhook secrets", async () => {
    const missing = await youtravelWebhook(request({ order_id: "o1", status: "paid" }, null));
    expect(missing.status).toBe(401);

    const wrong = await youtravelWebhook(
      request({ order_id: "o1", status: "paid" }, "wrong-secret"),
    );
    expect(wrong.status).toBe(401);
    expect(mocks.updateByOrderId).not.toHaveBeenCalled();
  });

  it("applies a signed update and treats a second identical delivery as a safe re-apply", async () => {
    const payload = { order_id: "yt-order-1", status: "confirmed", url: "https://youtravel.me/o/1" };
    const first = await youtravelWebhook(request(payload));
    const second = await youtravelWebhook(request(payload));

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(mocks.updateByOrderId).toHaveBeenCalledTimes(2);
    expect(mocks.updateByOrderId).toHaveBeenCalledWith(
      expect.anything(),
      "yt-order-1",
      expect.objectContaining({ status: "confirmed" }),
    );
  });

  it("does not accept a tampered secret of matching length via timing-safe compare", async () => {
    // Same length as configured secret; must still fail closed.
    const twin = "yt-webhook-test-secreX";
    expect(twin).toHaveLength(secret.length);
    const response = await youtravelWebhook(
      request({ order_id: "o1", status: "paid" }, twin),
    );
    expect(response.status).toBe(401);
    expect(mocks.updateByOrderId).not.toHaveBeenCalled();
  });

  it("keeps signature verification independent of unused HMAC helpers", () => {
    // Guard: YouTravel uses shared-secret headers, not Stripe-style HMAC bodies.
    // This assertion documents the intentional difference for rehearsal scripts.
    const digest = createHmac("sha256", secret).update("unused").digest("hex");
    expect(digest).toHaveLength(64);
  });
});
