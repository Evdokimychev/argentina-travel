import { describe, expect, it, vi } from "vitest";
import type { PaymentTransactionRow } from "@/types/payment-platform";
import { resolveRefundExecutionPlan } from "./transaction-server";

function transaction(
  overrides: Partial<PaymentTransactionRow> & Pick<PaymentTransactionRow, "id" | "type">,
): PaymentTransactionRow {
  const { id, type, ...rest } = overrides;
  return {
    id,
    bookingId: "booking-1",
    provider: "stripe",
    externalId: type === "charge" ? "pi_1" : null,
    amount: 100,
    currency: "USD",
    status: type === "charge" ? "completed" : "pending",
    type,
    sourceEventId: null,
    requestedBy: null,
    approvedBy: null,
    requestReason: null,
    adminNotes: null,
    metadata: {},
    createdAt: "2026-07-16T00:00:00.000Z",
    updatedAt: "2026-07-16T00:00:00.000Z",
    ...rest,
  };
}

function chargeQuery(rows: PaymentTransactionRow[]) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq", "order"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.limit = vi.fn(async () => ({
    data: rows.map((row) => ({
      id: row.id,
      booking_id: row.bookingId,
      provider: row.provider,
      external_id: row.externalId,
      amount: row.amount,
      currency: row.currency,
      status: row.status,
      type: row.type,
      source_event_id: row.sourceEventId,
      requested_by: row.requestedBy,
      approved_by: row.approvedBy,
      request_reason: row.requestReason,
      admin_notes: row.adminNotes,
      metadata: row.metadata,
      created_at: row.createdAt,
      updated_at: row.updatedAt,
    })),
  }));
  return chain;
}

function refundHistoryQuery(rows: Array<{ amount: number; currency: string }>) {
  const chain: Record<string, unknown> = {};
  for (const method of ["select", "eq"]) {
    chain[method] = vi.fn(() => chain);
  }
  chain.in = vi.fn(async () => ({ data: rows }));
  return chain;
}

function supabaseFor(
  charges: PaymentTransactionRow[],
  refunds: Array<{ amount: number; currency: string }> = [],
) {
  const from = vi
    .fn()
    .mockReturnValueOnce(chargeQuery(charges))
    .mockReturnValueOnce(refundHistoryQuery(refunds));
  return { from };
}

describe("refund execution planning", () => {
  it("keeps a partial refund inside the source charge currency and remaining amount", async () => {
    const refund = transaction({ id: "refund-1", type: "refund", amount: 30 });
    const client = supabaseFor(
      [transaction({ id: "charge-1", type: "charge", amount: 100 })],
      [{ amount: 20, currency: "USD" }],
    );

    const result = await resolveRefundExecutionPlan(client as never, refund);

    expect(result).toMatchObject({
      ok: true,
      plan: {
        captured: { currency: "USD", minorUnits: 10000 },
        requested: { currency: "USD", minorUnits: 3000 },
        remainingBeforeRefund: { currency: "USD", minorUnits: 8000 },
        remainingAfterRefund: { currency: "USD", minorUnits: 5000 },
      },
    });
  });

  it("fails closed when the refund currency differs from the source charge", async () => {
    const refund = transaction({ id: "refund-1", type: "refund", currency: "ARS" });
    const client = supabaseFor([transaction({ id: "charge-1", type: "charge" })]);

    const result = await resolveRefundExecutionPlan(client as never, refund);

    expect(result).toEqual({
      ok: false,
      error: "Валюта возврата не совпадает с валютой исходного списания",
    });
  });

  it("does not silently cap a refund that exceeds the remaining charge", async () => {
    const refund = transaction({ id: "refund-1", type: "refund", amount: 30 });
    const client = supabaseFor(
      [transaction({ id: "charge-1", type: "charge", amount: 100 })],
      [{ amount: 80, currency: "USD" }],
    );

    const result = await resolveRefundExecutionPlan(client as never, refund);

    expect(result).toEqual({
      ok: false,
      error: "Запрошенная сумма превышает остаток по исходному списанию",
    });
  });

  it("requires an explicit source when more than one completed charge exists", async () => {
    const refund = transaction({ id: "refund-1", type: "refund" });
    const client = supabaseFor([
      transaction({ id: "charge-1", type: "charge" }),
      transaction({ id: "charge-2", type: "charge", externalId: "pi_2" }),
    ]);

    const result = await resolveRefundExecutionPlan(client as never, refund);

    expect(result).toEqual({
      ok: false,
      error: "Найдено несколько списаний: выберите исходное списание перед возвратом",
    });
  });
});
