import { describe, expect, it, vi } from "vitest";
import { createRefundRequest } from "@/lib/payments/transaction-server";

type Row = Record<string, unknown>;

function transactionRow(overrides: Row = {}): Row {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    booking_id: "booking-1",
    provider: "mercadopago",
    external_id: "provider-charge-1",
    amount: 120000,
    currency: "ARS",
    status: "completed",
    type: "charge",
    source_event_id: null,
    requested_by: null,
    approved_by: null,
    request_idempotency_key: null,
    source_transaction_id: null,
    claimed_by: null,
    claimed_at: null,
    request_reason: null,
    admin_notes: null,
    metadata: {},
    created_at: "2026-07-29T10:00:00.000Z",
    updated_at: "2026-07-29T10:00:00.000Z",
    ...overrides,
  };
}

function fakeSupabase(input?: { existingRefund?: Row | null; charge?: Row }) {
  const charge = input?.charge ?? transactionRow();
  const rpc = vi.fn(async (_name: string, params: Record<string, unknown>) => ({
    data: transactionRow({
      id: "22222222-2222-4222-8222-222222222222",
      type: "refund",
      status: "pending",
      external_id: null,
      amount: params.p_amount,
      currency: params.p_currency,
      requested_by: params.p_requested_by,
      request_idempotency_key: params.p_request_idempotency_key,
      source_transaction_id: params.p_source_transaction_id,
    }),
    error: null,
  }));

  const from = vi.fn(() => {
    const filters = new Map<string, unknown>();
    const query = {
      select: () => query,
      eq: (column: string, value: unknown) => {
        filters.set(column, value);
        return query;
      },
      order: () => query,
      limit: () => query,
      maybeSingle: async () => {
        if (filters.get("type") === "refund") {
          return { data: input?.existingRefund ?? null, error: null };
        }
        const matches =
          filters.get("id") === undefined || filters.get("id") === charge.id;
        return { data: matches ? charge : null, error: null };
      },
      then: (
        resolve: (value: { data: Row[]; error: null }) => unknown,
        reject: (reason: unknown) => unknown,
      ) => Promise.resolve({ data: [charge], error: null }).then(resolve, reject),
    };
    return query;
  });

  return { client: { from, rpc } as never, from, rpc };
}

const baseInput = {
  bookingId: "booking-1",
  requestedBy: "33333333-3333-4333-8333-333333333333",
  operationId: "44444444-4444-4444-8444-444444444444",
};

describe("refund request ledger integrity", () => {
  it("derives a full refund amount and currency from the completed source charge", async () => {
    const { client, rpc } = fakeSupabase();

    const result = await createRefundRequest(client, baseInput);

    expect(result).toEqual({
      transaction: expect.objectContaining({ amount: 120000, currency: "ARS", status: "pending" }),
    });
    expect(rpc).toHaveBeenCalledWith(
      "prepare_refund_request_atomic",
      expect.objectContaining({
        p_source_transaction_id: "11111111-1111-4111-8111-111111111111",
        p_amount: 120000,
        p_currency: "ARS",
        p_provider: "mercadopago",
      }),
    );
  });

  it("rejects legacy USD input for a non-USD charge before the atomic reservation", async () => {
    const { client, rpc } = fakeSupabase();

    const result = await createRefundRequest(client, {
      ...baseInput,
      amount: 100,
      currency: "USD",
    });

    expect(result).toEqual({
      error: "Валюта возврата не совпадает с валютой исходного списания",
    });
    expect(rpc).not.toHaveBeenCalled();
  });

  it("returns the original refund for an identical operation replay", async () => {
    const existingRefund = transactionRow({
      id: "22222222-2222-4222-8222-222222222222",
      type: "refund",
      status: "pending",
      requested_by: baseInput.requestedBy,
      request_idempotency_key: baseInput.operationId,
      source_transaction_id: "11111111-1111-4111-8111-111111111111",
    });
    const { client, rpc, from } = fakeSupabase({ existingRefund });

    const result = await createRefundRequest(client, baseInput);

    expect(result).toEqual({
      transaction: expect.objectContaining({ id: existingRefund.id, status: "pending" }),
    });
    expect(from).toHaveBeenCalledTimes(1);
    expect(rpc).not.toHaveBeenCalled();
  });

  it("rejects reuse of an operation id by another actor", async () => {
    const existingRefund = transactionRow({
      type: "refund",
      status: "pending",
      requested_by: "different-actor",
      request_idempotency_key: baseInput.operationId,
    });
    const { client, rpc } = fakeSupabase({ existingRefund });

    const result = await createRefundRequest(client, baseInput);

    expect(result).toEqual({
      error: "Идентификатор операции уже использован для другого возврата",
    });
    expect(rpc).not.toHaveBeenCalled();
  });
});
