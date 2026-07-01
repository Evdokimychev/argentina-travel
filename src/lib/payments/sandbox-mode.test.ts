import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertPaymentSandboxAllowed,
  isPaymentSandboxMode,
} from "@/lib/payments/sandbox-mode";

describe("payment sandbox mode", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("enables sandbox when PAYMENT_SANDBOX_MODE=true", () => {
    vi.stubEnv("PAYMENT_SANDBOX_MODE", "true");
    vi.stubEnv("DEPLOY_ENV", "production");
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "live-token");
    expect(isPaymentSandboxMode()).toBe(true);
  });

  it("auto-enables in development without payment providers", () => {
    vi.stubEnv("PAYMENT_SANDBOX_MODE", "");
    vi.stubEnv("DEPLOY_ENV", "development");
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "");
    vi.stubEnv("STRIPE_SECRET_KEY", "");
    expect(isPaymentSandboxMode()).toBe(true);
  });

  it("disables auto sandbox on staging without explicit flag", () => {
    vi.stubEnv("PAYMENT_SANDBOX_MODE", "");
    vi.stubEnv("DEPLOY_ENV", "staging");
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "");
    expect(isPaymentSandboxMode()).toBe(false);
  });

  it("blocks sandbox API in production without explicit flag", () => {
    vi.stubEnv("PAYMENT_SANDBOX_MODE", "");
    vi.stubEnv("DEPLOY_ENV", "production");
    expect(assertPaymentSandboxAllowed()).toEqual({
      ok: false,
      reason: "Песочница оплат отключена в production",
    });
  });

  it("allows sandbox API in production with explicit flag", () => {
    vi.stubEnv("PAYMENT_SANDBOX_MODE", "true");
    vi.stubEnv("DEPLOY_ENV", "production");
    expect(assertPaymentSandboxAllowed()).toEqual({ ok: true });
  });
});
