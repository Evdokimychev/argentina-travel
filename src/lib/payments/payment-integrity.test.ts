import { describe, expect, it } from "vitest";
import {
  buildPaymentCheckoutIdempotencyKey,
  canIssuePaymentLinkForBookingStatus,
  canStartPaymentForBookingStatus,
  reconcileBookingPayment,
} from "./payment-integrity";

describe("payment checkout integrity", () => {
  const input = {
    provider: "stripe" as const,
    bookingId: "booking-1",
    paymentLinkToken: "secret-token",
    amountUsd: 100,
    currency: "USD",
  };

  it("reuses one provider idempotency key for the same payment link", () => {
    expect(buildPaymentCheckoutIdempotencyKey(input)).toBe(
      buildPaymentCheckoutIdempotencyKey(input),
    );
  });

  it("does not reuse a key for another amount, link or provider", () => {
    const key = buildPaymentCheckoutIdempotencyKey(input);
    expect(buildPaymentCheckoutIdempotencyKey({ ...input, amountUsd: 99 })).not.toBe(key);
    expect(buildPaymentCheckoutIdempotencyKey({ ...input, paymentLinkToken: "other" })).not.toBe(key);
    expect(buildPaymentCheckoutIdempotencyKey({ ...input, provider: "mercadopago" })).not.toBe(key);
  });
});

describe("booking payment reconciliation", () => {
  it("blocks checkout for cancelled and completed bookings", () => {
    expect(canStartPaymentForBookingStatus("cancelled")).toBe(false);
    expect(canStartPaymentForBookingStatus("completed")).toBe(false);
    expect(canStartPaymentForBookingStatus("confirmed")).toBe(true);
  });

  it("allows an organizer payment link only after confirmation", () => {
    expect(canIssuePaymentLinkForBookingStatus("new")).toBe(false);
    expect(canIssuePaymentLinkForBookingStatus("pending")).toBe(false);
    expect(canIssuePaymentLinkForBookingStatus("confirmed")).toBe(true);
    expect(canIssuePaymentLinkForBookingStatus("waiting_payment")).toBe(true);
  });

  it("treats a captured deposit as partial, never as a fully paid booking", () => {
    expect(
      reconcileBookingPayment({
        currentStatus: "pending",
        currentPaidUsd: 0,
        totalAmountUsd: 100,
        serverChargeAmountUsd: 30,
        incomingStatus: "paid",
        paymentLinkAlreadyPaid: false,
      }),
    ).toEqual({ paymentStatus: "partial", paidAmountUsd: 30, duplicate: false });
  });

  it("marks the booking paid only when cumulative captured funds reach the server total", () => {
    expect(
      reconcileBookingPayment({
        currentStatus: "partial",
        currentPaidUsd: 30,
        totalAmountUsd: 100,
        serverChargeAmountUsd: 70,
        incomingStatus: "paid",
        paymentLinkAlreadyPaid: false,
      }),
    ).toEqual({ paymentStatus: "paid", paidAmountUsd: 100, duplicate: false });
  });

  it("does not count a replayed captured webhook twice", () => {
    expect(
      reconcileBookingPayment({
        currentStatus: "partial",
        currentPaidUsd: 30,
        totalAmountUsd: 100,
        serverChargeAmountUsd: 30,
        incomingStatus: "paid",
        paymentLinkAlreadyPaid: true,
      }),
    ).toEqual({ paymentStatus: "partial", paidAmountUsd: 30, duplicate: true });
  });

  it("keeps pending authorizations from changing paid totals", () => {
    expect(
      reconcileBookingPayment({
        currentStatus: "pending",
        currentPaidUsd: 0,
        totalAmountUsd: 100,
        serverChargeAmountUsd: 100,
        incomingStatus: "pending",
        paymentLinkAlreadyPaid: false,
      }),
    ).toEqual({ paymentStatus: "pending", paidAmountUsd: 0, duplicate: false });
  });

  it("does not guess the amount of an ambiguous provider partial status", () => {
    expect(
      reconcileBookingPayment({
        currentStatus: "pending",
        currentPaidUsd: 0,
        totalAmountUsd: 100,
        serverChargeAmountUsd: 100,
        incomingStatus: "partial",
        paymentLinkAlreadyPaid: false,
      }),
    ).toEqual({ paymentStatus: "pending", paidAmountUsd: 0, duplicate: false });
  });
});
