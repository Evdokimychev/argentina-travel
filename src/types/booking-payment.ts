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
