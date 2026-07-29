import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authorize: vi.fn(),
  fetchTransaction: vi.fn(),
  mapReceipt: vi.fn(),
  inspectRefund: vi.fn(),
  fetchPaymentDetails: vi.fn(),
  fetchPaymentIntent: vi.fn(),
  fetchCharge: vi.fn(),
}));

vi.mock("@/lib/admin/authorize-request", () => ({ authorizeAdminRequest: mocks.authorize }));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({ kind: "admin-client" }),
}));
vi.mock("@/lib/payments/transaction-server", () => ({
  fetchPaymentTransactionById: mocks.fetchTransaction,
  mapTransactionToReceiptView: mocks.mapReceipt,
}));
vi.mock("@/lib/payments/refund-reconciliation", () => ({
  inspectRefundReconciliation: mocks.inspectRefund,
}));
vi.mock("@/lib/payments/mercadopago-client", () => ({
  fetchPaymentDetails: mocks.fetchPaymentDetails,
  isMercadoPagoConfigured: () => true,
  mapMercadoPagoCapturePhase: vi.fn(),
}));
vi.mock("@/lib/payments/stripe-client", () => ({
  fetchCharge: mocks.fetchCharge,
  fetchPaymentIntent: mocks.fetchPaymentIntent,
  isStripeConfigured: () => true,
  mapStripeCapturePhase: vi.fn(),
}));

import { GET } from "@/app/api/admin/payments/transactions/[id]/route";

const context = { params: Promise.resolve({ id: "refund-1" }) };
const request = new Request("https://example.test/api/admin/payments/transactions/refund-1?live=1");
const refund = {
  id: "refund-1",
  type: "refund",
  status: "processing",
  provider: "stripe",
  externalId: "re_1",
  sourceTransactionId: "charge-1",
};
const charge = {
  id: "charge-1",
  type: "charge",
  status: "completed",
  provider: "stripe",
  externalId: "pi_1",
};

describe("GET /api/admin/payments/transactions/[id]", () => {
  beforeEach(() => {
    mocks.authorize.mockReset().mockResolvedValue({ ok: true, via: "session", actorId: "admin-1" });
    mocks.fetchTransaction.mockReset()
      .mockResolvedValueOnce(refund)
      .mockResolvedValueOnce(charge);
    mocks.mapReceipt.mockReset().mockReturnValue({ transactionId: "refund-1" });
    mocks.inspectRefund.mockReset().mockResolvedValue({
      classification: "exact_match",
      provider: "stripe",
      sourcePaymentId: "pi_1",
      safeToMutate: false,
      message: "Точное совпадение",
      requiredNextStep: "Нужен recovery lease",
      candidates: [{ providerRefundId: "re_1" }],
    });
    mocks.fetchPaymentDetails.mockReset();
    mocks.fetchPaymentIntent.mockReset();
    mocks.fetchCharge.mockReset();
  });

  it("loads the source charge and performs only refund reconciliation for a refund row", async () => {
    const response = await GET(request, context);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(mocks.authorize).toHaveBeenCalledWith(request, "finance.view");
    expect(mocks.fetchTransaction).toHaveBeenNthCalledWith(1, expect.anything(), "refund-1");
    expect(mocks.fetchTransaction).toHaveBeenNthCalledWith(2, expect.anything(), "charge-1");
    expect(mocks.inspectRefund).toHaveBeenCalledWith(refund, charge);
    expect(mocks.fetchPaymentIntent).not.toHaveBeenCalled();
    expect(mocks.fetchCharge).not.toHaveBeenCalled();
    expect(payload).toMatchObject({
      livePayment: null,
      refundReconciliation: { classification: "exact_match", safeToMutate: false },
    });
  });

  it("does not contact storage or providers when finance access is denied", async () => {
    mocks.authorize.mockResolvedValue({
      ok: false,
      response: Response.json({ error: "forbidden" }, { status: 403 }),
    });

    const response = await GET(request, context);

    expect(response.status).toBe(403);
    expect(mocks.fetchTransaction).not.toHaveBeenCalled();
    expect(mocks.inspectRefund).not.toHaveBeenCalled();
  });
});
