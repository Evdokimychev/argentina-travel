import { afterEach, describe, expect, it, vi } from "vitest";
import { getGitSha } from "@/lib/monitoring/build-info";

describe("build info", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("prefers the deployment-provided Vercel SHA over a stale fallback", () => {
    vi.stubEnv("GIT_SHA", "stale-local-sha");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "deployed-sha");

    expect(getGitSha()).toBe("deployed-sha");
  });

  it("uses GIT_SHA outside Vercel", () => {
    vi.stubEnv("GIT_SHA", "ci-sha");
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA", "");
    vi.stubEnv("NEXT_PUBLIC_RELEASE_GIT_SHA", "");

    expect(getGitSha()).toBe("ci-sha");
  });

  it("uses the SHA embedded by the production build for prebuilt deployments", () => {
    vi.stubEnv("VERCEL_GIT_COMMIT_SHA", "");
    vi.stubEnv("NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA", "");
    vi.stubEnv("NEXT_PUBLIC_RELEASE_GIT_SHA", "prebuilt-sha");
    vi.stubEnv("GIT_SHA", "");

    expect(getGitSha()).toBe("prebuilt-sha");
  });
});
