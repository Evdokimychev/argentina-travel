import { describe, expect, it } from "vitest";
import type { PaymentTransactionRow } from "@/types/payment-platform";
import { classifyRefundReconciliation } from "./refund-reconciliation";

function transaction(
  overrides: Partial<PaymentTransactionRow> & Pick<PaymentTransactionRow, "id" | "type">,
): PaymentTransactionRow {
  const { id, type, ...rest } = overrides;
  return {
    id,
    bookingId: "booking-1",
    provider: "stripe",
    externalId: type === "charge" ? "pi_1" : null,
    amount: 12.5,
    currency: "USD",
    status: type === "charge" ? "completed" : "processing",
    type,
    sourceEventId: null,
    requestedBy: null,
    approvedBy: null,
    requestReason: null,
    adminNotes: null,
    metadata: {},
    createdAt: "2026-07-29T12:00:00Z",
    updatedAt: "2026-07-29T12:00:00Z",
    ...rest,
  };
}

const charge = transaction({ id: "charge-1", type: "charge" });

describe("refund reconciliation classification", () => {
  it("accepts provider metadata as exact correlation but never authorizes mutation", () => {
    const result = classifyRefundReconciliation(
      transaction({ id: "refund-1", type: "refund" }),
      charge,
      [{
        providerRefundId: "re_1",
        status: "succeeded",
        amount: 12.5,
        currency: "USD",
        createdAt: "2026-07-29T12:01:00Z",
        sourcePaymentId: "pi_1",
        providerRefundTransactionId: "refund-1",
      }],
    );

    expect(result).toMatchObject({
      classification: "exact_match",
      safeToMutate: false,
      candidates: [{ providerRefundId: "re_1", correlation: "provider_metadata" }],
    });
    expect(result.requiredNextStep).toContain("recovery lease");
  });

  it("does not treat a unique amount-only Mercado Pago result as exact", () => {
    const result = classifyRefundReconciliation(
      transaction({ id: "refund-1", type: "refund", provider: "mercadopago", currency: "ARS" }),
      transaction({
        id: "charge-1",
        type: "charge",
        provider: "mercadopago",
        externalId: "123",
        currency: "ARS",
      }),
      [{
        providerRefundId: "77",
        status: "approved",
        amount: 12.5,
        currency: null,
        createdAt: null,
        sourcePaymentId: "123",
      }],
    );

    expect(result.classification).toBe("candidate");
    expect(result.safeToMutate).toBe(false);
    expect(result.candidates[0]?.correlation).toBe("amount_only");
  });

  it("fails closed when several refunds match the same amount", () => {
    const refund = transaction({ id: "refund-1", type: "refund" });
    const candidates = ["re_1", "re_2"].map((providerRefundId) => ({
      providerRefundId,
      status: "succeeded",
      amount: 12.5,
      currency: "USD",
      createdAt: null,
      sourcePaymentId: "pi_1",
    }));

    expect(classifyRefundReconciliation(refund, charge, candidates)).toMatchObject({
      classification: "ambiguous",
      safeToMutate: false,
    });
  });

  it("does not interpret an empty provider list as permission to retry", () => {
    const result = classifyRefundReconciliation(
      transaction({ id: "refund-1", type: "refund" }),
      charge,
      [],
    );

    expect(result.classification).toBe("not_found");
    expect(result.safeToMutate).toBe(false);
    expect(result.requiredNextStep).toContain("Не повторять POST");
  });

  it("refuses reconciliation without the exact source charge", () => {
    expect(classifyRefundReconciliation(
      transaction({ id: "refund-1", type: "refund" }),
      null,
      [],
    )).toMatchObject({ classification: "unavailable", safeToMutate: false });
  });
});
