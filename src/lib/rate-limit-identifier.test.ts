import { describe, expect, it } from "vitest";
import { hashRateLimitIdentifier } from "@/lib/rate-limit-identifier";

describe("hashRateLimitIdentifier", () => {
  it("normalizes identifiers without exposing PII in limiter keys", () => {
    const hash = hashRateLimitIdentifier("Tour-Waitlist", " User@Example.COM ");

    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain("user@example.com");
    expect(hash).toBe(
      hashRateLimitIdentifier("tour-waitlist", "user@example.com"),
    );
  });

  it("purpose-binds the same identifier to separate flows", () => {
    expect(hashRateLimitIdentifier("waitlist", "user@example.com")).not.toBe(
      hashRateLimitIdentifier("password-reset", "user@example.com"),
    );
  });
});
