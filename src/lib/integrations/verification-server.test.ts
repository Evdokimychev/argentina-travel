import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/integrations/admin-readiness", () => ({
  getIntegrationReadiness: () => [
    { id: "supabase", status: "configured" },
    { id: "email", status: "configured" },
    { id: "analytics", status: "configured" },
    { id: "form-rate-limit", status: "built_in" },
    { id: "stripe", status: "missing" },
  ],
}));

import { verifyIntegrationConnection } from "@/lib/integrations/verification-server";

function dependencies(overrides: Record<string, unknown> = {}) {
  let now = 1_000;
  return {
    fetcher: vi.fn(async () => new Response(null, { status: 200 })) as typeof fetch,
    verifySupabase: vi.fn(async () => undefined),
    verifyTripster: vi.fn(async () => undefined),
    verifyYouTravel: vi.fn(async () => undefined),
    now: () => (now += 12),
    ...overrides,
  };
}

describe("integration verification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("runs a read-only configured probe without exposing provider payloads", async () => {
    const deps = dependencies();
    const result = await verifyIntegrationConnection("supabase", deps);
    expect(result).toMatchObject({ id: "supabase", status: "verified", latencyMs: 12 });
    expect(deps.verifySupabase).toHaveBeenCalledOnce();
    expect(result.summary).not.toContain("token");
  });

  it("does not call a provider when required configuration is absent", async () => {
    const deps = dependencies();
    const result = await verifyIntegrationConnection("stripe", deps);
    expect(result.status).toBe("not_configured");
    expect(deps.fetcher).not.toHaveBeenCalled();
  });

  it("does not claim webhook or analytics verification from env presence", async () => {
    const result = await verifyIntegrationConnection("analytics", dependencies());
    expect(result.status).toBe("manual_required");
  });

  it("fails closed and returns no raw provider error", async () => {
    const result = await verifyIntegrationConnection("supabase", dependencies({
      verifySupabase: vi.fn(async () => { throw new Error("secret database response"); }),
    }));
    expect(result.status).toBe("failed");
    expect(result.summary).not.toContain("secret database response");
  });

  it("rejects arbitrary integrations and URLs", async () => {
    await expect(verifyIntegrationConnection("https://attacker.example", dependencies()))
      .rejects.toThrow("UNKNOWN_INTEGRATION");
  });
});
