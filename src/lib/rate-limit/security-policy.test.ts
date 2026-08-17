import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("security-critical rate limit policy", () => {
  beforeEach(() => {
    vi.resetModules();
    process.env.UPSTASH_REDIS_REST_URL = "https://example-upstash.test";
    process.env.UPSTASH_REDIS_REST_TOKEN = "token";
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
  });

  it("fails closed when Upstash is configured but unavailable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("upstash down");
      }),
    );
    const { checkSecurityRateLimit } = await import("@/lib/rate-limit");
    const result = await checkSecurityRateLimit("bookings:create:ip:1.2.3.4", 10, 60_000);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.retryAfterSec).toBeGreaterThan(0);
  });

  it("prefers x-vercel-forwarded-for for client IP", async () => {
    const { getClientIp } = await import("@/lib/rate-limit");
    const ip = getClientIp(
      new Request("https://example.test", {
        headers: {
          "x-forwarded-for": "1.1.1.1, 2.2.2.2",
          "x-vercel-forwarded-for": "9.9.9.9",
        },
      }),
    );
    expect(ip).toBe("9.9.9.9");
  });
});
