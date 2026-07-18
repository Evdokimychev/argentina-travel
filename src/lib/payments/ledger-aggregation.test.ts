import { describe, expect, it } from "vitest";
import {
  aggregateCommissionByCurrency,
  aggregateOrganizerBalancesByCurrency,
  aggregatePayoutsByCurrency,
  aggregateReconciliationByCurrency,
} from "./ledger-aggregation";

describe("currency-safe ledger aggregation", () => {
  it("keeps mixed currencies in separate reconciliation buckets", () => {
    const result = aggregateReconciliationByCurrency([
      { type: "charge", status: "completed", amount: 100, currency: "USD" },
      { type: "charge", status: "completed", amount: 25_000, currency: "ARS" },
      { type: "charge", status: "completed", amount: 8_000, currency: "RUB" },
    ]);

    expect(result.issues).toEqual([]);
    expect(result.byCurrency).toEqual([
      expect.objectContaining({ currency: "RUB", chargeAmount: 8_000, netAmount: 8_000 }),
      expect.objectContaining({ currency: "ARS", chargeAmount: 25_000, netAmount: 25_000 }),
      expect.objectContaining({ currency: "USD", chargeAmount: 100, netAmount: 100 }),
    ]);
  });

  it("does not sum unsupported currencies or invalid precision and reports their indexes", () => {
    const result = aggregateReconciliationByCurrency([
      { type: "charge", status: "completed", amount: 10, currency: "USD" },
      { type: "charge", status: "completed", amount: 20, currency: "GBP" },
      { type: "charge", status: "completed", amount: 1.001, currency: "EUR" },
    ]);

    expect(result.byCurrency).toEqual([
      expect.objectContaining({ currency: "USD", chargeAmount: 10, netAmount: 10 }),
    ]);
    expect(result.issues).toEqual([
      {
        source: "transaction",
        index: 1,
        reason: "unsupported_currency",
        field: "currency",
      },
      {
        source: "transaction",
        index: 2,
        reason: "invalid_precision",
        field: "amount",
      },
    ]);
  });

  it("subtracts refunds and payouts only inside their own currency", () => {
    const result = aggregateReconciliationByCurrency([
      { type: "charge", status: "completed", amount: 100, currency: "USD" },
      { type: "refund", status: "completed", amount: 20, currency: "USD" },
      { type: "payout", status: "processing", amount: 30, currency: "USD" },
      { type: "charge", status: "completed", amount: 10_000, currency: "ARS" },
      { type: "refund", status: "processing", amount: 2_000, currency: "ARS" },
      { type: "refund", status: "pending", amount: 500, currency: "ARS" },
    ]);

    expect(result.byCurrency).toEqual([
      {
        currency: "ARS",
        chargeCount: 1,
        chargeAmount: 10_000,
        refundCount: 1,
        refundAmount: 2_000,
        payoutCount: 0,
        payoutAmount: 0,
        netAmount: 8_000,
        pendingRefundCount: 1,
      },
      {
        currency: "USD",
        chargeCount: 1,
        chargeAmount: 100,
        refundCount: 1,
        refundAmount: 20,
        payoutCount: 1,
        payoutAmount: 30,
        netAmount: 50,
        pendingRefundCount: 0,
      },
    ]);
  });

  it("keeps commission and payout summaries currency-specific", () => {
    const commission = aggregateCommissionByCurrency([
      {
        grossAmount: 100,
        commissionAmount: 10,
        organizerNetAmount: 90,
        currency: "USD",
        organizerId: "organizer-1",
      },
      {
        grossAmount: 50_000,
        commissionAmount: 5_000,
        organizerNetAmount: 45_000,
        currency: "ARS",
        organizerId: "organizer-1",
      },
    ]);
    const payouts = aggregatePayoutsByCurrency([
      { amount: 10, currency: "USD", status: "pending" },
      { amount: 20, currency: "USD", status: "completed" },
      { amount: 3_000, currency: "ARS", status: "approved" },
      { amount: 4_000, currency: "ARS", status: "exported" },
    ]);

    expect(commission.issues).toEqual([]);
    expect(commission.byCurrency).toEqual([
      {
        currency: "ARS",
        grossTotal: 50_000,
        commissionTotal: 5_000,
        organizerNetTotal: 45_000,
        snapshotCount: 1,
        organizerCount: 1,
      },
      {
        currency: "USD",
        grossTotal: 100,
        commissionTotal: 10,
        organizerNetTotal: 90,
        snapshotCount: 1,
        organizerCount: 1,
      },
    ]);
    expect(payouts.byCurrency).toEqual([
      {
        currency: "ARS",
        totalPending: 0,
        totalApproved: 3_000,
        totalExported: 4_000,
        totalCompleted: 0,
        recordCount: 2,
      },
      {
        currency: "USD",
        totalPending: 10,
        totalApproved: 0,
        totalExported: 0,
        totalCompleted: 20,
        recordCount: 2,
      },
    ]);
  });

  it("calculates organizer balances independently for every currency", () => {
    const result = aggregateOrganizerBalancesByCurrency({
      snapshots: [
        {
          grossAmount: 100,
          commissionAmount: 10,
          organizerNetAmount: 90,
          currency: "USD",
          payoutRecordId: null,
        },
        {
          grossAmount: 20_000,
          commissionAmount: 2_000,
          organizerNetAmount: 18_000,
          currency: "ARS",
          payoutRecordId: null,
        },
      ],
      payouts: [
        { amount: 20, currency: "USD", status: "completed" },
        { amount: 10, currency: "USD", status: "approved" },
        { amount: 3_000, currency: "ARS", status: "pending" },
      ],
    });

    expect(result.issues).toEqual([]);
    expect(result.byCurrency).toEqual([
      {
        currency: "ARS",
        earnedNet: 18_000,
        commissionTotal: 2_000,
        grossTotal: 20_000,
        paidOut: 0,
        pendingPayout: 3_000,
        availableBalance: 15_000,
        snapshotCount: 1,
        unpaidSnapshotCount: 1,
        payoutCount: 1,
      },
      {
        currency: "USD",
        earnedNet: 90,
        commissionTotal: 10,
        grossTotal: 100,
        paidOut: 20,
        pendingPayout: 10,
        availableBalance: 60,
        snapshotCount: 1,
        unpaidSnapshotCount: 1,
        payoutCount: 2,
      },
    ]);
  });

  it("rejects an internally inconsistent commission record as one invalid row", () => {
    const result = aggregateCommissionByCurrency([
      {
        grossAmount: 100,
        commissionAmount: 10,
        organizerNetAmount: 95,
        currency: "USD",
      },
    ]);

    expect(result.byCurrency).toEqual([]);
    expect(result.issues).toEqual([
      { source: "commission", index: 0, reason: "amount_mismatch" },
    ]);
  });
});
