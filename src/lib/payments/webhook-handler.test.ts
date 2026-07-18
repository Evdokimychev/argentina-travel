import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyWebhookSignature } from "./mercadopago-client";
import { verifyStripeWebhookSignature } from "./stripe-client";
import {
  applyPaymentWebhookPatch,
  mapWebhookToBookingPaymentUpdate,
  parseAndValidateWebhook,
} from "./webhook-handler";
import type { BookingPaymentWebhookPatch, PaymentWebhookEvent } from "@/types/payment-webhook";

function paymentEvent(
  overrides: Partial<PaymentWebhookEvent> = {},
): PaymentWebhookEvent {
  return {
    provider: "stripe",
    eventId: "evt-1",
    eventType: "payment_intent.succeeded",
    bookingId: "booking-1",
    paymentLinkToken: "link-token",
    paymentStatus: "paid",
    amountPaidUsd: 100,
    amountTotalUsd: 100,
    occurredAt: "2026-07-17T00:00:00.000Z",
    rawPayload: {},
    ...overrides,
  };
}

function bookingRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "booking-1",
    total_price_usd: 100,
    payment_status: "pending",
    updated_at: "2026-07-17T00:00:00.000Z",
    payload: {
      paymentStatus: "pending",
      paymentSummary: {
        totalAmountUsd: 100,
        paidAmountUsd: 0,
        remainingAmountUsd: 100,
        serviceFeeUsd: 0,
      },
      paymentLink: {
        token: "link-token",
        amountUsd: 100,
        status: "pending",
      },
      processedPaymentEventIds: [],
    },
    ...overrides,
  };
}

function createBookingDb(
  initialRow = bookingRow(),
  options: { conflicts?: number } = {},
) {
  let row = structuredClone(initialRow) as ReturnType<typeof bookingRow>;
  let conflicts = options.conflicts ?? 0;
  let readCalls = 0;
  let updateCalls = 0;
  let fromCalls = 0;

  const readQuery = {
    eq() {
      return this;
    },
    async maybeSingle() {
      readCalls += 1;
      return { data: structuredClone(row), error: null };
    },
  };

  const db = {
    from(table: string) {
      fromCalls += 1;
      if (table !== "bookings") throw new Error(`Unexpected table: ${table}`);
      return {
        select() {
          return readQuery;
        },
        update(values: Record<string, unknown>) {
          const filters = new Map<string, unknown>();
          return {
            eq(key: string, value: unknown) {
              filters.set(key, value);
              return this;
            },
            select() {
              return this;
            },
            async maybeSingle() {
              updateCalls += 1;
              if (conflicts > 0) {
                conflicts -= 1;
                return { data: null, error: null };
              }
              if (
                filters.get("id") !== row.id ||
                filters.get("updated_at") !== row.updated_at
              ) {
                return { data: null, error: null };
              }
              row = { ...row, ...structuredClone(values) };
              return { data: { id: row.id }, error: null };
            },
          };
        },
      };
    },
  };

  return {
    db,
    get row() {
      return row;
    },
    get readCalls() {
      return readCalls;
    },
    get updateCalls() {
      return updateCalls;
    },
    get fromCalls() {
      return fromCalls;
    },
  };
}

describe("provider webhook signatures", () => {
  it("verifies the Stripe raw-body HMAC and rejects tampering or stale timestamps", () => {
    const secret = "whsec_test";
    const rawBody = JSON.stringify({ id: "evt-1", data: { object: { id: "pi-1" } } });
    const timestamp = Math.floor(Date.now() / 1000);
    const digest = createHmac("sha256", secret)
      .update(`${timestamp}.${rawBody}`, "utf8")
      .digest("hex");
    const signatureHeader = `t=${timestamp},v1=bad,v1=${digest}`;

    expect(verifyStripeWebhookSignature({ secret, signatureHeader, rawBody })).toBe(true);
    expect(
      verifyStripeWebhookSignature({ secret, signatureHeader, rawBody: `${rawBody} ` }),
    ).toBe(false);
    expect(
      verifyStripeWebhookSignature({
        secret,
        signatureHeader: `t=${timestamp - 1_000},v1=${digest}`,
        rawBody,
      }),
    ).toBe(false);
    expect(
      verifyStripeWebhookSignature({ secret, signatureHeader: null, rawBody }),
    ).toBe(false);
  });

  it("verifies the Mercado Pago manifest and rejects changed request data", () => {
    const secret = "mp-secret";
    const timestamp = "1784246400";
    const dataId = "Payment-ABC";
    const requestId = "request-1";
    const manifest = `id:${dataId.toLowerCase()};request-id:${requestId};ts:${timestamp};`;
    const digest = createHmac("sha256", secret).update(manifest).digest("hex");
    const signatureHeader = `ts=${timestamp},v1=${digest}`;

    expect(
      verifyWebhookSignature({
        secret,
        signatureHeader,
        requestIdHeader: requestId,
        dataId,
      }),
    ).toBe(true);
    expect(
      verifyWebhookSignature({
        secret,
        signatureHeader,
        requestIdHeader: "request-2",
        dataId,
      }),
    ).toBe(false);
    expect(
      verifyWebhookSignature({
        secret: null,
        signatureHeader,
        requestIdHeader: requestId,
        dataId,
      }),
    ).toBe(false);
  });
});

describe("generic webhook parsing", () => {
  it("requires both a payload identity and a configured matching secret", () => {
    const payload = {
      id: "evt-1",
      metadata: { bookingId: "booking-1", paymentLinkToken: "link-token" },
      status: "paid",
      amountPaid: 100,
      amountTotal: 100,
    };

    expect(
      parseAndValidateWebhook({
        provider: "manual",
        payload,
        secret: "secret",
        signatureHeader: "secret",
      }),
    ).toMatchObject({ verified: true, event: { eventId: "evt-1", bookingId: "booking-1" } });
    expect(
      parseAndValidateWebhook({ provider: "manual", payload, secret: "secret" }).verified,
    ).toBe(false);
    expect(
      parseAndValidateWebhook({ provider: "manual", payload, signatureHeader: "secret" }).verified,
    ).toBe(false);
    expect(
      parseAndValidateWebhook({ provider: "manual", payload: { id: "evt-1" } }),
    ).toMatchObject({ verified: false, event: null, error: "Missing bookingId in webhook payload" });
  });
});

describe("payment webhook application", () => {
  it("does not read or write for an unverified patch", async () => {
    const state = createBookingDb();
    const patch = mapWebhookToBookingPaymentUpdate(paymentEvent(), false);
    expect(await applyPaymentWebhookPatch(state.db as never, "booking-1", patch)).toBe(false);
    expect(state.fromCalls).toBe(0);
  });

  it("applies one captured event and rejects its replay", async () => {
    const state = createBookingDb();
    const patch = mapWebhookToBookingPaymentUpdate(paymentEvent(), true);

    expect(await applyPaymentWebhookPatch(state.db as never, "booking-1", patch)).toBe(true);
    expect(state.row.payment_status).toBe("paid");
    expect(state.row.payload).toMatchObject({
      paymentStatus: "paid",
      paymentSummary: { paidAmountUsd: 100, remainingAmountUsd: 0 },
      processedPaymentEventIds: ["evt-1"],
    });
    expect(await applyPaymentWebhookPatch(state.db as never, "booking-1", patch)).toBe(false);
    expect(state.updateCalls).toBe(1);
  });

  it("rejects a mismatched payment-link token or server amount", async () => {
    const wrongTokenState = createBookingDb();
    const wrongToken = mapWebhookToBookingPaymentUpdate(
      paymentEvent({ paymentLinkToken: "another-token" }),
      true,
    );
    expect(
      await applyPaymentWebhookPatch(wrongTokenState.db as never, "booking-1", wrongToken),
    ).toBe(false);
    expect(wrongTokenState.updateCalls).toBe(0);

    const wrongAmountState = createBookingDb();
    const wrongAmount = mapWebhookToBookingPaymentUpdate(
      paymentEvent({ amountPaidUsd: 99, amountTotalUsd: 99 }),
      true,
    );
    expect(
      await applyPaymentWebhookPatch(wrongAmountState.db as never, "booking-1", wrongAmount),
    ).toBe(false);
    expect(wrongAmountState.updateCalls).toBe(0);
  });

  it("retries an optimistic-lock conflict without double-applying the event", async () => {
    const state = createBookingDb(bookingRow(), { conflicts: 1 });
    const patch = mapWebhookToBookingPaymentUpdate(paymentEvent(), true);
    expect(await applyPaymentWebhookPatch(state.db as never, "booking-1", patch)).toBe(true);
    expect(state.readCalls).toBe(2);
    expect(state.updateCalls).toBe(2);
    expect(state.row.payload).toMatchObject({ processedPaymentEventIds: ["evt-1"] });
  });

  it("moves a paid booking to refunded and clears captured totals", async () => {
    const state = createBookingDb(
      bookingRow({
        payment_status: "paid",
        payload: {
          paymentStatus: "paid",
          paymentSummary: {
            totalAmountUsd: 100,
            paidAmountUsd: 100,
            remainingAmountUsd: 0,
            serviceFeeUsd: 5,
          },
          paymentLink: {
            token: "link-token",
            amountUsd: 100,
            status: "paid",
          },
          processedPaymentEventIds: ["evt-paid"],
        },
      }),
    );
    const patch = mapWebhookToBookingPaymentUpdate(
      paymentEvent({ eventId: "evt-refund", paymentStatus: "refunded" }),
      true,
    );

    expect(await applyPaymentWebhookPatch(state.db as never, "booking-1", patch)).toBe(true);
    expect(state.row.payload).toMatchObject({
      paymentStatus: "refunded",
      paymentSummary: { paidAmountUsd: 0, remainingAmountUsd: 100, serviceFeeUsd: 5 },
      paymentLink: { status: "cancelled" },
      processedPaymentEventIds: ["evt-paid", "evt-refund"],
    });
  });

  it("keeps only the latest 50 processed event ids", async () => {
    const oldIds = Array.from({ length: 60 }, (_, index) => `old-${index}`);
    const state = createBookingDb(
      bookingRow({
        payload: {
          ...(bookingRow().payload as Record<string, unknown>),
          processedPaymentEventIds: oldIds,
        },
      }),
    );
    const patch: BookingPaymentWebhookPatch = mapWebhookToBookingPaymentUpdate(
      paymentEvent({ eventId: "evt-latest" }),
      true,
    );

    expect(await applyPaymentWebhookPatch(state.db as never, "booking-1", patch)).toBe(true);
    const ids = (state.row.payload as { processedPaymentEventIds: string[] })
      .processedPaymentEventIds;
    expect(ids).toHaveLength(50);
    expect(ids.at(-1)).toBe("evt-latest");
    expect(ids).not.toContain("old-0");
  });
});
