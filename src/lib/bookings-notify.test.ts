import { describe, expect, it } from "vitest";
import { resolveStoredPaymentNotification } from "@/lib/bookings-notify";

describe("resolveStoredPaymentNotification", () => {
  it("uses the cumulative booking state after a deposit webhook", () => {
    expect(resolveStoredPaymentNotification({
      paymentStatus: "partial",
      totalPriceUsd: 1000,
      payload: {
        paymentStatus: "partial",
        paymentSummary: { paidAmountUsd: 300 },
      },
    })).toEqual({ paymentStatus: "partial", amountUsd: 300 });
  });

  it("falls back to the booking total for a fully paid booking", () => {
    expect(resolveStoredPaymentNotification({
      paymentStatus: "paid",
      totalPriceUsd: 800,
      payload: {},
    })).toEqual({ paymentStatus: "paid", amountUsd: 800 });
  });

  it("does not emit a payment receipt for pending state", () => {
    expect(resolveStoredPaymentNotification({
      paymentStatus: "pending",
      totalPriceUsd: 800,
      payload: {},
    })).toBeNull();
  });
});
