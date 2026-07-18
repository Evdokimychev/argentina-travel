import { describe, expect, it } from "vitest";
import type { PaymentTransactionRow } from "@/types/payment-platform";
import { computeReconciliationTotals } from "./reconciliation-server";

function transaction(
  id: string,
  type: PaymentTransactionRow["type"],
  amount: number,
  currency: string,
  status: PaymentTransactionRow["status"] = "completed",
): PaymentTransactionRow {
  return {
    id,
    bookingId: "booking-1",
    provider: "manual",
    externalId: null,
    amount,
    currency,
    status,
    type,
    sourceEventId: null,
    requestedBy: null,
    approvedBy: null,
    requestReason: null,
    adminNotes: null,
    metadata: {},
    createdAt: "2026-07-16T00:00:00.000Z",
    updatedAt: "2026-07-16T00:00:00.000Z",
  };
}

describe("reconciliation totals v2", () => {
  it("never combines different currencies into one net amount", () => {
    const result = computeReconciliationTotals([
      transaction("usd-charge", "charge", 100, "USD"),
      transaction("usd-refund", "refund", 25, "USD"),
      transaction("ars-charge", "charge", 100_000, "ARS"),
      transaction("rub-payout", "payout", 5_000, "RUB", "processing"),
    ]);

    expect(result).toEqual({
      schemaVersion: 2,
      byCurrency: [
        expect.objectContaining({ currency: "RUB", netAmount: -5_000 }),
        expect.objectContaining({ currency: "ARS", netAmount: 100_000 }),
        expect.objectContaining({ currency: "USD", netAmount: 75 }),
      ],
      invalidRecordCount: 0,
    });
  });

  it("excludes unsupported currencies and reports them", () => {
    const result = computeReconciliationTotals([
      transaction("valid", "charge", 100, "USD"),
      transaction("invalid", "charge", 1, "BTC"),
    ]);

    expect(result.byCurrency).toHaveLength(1);
    expect(result.invalidRecordCount).toBe(1);
  });
});
