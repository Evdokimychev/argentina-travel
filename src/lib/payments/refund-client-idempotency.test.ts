import { afterEach, describe, expect, it, vi } from "vitest";
import { createMercadoPagoRefund } from "./mercadopago-client";
import { createStripeRefund } from "./stripe-client";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("refund provider idempotency", () => {
  it("passes the caller-owned stable key to Stripe", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "re_1",
          status: "succeeded",
          amount: 1250,
          currency: "usd",
          payment_intent: "pi_1",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createStripeRefund({
      secretKey: "sk_test",
      paymentIntentId: "pi_1",
      amount: 12.5,
      reason: "requested_by_customer",
      idempotencyKey: "stable-refund-key",
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({ "Idempotency-Key": "stable-refund-key" });
  });

  it("passes the caller-owned stable key to Mercado Pago", async () => {
    vi.stubEnv("MERCADOPAGO_ACCESS_TOKEN", "mp_test");
    vi.stubEnv("MERCADOPAGO_REFUNDS_ENABLED", "true");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 77, status: "approved" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await createMercadoPagoRefund({
      paymentId: "payment-1",
      amount: 1495,
      idempotencyKey: "stable-refund-key",
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({ "X-Idempotency-Key": "stable-refund-key" });
  });

  it("rejects an empty key before contacting a provider", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      createStripeRefund({
        secretKey: "sk_test",
        paymentIntentId: "pi_1",
        amount: 12.5,
        idempotencyKey: "   ",
      }),
    ).rejects.toThrow("idempotency key");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
