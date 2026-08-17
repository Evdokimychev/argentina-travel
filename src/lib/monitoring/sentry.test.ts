import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { getSentryEnvironment, getSentryRelease } from "@/lib/monitoring/sentry";
import { scrubMonitoringData } from "@/lib/security/monitoring-scrub";

describe("Sentry runtime metadata", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses the immutable Vercel commit as release", () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "abc123");

    expect(getSentryRelease()).toBe("abc123");
  });

  it("allows an explicit release to override deployment metadata", () => {
    vi.stubEnv("NEXT_PUBLIC_SENTRY_RELEASE", "release-2026-07-16");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "abc123");

    expect(getSentryRelease()).toBe("release-2026-07-16");
  });

  it("prefers the explicit Sentry environment", () => {
    vi.stubEnv("SENTRY_ENVIRONMENT", "production-ar");
    vi.stubEnv("VERCEL_ENV", "preview");

    expect(getSentryEnvironment()).toBe("production-ar");
  });
});

describe("Sentry PII boundary helpers", () => {
  it("keeps sendDefaultPii disabled and scrubs breadcrumb/extra payloads", () => {
    const source = readFileSync(path.join("src/lib/monitoring/sentry.ts"), "utf8");
    expect(source).toContain("sendDefaultPii: false");
    expect(source).toContain("scrubMonitoringData");
    expect(source).toMatch(/Intentionally omit email/);
  });

  it("scrubs breadcrumb-shaped extras before they would reach Sentry", () => {
    expect(
      scrubMonitoringData({
        paymentToken: "tok_123",
        contactEmail: "a@b.co",
        bookingId: "b1",
      }),
    ).toEqual({
      paymentToken: "[redacted]",
      contactEmail: "[redacted]",
      bookingId: "b1",
    });
  });
});
