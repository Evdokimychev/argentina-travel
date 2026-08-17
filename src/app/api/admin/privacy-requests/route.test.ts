import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  audit: vi.fn(),
  from: vi.fn(),
  existing: null as null | Record<string, unknown>,
  existingError: null as null | { message: string },
  updateResult: null as null | Record<string, unknown>,
  updateError: null as null | { message: string },
  updatePayload: null as null | Record<string, unknown>,
  updateFilters: [] as Array<[string, unknown]>,
}));

vi.mock("@/lib/admin/authorize-request", () => ({
  authorizeAdminRequest: mocks.authorize,
}));

vi.mock("@/lib/admin/audit", () => ({
  clientIpFromRequest: () => "127.0.0.1",
  writeAdminAuditLog: mocks.audit,
  writeCriticalAdminAuditLog: mocks.audit,
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    from: mocks.from,
  }),
}));

import { PATCH } from "@/app/api/admin/privacy-requests/route";

function request(action: "approve" | "reject" = "approve") {
  return new Request("https://example.test/api/admin/privacy-requests", {
    method: "PATCH",
    headers: { "content-type": "application/json", "x-forwarded-for": "127.0.0.1" },
    body: JSON.stringify({ id: "request-1", action, notes: "Проверено" }),
  });
}

describe("PATCH /api/admin/privacy-requests", () => {
  beforeEach(() => {
    mocks.authorize.mockReset().mockResolvedValue({
      ok: true,
      via: "session",
      actorId: "8df63e78-5184-4f49-b75c-60c2f2897f15",
    });
    mocks.audit.mockReset().mockResolvedValue({ ok: true });
    mocks.existing = {
      id: "request-1",
      user_id: "user-1",
      status: "pending",
      metadata: {},
    };
    mocks.existingError = null;
    mocks.updateResult = {
      id: "request-1",
      status: "approved",
      processed_at: null,
    };
    mocks.updateError = null;
    mocks.updatePayload = null;
    mocks.updateFilters = [];
    mocks.from.mockReset().mockImplementation((table: string) => {
      if (table !== "privacy_requests") {
        throw new Error(`Unexpected table mutation: ${table}`);
      }
      let isUpdate = false;
      const query = {
        select: () => query,
        update: (payload: Record<string, unknown>) => {
          isUpdate = true;
          mocks.updatePayload = payload;
          return query;
        },
        eq: (column: string, value: unknown) => {
          if (isUpdate) mocks.updateFilters.push([column, value]);
          return query;
        },
        maybeSingle: async () =>
          isUpdate
            ? { data: mocks.updateResult, error: mocks.updateError }
            : { data: mocks.existing, error: mocks.existingError },
      };
      return query;
    });
  });

  it("uses compare-and-set and leaves profile deletion to the processor", async () => {
    const response = await PATCH(request("approve"));

    expect(response.status).toBe(200);
    expect(mocks.authorize).toHaveBeenCalledWith(expect.any(Request), "operations.leads");
    expect(mocks.updateFilters).toEqual([
      ["id", "request-1"],
      ["status", "pending"],
    ]);
    expect(mocks.updatePayload).toEqual(expect.objectContaining({
      status: "approved",
      processed_by: "8df63e78-5184-4f49-b75c-60c2f2897f15",
      metadata: expect.objectContaining({
        approvedBy: "8df63e78-5184-4f49-b75c-60c2f2897f15",
      }),
    }));
    expect(mocks.from).not.toHaveBeenCalledWith("profiles");
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({
      action: "privacy.decision",
      entityId: "request-1",
      payload: expect.objectContaining({ decision: "approve", legacyAction: "privacy_request.approve" }),
    }));
  });

  it("returns a conflict and skips side effects when compare-and-set loses", async () => {
    mocks.updateResult = null;

    const response = await PATCH(request("approve"));

    expect(response.status).toBe(409);
    expect(mocks.audit).not.toHaveBeenCalled();
    await expect(response.json()).resolves.toEqual({
      error: "Статус заявки уже изменился. Обновите список и повторите действие.",
    });
  });

  it("does not allow rejection after processing has started", async () => {
    mocks.existing = { ...mocks.existing, status: "processing" };

    const response = await PATCH(request("reject"));

    expect(response.status).toBe(409);
    expect(mocks.updatePayload).toBeNull();
    expect(mocks.audit).not.toHaveBeenCalled();
  });
});
