import type { Booking } from "@/types/tourist";
import type { BookingInvoice, BookingPaymentSummary } from "@/types/booking-payment";
import { formatBookingDisplayNumber } from "@/lib/booking-display";
import { resolveBookingPaymentStatus, resolveOrganizerParams, computePrepaymentAmount } from "@/lib/booking-params";

/** Default prepayment share until tour-specific settings are wired. */
export const BOOKING_PREPAYMENT_RATIO = 0.2;

/** Platform service fee share (display-only stub). */
export const BOOKING_SERVICE_FEE_RATIO = 0.15;

export function computeDefaultPrepaymentAmount(totalUsd: number): number {
  return Math.round(totalUsd * BOOKING_PREPAYMENT_RATIO);
}

export function computeDefaultServiceFee(totalUsd: number): number {
  return Math.round(totalUsd * BOOKING_SERVICE_FEE_RATIO);
}

export function resolveBookingPaymentSummary(booking: Booking): BookingPaymentSummary {
  if (booking.paymentSummary) {
    return booking.paymentSummary;
  }

  const totalAmountUsd = booking.totalPriceUsd;
  const paymentStatus = resolveBookingPaymentStatus(booking);
  let paidAmountUsd = 0;

  if (paymentStatus === "paid") {
    paidAmountUsd = totalAmountUsd;
  } else if (paymentStatus === "partial") {
    paidAmountUsd = computeDefaultPrepaymentAmount(totalAmountUsd);
  }

  return {
    totalAmountUsd,
    paidAmountUsd,
    remainingAmountUsd: Math.max(0, totalAmountUsd - paidAmountUsd),
    serviceFeeUsd: computeDefaultServiceFee(totalAmountUsd),
  };
}

export function resolveBookingInvoices(booking: Booking): BookingInvoice[] {
  if (booking.invoices?.length) {
    return booking.invoices;
  }

  const params = resolveOrganizerParams(booking);
  const prepaymentAmount = computePrepaymentAmount(booking.totalPriceUsd, params);
  const invoiceNumber = formatBookingDisplayNumber(booking.id);
  const paidAmountUsd = booking.paymentSummary?.paidAmountUsd ?? 0;

  return [
    {
      id: `inv-prepay-${booking.id}`,
      type: "prepayment",
      number: invoiceNumber,
      createdAt: booking.createdAt,
      amountUsd: prepaymentAmount,
      paidAmountUsd: Math.min(paidAmountUsd, prepaymentAmount),
      status:
        paidAmountUsd >= prepaymentAmount ? "paid" : paidAmountUsd > 0 ? "partial" : "pending",
      paymentChannel: "platform",
    },
  ];
}

export function getBookingInvoiceTitle(invoice: BookingInvoice): string {
  if (invoice.title) return invoice.title;

  if (invoice.type === "prepayment") {
    return invoice.paymentChannel === "platform"
      ? "Счет на предоплату • Оплата через Клуб Гидов"
      : "Счет на предоплату";
  }

  if (invoice.type === "balance") {
    return "Счет на остаток";
  }

  return "Счет";
}

export function shouldShowBookingInvoices(status: string): boolean {
  return status !== "new" && status !== "cancelled";
}
