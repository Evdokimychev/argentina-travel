import type { BookingPaymentSummary } from "@/types/booking-payment";
import type { BookingPaymentStatus } from "@/types/booking-params";

export type PaymentProviderId = "mercadopago" | "stripe" | "manual";

export interface PaymentWebhookEvent {
  provider: PaymentProviderId;
  eventId: string;
  eventType: string;
  bookingId: string;
  paymentStatus: BookingPaymentStatus;
  amountPaidUsd?: number;
  amountTotalUsd?: number;
  occurredAt: string;
  rawPayload: Record<string, unknown>;
}

export interface PaymentWebhookParseResult {
  verified: boolean;
  event: PaymentWebhookEvent | null;
  error?: string;
}

export interface BookingPaymentWebhookPatch {
  verified: boolean;
  paymentStatus: BookingPaymentStatus;
  paymentSummary: BookingPaymentSummary;
  sourceEventId: string;
  provider: PaymentProviderId;
  occurredAt: string;
}
