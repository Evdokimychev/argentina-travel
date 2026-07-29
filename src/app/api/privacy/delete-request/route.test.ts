import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sessionUser: null as null | Record<string, unknown>,
  loadSessionUser: vi.fn(),
  from: vi.fn(),
  existing: null as null | Record<string, unknown>,
  insertResult: null as null | Record<string, unknown>,
  insertError: null as null | { message: string },
  insertPayload: null as null | Record<string, unknown>,
}));

vi.mock("@/lib/auth-mode", () => ({ isSupabaseAuthEnabled: () => true }));
vi.mock("@/lib/supabase-auth-provider", () => ({
  loadSessionUserFromSupabase: mocks.loadSessionUser,
}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => ({ from: mocks.from }),
}));

import { POST } from "@/app/api/privacy/delete-request/route";

function request(reason = "Больше не использую сервис") {
  return new Request("https://example.test/api/privacy/delete-request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ reason }),
  });
}

describe("POST /api/privacy/delete-request", () => {
  beforeEach(() => {
    mocks.sessionUser = {
      id: "user-1",
      role: "tourist",
      roles: ["tourist"],
      email: "reader@example.com",
      fullName: "Reader",
    };
    mocks.loadSessionUser.mockReset().mockImplementation(async () => mocks.sessionUser);
    mocks.existing = null;
    mocks.insertResult = {
      id: "request-1",
      status: "pending",
      requested_at: "2026-07-29T00:00:00.000Z",
    };
    mocks.insertError = null;
    mocks.insertPayload = null;
    mocks.from.mockReset().mockImplementation((table: string) => {
      if (table !== "privacy_requests") throw new Error(`Unexpected table: ${table}`);
      let isInsert = false;
      const query = {
        select: () => query,
        eq: () => query,
        in: () => query,
        insert: (payload: Record<string, unknown>) => {
          isInsert = true;
          mocks.insertPayload = payload;
          return query;
        },
        maybeSingle: async () => ({ data: mocks.existing, error: null }),
        single: async () => ({ data: isInsert ? mocks.insertResult : null, error: mocks.insertError }),
      };
      return query;
    });
  });

  it("persists one bounded deletion request for the authenticated non-admin user", async () => {
    const response = await POST(request(`  ${"x".repeat(2100)}  `));

    expect(response.status).toBe(200);
    expect(mocks.insertPayload).toEqual(expect.objectContaining({
      user_id: "user-1",
      request_type: "delete",
      status: "pending",
      metadata: {
        email: "reader@example.com",
        fullName: "Reader",
      },
    }));
    expect(String(mocks.insertPayload?.reason)).toHaveLength(2000);
  });

  it("returns the active request instead of inserting a duplicate", async () => {
    mocks.existing = { id: "request-existing", status: "approved" };

    const response = await POST(request());

    expect(response.status).toBe(409);
    expect(mocks.insertPayload).toBeNull();
    await expect(response.json()).resolves.toEqual(expect.objectContaining({
      requestId: "request-existing",
      status: "approved",
    }));
  });

  it("rejects deletion requests for an admin account", async () => {
    mocks.sessionUser = { ...mocks.sessionUser, role: "admin", roles: ["admin"] };

    const response = await POST(request());

    expect(response.status).toBe(409);
    expect(mocks.from).not.toHaveBeenCalled();
  });
});
