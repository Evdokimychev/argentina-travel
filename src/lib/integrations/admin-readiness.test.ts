import { afterEach, describe, expect, it, vi } from "vitest";
import { getIntegrationReadiness } from "@/lib/integrations/admin-readiness";

describe("getIntegrationReadiness", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("returns statuses without exposing secret values", () => {
    vi.stubEnv("STRIPE_SECRET_KEY", "sk_do_not_expose");
    vi.stubEnv("STRIPE_WEBHOOK_SECRET", "whsec_do_not_expose");

    const readiness = getIntegrationReadiness();
    expect(readiness.find((entry) => entry.id === "stripe")?.status).toBe("configured");
    expect(JSON.stringify(readiness)).not.toContain("sk_do_not_expose");
    expect(JSON.stringify(readiness)).not.toContain("whsec_do_not_expose");
  });

  it("distinguishes partial and missing configuration", () => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "configured");
    vi.stubEnv("MERCADOPAGO_WEBHOOK_SECRET", "");
    vi.stubEnv("TRIPSTER_PARTNER", "");
    vi.stubEnv("TRIPSTER_SECRET", "");

    const readiness = getIntegrationReadiness();
    expect(readiness.find((entry) => entry.id === "mercadopago")).toMatchObject({
      status: "partial",
      missingVariables: ["MERCADOPAGO_WEBHOOK_SECRET"],
    });
    expect(readiness.find((entry) => entry.id === "tripster")?.status).toBe("missing");
  });

  it("marks built-in protection separately from unconfigured Turnstile", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "");
    const readiness = getIntegrationReadiness();
    expect(readiness.find((entry) => entry.id === "form-rate-limit")?.status).toBe("built_in");
    expect(readiness.find((entry) => entry.id === "captcha")?.status).toBe("missing");
  });

  it("reports Turnstile as configured but unverified when both keys exist", () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "public-key");
    vi.stubEnv("TURNSTILE_SECRET_KEY", "secret-key");

    expect(getIntegrationReadiness().find((entry) => entry.id === "captcha")?.status).toBe("configured");
  });
});
