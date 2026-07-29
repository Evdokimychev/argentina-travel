import { describe, expect, it } from "vitest";
import { upsertChargeFromWebhook } from "./transaction-server";
import type { BookingPaymentWebhookPatch } from "@/types/payment-webhook";

function patch(
  overrides: Partial<BookingPaymentWebhookPatch> = {},
): BookingPaymentWebhookPatch {
  return {
    verified: true,
    paymentStatus: "paid",
    paymentSummary: {
      totalAmountUsd: 100,
      paidAmountUsd: 100,
      remainingAmountUsd: 0,
      serviceFeeUsd: 0,
    },
    sourceEventId: "evt-paid",
    provider: "stripe",
    occurredAt: "2026-07-29T10:00:00.000Z",
    ...overrides,
  };
}

function createTransactionDb() {
  const rows = new Map<string, Record<string, unknown>>();
  let sequence = 0;

  function key(provider: unknown, externalId: unknown) {
    return `${String(provider)}:${String(externalId)}`;
  }

  const db = {
    from(table: string) {
      if (table !== "payment_transactions") throw new Error(`Unexpected table: ${table}`);
      return {
        insert(payload: Record<string, unknown>) {
          return {
            select() {
              return this;
            },
            async single() {
              const rowKey = key(payload.provider, payload.external_id);
              if (rows.has(rowKey)) {
                return {
                  data: null,
                  error: { code: "23505", message: "duplicate provider/external_id" },
                };
              }
              sequence += 1;
              const now = `2026-07-29T10:00:0${sequence}.000Z`;
              const row = {
                id: `tx-${sequence}`,
                source_event_id: null,
                requested_by: null,
                approved_by: null,
                request_idempotency_key: null,
                source_transaction_id: null,
                claimed_by: null,
                claimed_at: null,
                request_reason: null,
                admin_notes: null,
                created_at: now,
                updated_at: now,
                ...structuredClone(payload),
              };
              rows.set(rowKey, row);
              return { data: structuredClone(row), error: null };
            },
          };
        },
        select() {
          const filters = new Map<string, unknown>();
          return {
            eq(column: string, value: unknown) {
              filters.set(column, value);
              return this;
            },
            async maybeSingle() {
              const row = rows.get(key(filters.get("provider"), filters.get("external_id")));
              return { data: row ? structuredClone(row) : null, error: null };
            },
          };
        },
        update(values: Record<string, unknown>) {
          const filters = new Map<string, unknown>();
          return {
            eq(column: string, value: unknown) {
              filters.set(column, value);
              return this;
            },
            select() {
              return this;
            },
            async single() {
              const entry = Array.from(rows.entries()).find(([, row]) =>
                row.id === filters.get("id") && row.booking_id === filters.get("booking_id"),
              );
              if (!entry) return { data: null, error: { message: "row not found" } };
              const [rowKey, row] = entry;
              const updated = {
                ...row,
                ...structuredClone(values),
                updated_at: "2026-07-29T10:01:00.000Z",
              };
              rows.set(rowKey, updated);
              return { data: structuredClone(updated), error: null };
            },
          };
        },
      };
    },
  };

  return { db, rows };
}

function input(inputPatch = patch(), bookingId = "booking-1") {
  return {
    bookingId,
    provider: inputPatch.provider,
    externalId: "pi-1",
    amount: 100,
    currency: "USD",
    patch: inputPatch,
    receiptMetadata: {
      providerPaymentId: "pi-1",
      providerStatus: inputPatch.paymentStatus,
      capturePhase: inputPatch.paymentStatus === "refunded" ? "refunded" : "captured",
    },
  };
}

describe("webhook charge persistence", () => {
  it("uses the unique provider/external id boundary under concurrent delivery", async () => {
    const state = createTransactionDb();

    const results = await Promise.all([
      upsertChargeFromWebhook(state.db as never, input()),
      upsertChargeFromWebhook(state.db as never, input()),
    ]);

    expect(results.every((result) => result.ok)).toBe(true);
    expect(results.map((result) => result.ok && result.operation).sort()).toEqual([
      "inserted",
      "updated",
    ]);
    expect(state.rows).toHaveLength(1);
  });

  it("never regresses a refunded ledger row with a delayed paid event", async () => {
    const state = createTransactionDb();
    const refunded = patch({
      paymentStatus: "refunded",
      sourceEventId: "evt-refund",
      occurredAt: "2026-07-29T11:00:00.000Z",
    });
    expect(await upsertChargeFromWebhook(state.db as never, input(refunded))).toMatchObject({
      ok: true,
      operation: "inserted",
    });

    const delayedPaid = patch({
      sourceEventId: "evt-late-paid",
      occurredAt: "2026-07-29T10:00:00.000Z",
    });
    const result = await upsertChargeFromWebhook(state.db as never, input(delayedPaid));

    expect(result).toMatchObject({ ok: true, operation: "unchanged" });
    expect(result.ok && result.transaction.metadata).toMatchObject({
      paymentStatus: "refunded",
      occurredAt: "2026-07-29T11:00:00.000Z",
    });
  });

  it("rejects an external charge identity already bound to another booking", async () => {
    const state = createTransactionDb();
    expect(await upsertChargeFromWebhook(state.db as never, input())).toMatchObject({ ok: true });

    await expect(
      upsertChargeFromWebhook(state.db as never, input(patch(), "booking-2")),
    ).resolves.toEqual({ ok: false, reason: "booking_mismatch" });
    expect(state.rows).toHaveLength(1);
  });
});
