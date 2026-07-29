import { createHash } from "node:crypto";
import type { BookingPaymentStatus } from "@/types/booking-params";
import type { BookingPaymentGateway } from "@/types/booking-payment";
import type { PaymentProviderId } from "@/types/payment-webhook";
import type { BookingStatus } from "@/types/tourist";

export function canStartPaymentForBookingStatus(status: BookingStatus): boolean {
  return status !== "cancelled" && status !== "completed";
}

export function canIssuePaymentLinkForBookingStatus(status: BookingStatus): boolean {
  return status === "confirmed" || status === "waiting_payment";
}

export function isPaymentProviderLocked(
  gateway: BookingPaymentGateway | undefined,
  provider: Exclude<PaymentProviderId, "manual">,
): boolean {
  return gateway !== undefined && gateway !== "manual" && gateway !== provider;
}

export function nextPaymentBookingUpdatedAt(previousUpdatedAt: string, now = Date.now()): string {
  const previous = Date.parse(previousUpdatedAt);
  const next = Number.isFinite(previous) ? Math.max(now, previous + 1) : now;
  return new Date(next).toISOString();
}

export function readPaymentMetadataString(
  metadata: Record<string, unknown>,
  key: string,
): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

export function readPaymentMetadataAmountUsd(
  metadata: Record<string, unknown>,
): number | undefined {
  const raw = metadata.amountUsd ?? metadata.amount_usd;
  const amount = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw) : NaN;
  return Number.isFinite(amount) && amount > 0 ? amount : undefined;
}

export function buildPaymentCheckoutIdempotencyKey(input: {
  provider: Exclude<PaymentProviderId, "manual">;
  bookingId: string;
  paymentLinkToken: string;
  amountUsd: number;
  currency: string;
}): string {
  const digest = createHash("sha256")
    .update(
      [
        input.provider,
        input.bookingId.trim(),
        input.paymentLinkToken.trim(),
        Math.max(0, input.amountUsd).toFixed(2),
        input.currency.trim().toUpperCase(),
      ].join("\u0000"),
    )
    .digest("hex")
    .slice(0, 32);
  return `goarg-${input.provider}-${digest}`;
}

export function reconcileBookingPayment(input: {
  currentStatus: BookingPaymentStatus;
  currentPaidUsd: number;
  totalAmountUsd: number;
  serverChargeAmountUsd: number;
  incomingStatus: BookingPaymentStatus;
  paymentLinkAlreadyPaid: boolean;
}): {
  paymentStatus: BookingPaymentStatus;
  paidAmountUsd: number;
  duplicate: boolean;
} {
  const total = Math.max(0, input.totalAmountUsd);
  const currentPaid = total > 0
    ? Math.min(Math.max(0, input.currentPaidUsd), total)
    : Math.max(0, input.currentPaidUsd);

  if (input.currentStatus === "refunded") {
    return { paymentStatus: "refunded", paidAmountUsd: 0, duplicate: true };
  }
  if (input.incomingStatus === "refunded") {
    return { paymentStatus: "refunded", paidAmountUsd: 0, duplicate: false };
  }
  if (input.incomingStatus === "pending") {
    return {
      paymentStatus: input.currentStatus,
      paidAmountUsd: currentPaid,
      duplicate: false,
    };
  }
  if (input.incomingStatus === "partial") {
    return {
      paymentStatus: input.currentStatus,
      paidAmountUsd: currentPaid,
      duplicate: false,
    };
  }
  if (input.currentStatus === "paid" || input.paymentLinkAlreadyPaid) {
    return {
      paymentStatus: input.currentStatus,
      paidAmountUsd: currentPaid,
      duplicate: true,
    };
  }

  const remaining = total > 0 ? Math.max(0, total - currentPaid) : Number.POSITIVE_INFINITY;
  const captured = Math.min(Math.max(0, input.serverChargeAmountUsd), remaining);
  const paidAmountUsd = currentPaid + captured;
  const paymentStatus: BookingPaymentStatus =
    total > 0 && paidAmountUsd >= total ? "paid" : paidAmountUsd > 0 ? "partial" : input.currentStatus;

  return { paymentStatus, paidAmountUsd, duplicate: false };
}
