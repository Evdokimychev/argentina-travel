import { afterEach, describe, expect, it, vi } from "vitest";
import { createMercadoPagoRefund, fetchMercadoPagoRefunds } from "./mercadopago-client";
import { createStripeRefund, listStripeRefundsForPayment } from "./stripe-client";

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
      metadata: { goargentinaRefundId: "refund-1" },
    });

    const init = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(init.headers).toMatchObject({ "Idempotency-Key": "stable-refund-key" });
    expect(String(init.body)).toContain("metadata%5BgoargentinaRefundId%5D=refund-1");
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

  it("lists Stripe refunds by source PaymentIntent without a mutation", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [{
        id: "re_1",
        status: "succeeded",
        amount: 1250,
        currency: "usd",
        payment_intent: "pi_1",
        metadata: { goargentinaRefundId: "refund-1" },
        created: 1_785_283_200,
      }],
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const refunds = await listStripeRefundsForPayment({
      secretKey: "sk_test",
      paymentIntentId: "pi_1",
    });

    expect(fetchMock.mock.calls[0]?.[0]).toContain("payment_intent=pi_1");
    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).method).toBe("GET");
    expect(refunds).toEqual([expect.objectContaining({
      id: "re_1",
      amount: 12.5,
      currency: "USD",
      metadata: { goargentinaRefundId: "refund-1" },
    })]);
  });

  it("fails closed when Stripe indicates that the refund list is truncated", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      data: [],
      has_more: true,
    }), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(listStripeRefundsForPayment({
      secretKey: "sk_test",
      paymentIntentId: "pi_1",
    })).rejects.toThrow("incomplete");
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("lists Mercado Pago refunds read-only and normalizes numeric identifiers", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      id: 77,
      payment_id: 123,
      amount: 1495,
      status: "approved",
      date_created: "2026-07-29T12:00:00Z",
    }]), { status: 200, headers: { "Content-Type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const refunds = await fetchMercadoPagoRefunds({ paymentId: "123", accessToken: "mp_test" });

    expect((fetchMock.mock.calls[0]?.[1] as RequestInit).method).toBe("GET");
    expect(refunds).toEqual([{
      refundId: "77",
      paymentId: "123",
      amount: 1495,
      status: "approved",
      dateCreated: "2026-07-29T12:00:00Z",
    }]);
  });
});
