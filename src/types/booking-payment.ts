/** Booking payment entities — UI stubs until payment integration. */

export type BookingInvoiceStatus = "pending" | "paid" | "partial" | "cancelled";

export type BookingInvoiceType = "prepayment" | "balance" | "full";

export type BookingPaymentChannel = "platform" | "organizer";

export interface BookingInvoice {
  id: string;
  type: BookingInvoiceType;
  /** Display number, e.g. «141024». */
  number: string;
  createdAt: string;
  amountUsd: number;
  paidAmountUsd: number;
  status: BookingInvoiceStatus;
  paymentChannel?: BookingPaymentChannel;
  /** Override default title in UI. */
  title?: string;
}

export interface BookingPaymentSummary {
  totalAmountUsd: number;
  paidAmountUsd: number;
  remainingAmountUsd: number;
  serviceFeeUsd: number;
}

/** Payment link lifecycle — webhook-ready stub until gateway integration. */
export type BookingPaymentLinkStatus = "active" | "paid" | "expired" | "cancelled";

export type BookingPaymentLinkTarget = "full" | "deposit" | "remaining";

export interface BookingPaymentLink {
  token: string;
  createdAt: string;
  expiresAt?: string;
  sentAt?: string;
  openedAt?: string;
  paidAt?: string;
  status: BookingPaymentLinkStatus;
  target: BookingPaymentLinkTarget;
  amountUsd: number;
}
