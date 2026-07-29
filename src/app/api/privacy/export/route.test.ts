import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  sessionUser: null as null | Record<string, unknown>,
  loadSessionUser: vi.fn(),
  buildExport: vi.fn(),
  supabase: { source: "session-client" },
}));

vi.mock("@/lib/auth-mode", () => ({ isSupabaseAuthEnabled: () => true }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: async () => mocks.supabase,
}));
vi.mock("@/lib/supabase-auth-provider", () => ({
  loadSessionUserFromSupabase: mocks.loadSessionUser,
}));
vi.mock("@/lib/privacy/export-user-data", () => ({
  buildUserPrivacyExport: mocks.buildExport,
}));

import { POST } from "@/app/api/privacy/export/route";

describe("POST /api/privacy/export", () => {
  beforeEach(() => {
    mocks.sessionUser = {
      id: "user-1",
      role: "tourist",
      roles: ["tourist"],
      email: "reader@example.com",
      fullName: "Reader",
    };
    mocks.loadSessionUser.mockReset().mockImplementation(async () => mocks.sessionUser);
    mocks.buildExport.mockReset().mockResolvedValue({
      exportedAt: "2026-07-29T00:00:00.000Z",
      userId: "user-1",
      profile: {},
      bookings: [],
      reviews: [],
      messages: [],
    });
  });

  it("scopes the export to the authenticated session user", async () => {
    const response = await POST();

    expect(response.status).toBe(200);
    expect(mocks.buildExport).toHaveBeenCalledWith(mocks.supabase, mocks.sessionUser);
    expect(response.headers.get("content-disposition")).toBe(
      'attachment; filename="privacy-export-user-1.json"',
    );
    await expect(response.json()).resolves.toEqual(expect.objectContaining({ userId: "user-1" }));
  });

  it("does not assemble an export without a session user", async () => {
    mocks.sessionUser = null;

    const response = await POST();

    expect(response.status).toBe(401);
    expect(mocks.buildExport).not.toHaveBeenCalled();
  });
});
