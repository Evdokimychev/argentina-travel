import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  approve: vi.fn(),
}));

vi.mock("@/lib/admin/authorize-request", () => ({
  authorizeAdminRequest: mocks.authorize,
}));
vi.mock("@/lib/payments/transaction-server", () => ({
  approveRefundRequest: mocks.approve,
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ kind: "admin-client" }),
}));

import { POST } from "@/app/api/admin/payments/refunds/[id]/approve/route";

const actorId = "33333333-3333-4333-8333-333333333333";
const context = { params: Promise.resolve({ id: "refund-1" }) };

function request() {
  return new Request("https://example.test/api/admin/payments/refunds/refund-1/approve", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ adminNotes: "Проверено" }),
  });
}

describe("POST /api/admin/payments/refunds/[id]/approve", () => {
  beforeEach(() => {
    mocks.authorize.mockReset().mockResolvedValue({ ok: true, via: "session", actorId });
    mocks.approve.mockReset().mockResolvedValue({
      ok: true,
      transaction: { id: "refund-1", status: "completed" },
      providerExecuted: false,
    });
  });

  it("requires the approval capability and passes the personal session actor", async () => {
    const response = await POST(request(), context);

    expect(response.status).toBe(200);
    expect(mocks.authorize).toHaveBeenCalledWith(expect.any(Request), "finance.refunds.approve");
    expect(mocks.approve).toHaveBeenCalledWith(
      expect.anything(),
      "refund-1",
      actorId,
      "Проверено",
    );
  });

  it("refuses non-session financial approval before provider execution", async () => {
    mocks.authorize.mockResolvedValue({ ok: true, via: "api-key", actorId: "api-key" });

    const response = await POST(request(), context);

    expect(response.status).toBe(403);
    expect(mocks.approve).not.toHaveBeenCalled();
  });

  it("does not expose provider or secret errors", async () => {
    mocks.approve.mockResolvedValue({
      ok: false,
      code: "STRIPE_FAILED",
      error: "sk_live_secret leaked by provider timeout",
    });

    const response = await POST(request(), context);
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.error).toContain("сохранена для финансовой сверки");
    expect(JSON.stringify(payload)).not.toContain("sk_live");
  });
});
