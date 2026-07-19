import { describe, expect, it } from "vitest";

import { getCommunicationsCommerceReadiness } from "./communications-commerce-readiness";

describe("getCommunicationsCommerceReadiness", () => {
  it("marks providers without configuration as not configured", () => {
    const result = getCommunicationsCommerceReadiness({});

    expect(result.providers.map((provider) => provider.status)).toEqual([
      "not_configured",
      "not_configured",
      "not_configured",
    ]);
    expect(result.paymentSandboxMode).toBe(false);
  });

  it("recognizes complete safe readiness without exposing values", () => {
    const result = getCommunicationsCommerceReadiness({
      RESEND_API_KEY: "email-secret-value",
      LEADS_NOTIFY_FROM: "sender@example.com",
      LEADS_NOTIFY_EMAIL: "admin@example.com",
      STRIPE_ENABLED: "true",
      STRIPE_SECRET_KEY: "stripe-secret-value",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "stripe-public-value",
      STRIPE_WEBHOOK_SECRET: "stripe-webhook-value",
      MERCADOPAGO_ACCESS_TOKEN: "mercado-secret-value",
      MERCADOPAGO_PUBLIC_KEY: "mercado-public-value",
      MERCADOPAGO_WEBHOOK_SECRET: "mercado-webhook-value",
      PAYMENT_SANDBOX_MODE: "true",
    });

    expect(result.providers.every((provider) => provider.status === "ready")).toBe(true);
    expect(result.paymentSandboxMode).toBe(true);

    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain("secret-value");
    expect(serialized).not.toContain("sender@example.com");
    expect(serialized).not.toContain("admin@example.com");
  });

  it("distinguishes partially prepared providers", () => {
    const result = getCommunicationsCommerceReadiness({
      LEADS_NOTIFY_FROM: "sender@example.com",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "stripe-public-key",
      NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY: "public-key",
    });

    expect(result.providers.map((provider) => provider.status)).toEqual([
      "partial",
      "partial",
      "partial",
    ]);
  });

  it("keeps an explicitly disabled Stripe scenario out of ready state", () => {
    const result = getCommunicationsCommerceReadiness({
      STRIPE_ENABLED: "false",
      STRIPE_SECRET_KEY: "stripe-secret-value",
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: "stripe-public-value",
      STRIPE_WEBHOOK_SECRET: "stripe-webhook-value",
    });

    expect(result.providers.find((provider) => provider.id === "stripe")?.status).toBe(
      "partial",
    );
  });
});
