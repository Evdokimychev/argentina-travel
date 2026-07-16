import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { authorizeCronRequest } from "@/lib/cron/authorize-cron";

describe("authorizeCronRequest", () => {
  const originalSecret = process.env.CRON_SECRET;

  beforeEach(() => {
    process.env.CRON_SECRET = "test-cron-secret";
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.CRON_SECRET;
    else process.env.CRON_SECRET = originalSecret;
  });

  it("accepts the configured bearer secret", () => {
    const result = authorizeCronRequest(
      new Request("https://example.com/api/cron/test", {
        headers: { authorization: "Bearer test-cron-secret" },
      })
    );

    expect(result).toEqual({ ok: true, source: "bearer" });
  });

  it.each<Record<string, string>>([
    { "x-vercel-cron": "1" },
    { "x-vercel-cron-auth-token": "attacker-controlled" },
    { "x-vercel-cron": "1", "x-vercel-cron-auth-token": "attacker-controlled" },
  ])("rejects spoofable Vercel headers: %o", async (headers) => {
    const result = authorizeCronRequest(
      new Request("https://example.com/api/cron/test", { headers })
    );

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(401);
  });

  it("rejects a missing or incorrect bearer token", () => {
    const missing = authorizeCronRequest(new Request("https://example.com/api/cron/test"));
    const wrong = authorizeCronRequest(
      new Request("https://example.com/api/cron/test", {
        headers: { authorization: "Bearer wrong-secret" },
      })
    );

    expect(missing.ok).toBe(false);
    expect(wrong.ok).toBe(false);
  });

  it("fails closed when CRON_SECRET is missing", () => {
    delete process.env.CRON_SECRET;
    const result = authorizeCronRequest(
      new Request("https://example.com/api/cron/test", {
        headers: { authorization: "Bearer test-cron-secret" },
      })
    );

    expect(result.ok).toBe(false);
  });
});
