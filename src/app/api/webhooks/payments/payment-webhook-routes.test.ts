import { createHmac } from "node:crypto";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: { kind: "fake-admin" },
  applyDetailed: vi.fn(),
  persistLedger: vi.fn(),
  notifyPayment: vi.fn(),
  fetchPaymentIntent: vi.fn(),
  fetchCharge: vi.fn(),
  fetchMercadoPayment: vi.fn(),
  breadcrumb: vi.fn(),
  captureException: vi.fn(),
}));

vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => mocks.admin,
}));
vi.mock("@/lib/payments/webhook-handler", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments/webhook-handler")>();
  return {
    ...actual,
    applyPaymentWebhookPatchDetailed: mocks.applyDetailed,
    persistWebhookChargeTransaction: mocks.persistLedger,
  };
});
vi.mock("@/lib/payments/stripe-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments/stripe-client")>();
  return {
    ...actual,
    fetchPaymentIntent: mocks.fetchPaymentIntent,
    fetchCharge: mocks.fetchCharge,
  };
});
vi.mock("@/lib/payments/mercadopago-client", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/payments/mercadopago-client")>();
  return { ...actual, fetchPaymentDetails: mocks.fetchMercadoPayment };
});
vi.mock("@/lib/bookings-notify", () => ({
  notifyPaymentReceivedFromWebhook: mocks.notifyPayment,
}));
vi.mock("@/lib/monitoring/sentry", () => ({
  addPaymentBreadcrumb: mocks.breadcrumb,
  captureException: mocks.captureException,
}));

import { POST as stripeWebhook } from "@/app/api/webhooks/payments/stripe/route";
import { POST as mercadoWebhook } from "@/app/api/webhooks/payments/mercadopago/route";

const originalEnv = {
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  mercadoWebhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET,
  mercadoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
};

function ledgerSuccess(operation: "inserted" | "updated" | "unchanged" = "inserted") {
  return {
    ok: true as const,
    operation,
    commission: "created" as const,
    transaction: {
      id: "tx-1",
      bookingId: "booking-1",
      provider: "stripe",
      externalId: "pi-1",
      amount: 100,
      currency: "USD",
      status: "completed",
      type: "charge",
      metadata: {},
      createdAt: "2026-07-29T10:00:00.000Z",
      updatedAt: "2026-07-29T10:00:00.000Z",
    },
  };
}

function stripeRequest(eventId = "evt-paid"): Request {
  const timestamp = Math.floor(Date.now() / 1000);
  const rawBody = JSON.stringify({
    id: eventId,
    type: "payment_intent.succeeded",
    created: timestamp,
    data: { object: { id: "pi-1" } },
  });
  const digest = createHmac("sha256", "whsec-test")
    .update(`${timestamp}.${rawBody}`, "utf8")
    .digest("hex");
  return new Request("https://www.goargentina.ru/api/webhooks/payments/stripe", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "stripe-signature": `t=${timestamp},v1=${digest}`,
    },
    body: rawBody,
  });
}

function mercadoRequest(input: { notificationId?: number; dataId?: string } = {}): Request {
  const notificationId = input.notificationId;
  const dataId = input.dataId ?? "mp-payment-1";
  const timestamp = "1785319200";
  const requestId = "request-1";
  const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
  const digest = createHmac("sha256", "mp-webhook-test").update(manifest).digest("hex");
  return new Request(
    `https://www.goargentina.ru/api/webhooks/payments/mercadopago?type=payment&data.id=${encodeURIComponent(dataId)}`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-request-id": requestId,
        "x-signature": `ts=${timestamp},v1=${digest}`,
      },
      body: JSON.stringify({
        ...(notificationId === undefined ? {} : { id: notificationId }),
        type: "payment",
        action: "payment.updated",
        data: { id: dataId },
      }),
    },
  );
}

describe("signed payment webhook route orchestration", () => {
  beforeEach(() => {
    process.env.STRIPE_WEBHOOK_SECRET = "whsec-test";
    process.env.STRIPE_SECRET_KEY = "sk-test";
    process.env.MERCADOPAGO_WEBHOOK_SECRET = "mp-webhook-test";
    process.env.MERCADOPAGO_ACCESS_TOKEN = "mp-access-test";

    mocks.applyDetailed.mockReset().mockResolvedValue({ kind: "applied" });
    mocks.persistLedger.mockReset().mockResolvedValue(ledgerSuccess());
    mocks.notifyPayment.mockReset().mockResolvedValue(undefined);
    mocks.breadcrumb.mockReset();
    mocks.captureException.mockReset();
    mocks.fetchPaymentIntent.mockReset().mockResolvedValue({
      id: "pi-1",
      status: "succeeded",
      amount: 10_000,
      amountReceived: 10_000,
      amountCapturable: 0,
      currency: "USD",
      metadata: {
        bookingId: "booking-1",
        paymentLinkToken: "pay-token",
        amountUsd: 100,
      },
      created: 1_785_319_200,
    });
    mocks.fetchCharge.mockReset();
    mocks.fetchMercadoPayment.mockReset().mockResolvedValue({
      id: "mp-payment-1",
      status: "approved",
      transactionAmount: 100,
      currencyId: "USD",
      externalReference: "booking-1",
      metadata: { paymentLinkToken: "pay-token", amountUsd: 100 },
      dateCreated: "2026-07-29T10:00:00.000Z",
      dateApproved: "2026-07-29T10:01:00.000Z",
    });
  });

  afterAll(() => {
    const restore = (key: string, value: string | undefined) => {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    };
    restore("STRIPE_WEBHOOK_SECRET", originalEnv.stripeWebhookSecret);
    restore("STRIPE_SECRET_KEY", originalEnv.stripeSecretKey);
    restore("MERCADOPAGO_WEBHOOK_SECRET", originalEnv.mercadoWebhookSecret);
    restore("MERCADOPAGO_ACCESS_TOKEN", originalEnv.mercadoAccessToken);
  });

  it("returns 500 on lost Stripe ledger and repairs it on exact replay", async () => {
    mocks.applyDetailed
      .mockResolvedValueOnce({ kind: "applied" })
      .mockResolvedValueOnce({ kind: "event_replay" });
    mocks.persistLedger
      .mockResolvedValueOnce({
        ok: false,
        reason: "charge_upsert_failed",
        error: "db-password-secret",
      })
      .mockResolvedValueOnce(ledgerSuccess("inserted"));

    const first = await stripeWebhook(stripeRequest());
    const replay = await stripeWebhook(stripeRequest());

    expect(first.status).toBe(500);
    await expect(first.json()).resolves.toEqual({
      ok: false,
      error: "Failed to process Stripe webhook.",
    });
    expect(replay.status).toBe(200);
    await expect(replay.json()).resolves.toEqual({ ok: true, applied: false, replayed: true });
    expect(mocks.persistLedger).toHaveBeenCalledTimes(2);
    expect(mocks.notifyPayment).toHaveBeenCalledTimes(1);
    expect(mocks.captureException).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining("db-password-secret") }),
      expect.anything(),
    );
  });

  it("processes a signed Mercado notification only after durable ledger persistence", async () => {
    const response = await mercadoWebhook(mercadoRequest({ notificationId: 12345 }));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, applied: true, replayed: false });
    expect(mocks.fetchMercadoPayment).toHaveBeenCalledTimes(1);
    expect(mocks.persistLedger).toHaveBeenCalledTimes(1);
    expect(mocks.notifyPayment).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent signed delivery at the booking, ledger and notification boundaries", async () => {
    mocks.applyDetailed
      .mockResolvedValueOnce({ kind: "applied" })
      .mockResolvedValueOnce({ kind: "event_replay" });
    mocks.persistLedger
      .mockResolvedValueOnce(ledgerSuccess("inserted"))
      .mockResolvedValueOnce(ledgerSuccess("updated"));

    const responses = await Promise.all([
      stripeWebhook(stripeRequest("evt-concurrent")),
      stripeWebhook(stripeRequest("evt-concurrent")),
    ]);

    expect(responses.map((response) => response.status)).toEqual([200, 200]);
    expect(mocks.persistLedger).toHaveBeenCalledTimes(2);
    expect(mocks.notifyPayment).toHaveBeenCalledTimes(1);
  });

  it("keeps distinct Mercado notification identities for payment lifecycle updates", async () => {
    mocks.persistLedger
      .mockResolvedValueOnce(ledgerSuccess("inserted"))
      .mockResolvedValueOnce(ledgerSuccess("updated"));

    const first = await mercadoWebhook(mercadoRequest({ notificationId: 12345 }));
    const second = await mercadoWebhook(mercadoRequest({ notificationId: 12346 }));

    expect([first.status, second.status]).toEqual([200, 200]);
    expect(mocks.applyDetailed.mock.calls[0]?.[2]).toMatchObject({ sourceEventId: "12345" });
    expect(mocks.applyDetailed.mock.calls[1]?.[2]).toMatchObject({ sourceEventId: "12346" });
  });

  it("never writes ledger for rejected token or amount state", async () => {
    mocks.applyDetailed.mockResolvedValueOnce({ kind: "ignored", reason: "token_mismatch" });

    const response = await stripeWebhook(stripeRequest("evt-wrong-token"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, applied: false, replayed: false });
    expect(mocks.persistLedger).not.toHaveBeenCalled();
    expect(mocks.notifyPayment).not.toHaveBeenCalled();
  });

  it("returns a retryable public-safe failure when the booking write is unavailable", async () => {
    mocks.applyDetailed.mockResolvedValueOnce({
      kind: "retryable_failure",
      reason: "write_failed",
      error: "postgres://secret-host",
    });

    const response = await stripeWebhook(stripeRequest("evt-storage-failure"));

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Failed to process Stripe webhook.",
    });
    expect(mocks.persistLedger).not.toHaveBeenCalled();
    expect(mocks.notifyPayment).not.toHaveBeenCalled();
  });

  it("rejects a Mercado payment without a durable notification id before provider or DB calls", async () => {
    const response = await mercadoWebhook(mercadoRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      ok: false,
      error: "Mercado Pago notification identity is missing.",
    });
    expect(mocks.fetchMercadoPayment).not.toHaveBeenCalled();
    expect(mocks.applyDetailed).not.toHaveBeenCalled();
    expect(mocks.persistLedger).not.toHaveBeenCalled();
  });

  it("does not disclose missing provider configuration", async () => {
    delete process.env.STRIPE_SECRET_KEY;

    const response = await stripeWebhook(stripeRequest("evt-no-config"));
    const body = await response.json();

    expect(response.status).toBe(503);
    expect(body).toEqual({ ok: false, error: "Stripe webhook is temporarily unavailable." });
    expect(JSON.stringify(body)).not.toContain("STRIPE_SECRET_KEY");
    expect(mocks.fetchPaymentIntent).not.toHaveBeenCalled();
  });
});
