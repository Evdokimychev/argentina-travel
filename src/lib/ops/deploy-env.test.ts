import { afterEach, describe, expect, it, vi } from "vitest";
import { getDeployEnvironment } from "@/lib/ops/deploy-env";

describe("getDeployEnvironment", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("uses DEPLOY_ENV when set", () => {
    vi.stubEnv("DEPLOY_ENV", "production");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "");
    expect(getDeployEnvironment().deployEnv).toBe("production");
  });

  it("falls back to VERCEL_ENV production", () => {
    vi.stubEnv("DEPLOY_ENV", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "production");
    expect(getDeployEnvironment().deployEnv).toBe("production");
  });

  it("maps VERCEL_ENV preview to staging", () => {
    vi.stubEnv("DEPLOY_ENV", "");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL_ENV", "preview");
    expect(getDeployEnvironment().deployEnv).toBe("staging");
  });
});
