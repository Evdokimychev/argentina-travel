import type { OrganizerPrepaymentType } from "@/data/tour-booking-defaults";
import type { CurrencyCode } from "@/types/locale";

export type BookingCheckoutPaymentOption = "full" | "deposit" | "later";

export const BOOKING_CHECKOUT_PAYMENT_LABELS: Record<BookingCheckoutPaymentOption, string> = {
  full: "Полная оплата",
  deposit: "Депозит 10%",
  later: "Оплатить позже",
};

export type BookingPaymentProcedure = "platform_prepay_balance_direct";

/** @deprecated Legacy value — migrated to `pending` on read. */
export type BookingPaymentStatusLegacy = "unpaid";

export type BookingPaymentStatus = "pending" | "partial" | "paid" | "refunded";

export interface BookingOrganizerParams {
  currency: CurrencyCode;
  pricePerGuestUsd: number;
  paymentProcedure: BookingPaymentProcedure;
  prepaymentAmount: number;
  prepaymentType: OrganizerPrepaymentType;
  prepaymentDeadlineDays: number;
  fullPaymentDaysBefore: number;
  accommodationTerms?: string;
}

export interface BookingOrganizerEditForm {
  paymentStatus: BookingPaymentStatus;
  contactName: string;
  guests: number;
  organizerTourId: string;
  tourId: string;
  tourSlug: string;
  tourTitle: string;
  tourImage: string;
  startDate: string;
  endDate: string;
  totalPriceUsd: number;
  organizerParams: BookingOrganizerParams;
}
