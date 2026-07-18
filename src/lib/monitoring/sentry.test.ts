import { afterEach, describe, expect, it, vi } from "vitest";
import { getSentryEnvironment, getSentryRelease } from "@/lib/monitoring/sentry";

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
