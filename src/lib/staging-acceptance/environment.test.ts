import { describe, expect, it } from "vitest";
import {
  assertStagingEnvironment,
  createSafeFingerprint,
  PRODUCTION_SUPABASE_PROJECT_REF,
} from "./environment";

const validEnv = {
  STAGING_ACCEPTANCE_ENABLED: "true",
  STAGING_ACCEPTANCE_BASE_URL: "https://argentina-travel-staging.vercel.app",
  STAGING_ACCEPTANCE_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  STAGING_ACCEPTANCE_SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
  STAGING_ACCEPTANCE_RUN_ID: "acceptance-20260716-001",
  STAGING_ACCEPTANCE_MAILBOX_MODE: "disposable",
  STAGING_ACCEPTANCE_MAILBOX_TOKEN: "mailbox-token",
  PAYMENT_SANDBOX_MODE: "true",
  STAGING_ACCEPTANCE_PARTNER_WRITES: "false",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "staging-anon-key",
  SUPABASE_SERVICE_ROLE_KEY: "staging-service-key",
  CI: "true",
  GITHUB_SHA: "abc123",
  GIT_SHA: "abc123",
};

describe("staging acceptance environment guard", () => {
  it("accepts an explicitly isolated staging environment", () => {
    expect(assertStagingEnvironment(validEnv)).toMatchObject({
      baseUrl: "https://argentina-travel-staging.vercel.app",
      supabaseProjectRef: "abcdefghijklmnopqrst",
      paymentSandbox: true,
      partnerWrites: false,
    });
  });

  it.each([
    ["explicit enable", { STAGING_ACCEPTANCE_ENABLED: "false" }],
    ["production origin", { STAGING_ACCEPTANCE_BASE_URL: "https://www.goargentina.ru" }],
    ["production subdomain", { STAGING_ACCEPTANCE_BASE_URL: "https://preview.goargentina.ru" }],
    ["production Supabase", {
      STAGING_ACCEPTANCE_SUPABASE_URL: `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`,
      STAGING_ACCEPTANCE_SUPABASE_PROJECT_REF: PRODUCTION_SUPABASE_PROJECT_REF,
    }],
    ["mismatched ref", { STAGING_ACCEPTANCE_SUPABASE_PROJECT_REF: "zyxwvutsrqponmlkjihg" }],
    ["app points to production", {
      NEXT_PUBLIC_SUPABASE_URL: `https://${PRODUCTION_SUPABASE_PROJECT_REF}.supabase.co`,
    }],
    ["non-disposable mailbox", { STAGING_ACCEPTANCE_MAILBOX_MODE: "resend" }],
    ["missing mailbox credentials", { STAGING_ACCEPTANCE_MAILBOX_TOKEN: "" }],
    ["missing anon credentials", { NEXT_PUBLIC_SUPABASE_ANON_KEY: "" }],
    ["missing service credentials", { SUPABASE_SERVICE_ROLE_KEY: "" }],
    ["live payments", { PAYMENT_SANDBOX_MODE: "false" }],
    ["partner writes", { STAGING_ACCEPTANCE_PARTNER_WRITES: "true" }],
  ])("rejects %s", (_label, override) => {
    expect(() => assertStagingEnvironment({ ...validEnv, ...override })).toThrow(
      /staging-acceptance/,
    );
  });

  it("returns a fingerprint without keys or tokens", () => {
    const fingerprint = createSafeFingerprint(
      {
        ...validEnv,
        SUPABASE_SERVICE_ROLE_KEY: "must-not-leak",
        STAGING_ACCEPTANCE_MAILBOX_TOKEN: "must-not-leak-either",
      },
      process.cwd(),
    );
    const serialized = JSON.stringify(fingerprint);

    expect(fingerprint.gitSha).toBe("abc123");
    expect(fingerprint.migrationFingerprint).toMatch(/^(?:none|[a-f0-9]{64})$/);
    expect(serialized).not.toContain("must-not-leak");
    expect(Object.keys(fingerprint)).not.toContain("serviceRoleKey");
  });
});
