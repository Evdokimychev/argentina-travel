import { describe, expect, it } from "vitest";
import { resolveRemoteAcceptanceSnapshot } from "./remote-environment";

const safe = {
  STAGING_ACCEPTANCE_ENABLED: "true",
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  STAGING_ACCEPTANCE_SUPABASE_URL: "https://abcdefghijklmnopqrst.supabase.co",
  STAGING_ACCEPTANCE_SUPABASE_PROJECT_REF: "abcdefghijklmnopqrst",
  STAGING_ACCEPTANCE_MAILBOX_MODE: "disposable",
  STAGING_ACCEPTANCE_PARTNER_WRITES: "false",
  PAYMENT_SANDBOX_MODE: "true",
  GIT_SHA: "abc123",
};

describe("remote staging acceptance snapshot", () => {
  it("exposes only safe deployment identity fields", () => {
    expect(resolveRemoteAcceptanceSnapshot(safe)).toEqual({
      enabled: true,
      gitSha: "abc123",
      supabaseProjectRef: "abcdefghijklmnopqrst",
      paymentSandbox: true,
      disposableMailbox: true,
      partnerWritesDisabled: true,
    });
  });

  it("stays disabled unless explicitly enabled", () => {
    expect(resolveRemoteAcceptanceSnapshot({ ...safe, STAGING_ACCEPTANCE_ENABLED: "false" })).toBeNull();
  });

  it("refuses a deployment whose app and acceptance Supabase refs differ", () => {
    expect(
      resolveRemoteAcceptanceSnapshot({
        ...safe,
        NEXT_PUBLIC_SUPABASE_URL: "https://zyxwvutsrqponmlkjihg.supabase.co",
      }),
    ).toBeNull();
  });

  it("refuses the production Supabase ref", () => {
    const productionUrl = "https://uooxrypocahomoqzdvzy.supabase.co";
    expect(
      resolveRemoteAcceptanceSnapshot({
        ...safe,
        NEXT_PUBLIC_SUPABASE_URL: productionUrl,
        SUPABASE_URL: productionUrl,
        STAGING_ACCEPTANCE_SUPABASE_URL: productionUrl,
        STAGING_ACCEPTANCE_SUPABASE_PROJECT_REF: "uooxrypocahomoqzdvzy",
      }),
    ).toBeNull();
  });
});
