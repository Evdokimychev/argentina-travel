import { afterEach, describe, expect, it } from "vitest";
import { getAppRuntimeMode } from "@/lib/runtime-mode";

const original = {
  appMode: process.env.NEXT_PUBLIC_APP_MODE,
  deployEnv: process.env.DEPLOY_ENV,
  vercelEnv: process.env.VERCEL_ENV,
};

afterEach(() => {
  process.env.NEXT_PUBLIC_APP_MODE = original.appMode;
  process.env.DEPLOY_ENV = original.deployEnv;
  process.env.VERCEL_ENV = original.vercelEnv;
});

describe("getAppRuntimeMode", () => {
  it("honors an explicit isolated demo mode", () => {
    process.env.NEXT_PUBLIC_APP_MODE = "demo";
    expect(getAppRuntimeMode()).toBe("demo");
  });

  it("treats production deployment as production by default", () => {
    delete process.env.NEXT_PUBLIC_APP_MODE;
    process.env.DEPLOY_ENV = "production";
    expect(getAppRuntimeMode()).toBe("production");
  });

  it("treats staging as production services", () => {
    delete process.env.NEXT_PUBLIC_APP_MODE;
    process.env.DEPLOY_ENV = "staging";
    expect(getAppRuntimeMode()).toBe("production");
  });
});
