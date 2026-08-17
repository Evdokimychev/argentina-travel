import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

describe("authorizeAdminRequest service-role boundary", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon";
    delete process.env.ADMIN_AUTOMATION_SECRET;
    delete process.env.ALLOW_SERVICE_ROLE_ADMIN_BEARER;
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects bare SUPABASE_SERVICE_ROLE_KEY Bearer by default", async () => {
    process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-secret-value";
    vi.doMock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
    vi.doMock("@/lib/supabase/server", () => ({
      createSupabaseServerClient: async () => ({}),
    }));
    vi.doMock("@/lib/supabase-auth-provider", () => ({
      loadSessionUserFromSupabase: async () => null,
    }));
    vi.doMock("@/lib/admin/staff", () => ({
      resolveAdminCapabilitiesFromSession: async () => null,
    }));
    vi.doMock("@/lib/monitoring/sentry", () => ({ setSentryUserContext: () => undefined }));

    const { authorizeAdminRequest } = await import("@/lib/admin/authorize-request");
    const result = await authorizeAdminRequest(
      new Request("https://example.test/api/admin/users", {
        headers: { Authorization: "Bearer service-role-secret-value" },
      }),
    );
    expect(result.ok).toBe(false);
  });

  it("accepts scoped ADMIN_AUTOMATION_SECRET Bearer", async () => {
    process.env.ADMIN_AUTOMATION_SECRET = "automation-secret-value";
    vi.doMock("@/lib/supabase/env", () => ({ isSupabaseConfigured: () => true }));
    vi.doMock("@/lib/monitoring/sentry", () => ({ setSentryUserContext: () => undefined }));

    const { authorizeAdminRequest } = await import("@/lib/admin/authorize-request");
    const result = await authorizeAdminRequest(
      new Request("https://example.test/api/admin/users", {
        headers: { Authorization: "Bearer automation-secret-value" },
      }),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.via).toBe("automation");
      expect(result.actorId).toBe("admin-automation");
    }
  });
});
