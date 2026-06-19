import type { OrganizerPrepaymentType } from "@/data/tour-booking-defaults";
import {
  BOOKING_PREPAYMENT_RATIO,
  computeDefaultPrepaymentAmount,
  computeDefaultServiceFee,
} from "@/lib/booking-payment";
import type { Booking } from "@/types/tourist";
import type {
  BookingOrganizerEditForm,
  BookingOrganizerParams,
  BookingPaymentProcedure,
  BookingPaymentStatus,
} from "@/types/booking-params";
import type { CurrencyCode } from "@/types/locale";
import { hasCompleteBookingTravelers } from "@/lib/booking-travelers";

export const BOOKING_PAYMENT_STATUS_LABELS: Record<BookingPaymentStatus, string> = {
  pending: "Ожидает оплаты",
  partial: "Частичная оплата",
  paid: "Оплачено полностью",
  refunded: "Возврат оформлен",
};

/** Maps legacy `unpaid` and resolves status from booking fields. */
export function normalizeBookingPaymentStatus(
  status: BookingPaymentStatus | "unpaid" | undefined
): BookingPaymentStatus {
  if (!status || status === "unpaid") return "pending";
  return status;
}

export const BOOKING_PAYMENT_PROCEDURE_LABELS: Record<BookingPaymentProcedure, string> = {
  platform_prepay_balance_direct:
    "Предоплата через Клуб Гидов и остаток напрямую от туриста",
};

export const DEFAULT_BOOKING_ORGANIZER_PARAMS: BookingOrganizerParams = {
  currency: "USD",
  pricePerGuestUsd: 0,
  paymentProcedure: "platform_prepay_balance_direct",
  prepaymentAmount: 20,
  prepaymentType: "percent",
  prepaymentDeadlineDays: 5,
  fullPaymentDaysBefore: 0,
  accommodationTerms: "",
};

export function resolveOrganizerParams(booking: Booking): BookingOrganizerParams {
  const stored = booking.organizerParams;
  const pricePerGuestUsd =
    stored?.pricePerGuestUsd ??
    (booking.guests > 0 ? Math.round(booking.totalPriceUsd / booking.guests) : booking.totalPriceUsd);

  return {
    ...DEFAULT_BOOKING_ORGANIZER_PARAMS,
    ...stored,
    pricePerGuestUsd,
    currency: stored?.currency ?? "USD",
  };
}

export function resolveBookingPaymentStatus(booking: Booking): BookingPaymentStatus {
  if (booking.paymentStatus) {
    return normalizeBookingPaymentStatus(booking.paymentStatus);
  }

  const paid = booking.paymentSummary?.paidAmountUsd ?? 0;
  const total = booking.totalPriceUsd;

  if (paid <= 0) return "pending";
  if (paid >= total) return "paid";
  return "partial";
}

export function computePrepaymentAmount(
  totalUsd: number,
  params: Pick<BookingOrganizerParams, "prepaymentAmount" | "prepaymentType">
): number {
  if (params.prepaymentType === "percent") {
    return Math.round((totalUsd * params.prepaymentAmount) / 100);
  }
  return Math.max(0, params.prepaymentAmount);
}

export function buildPaymentSummaryFromStatus(
  totalUsd: number,
  paymentStatus: BookingPaymentStatus,
  params: BookingOrganizerParams
) {
  const prepaymentUsd = computePrepaymentAmount(totalUsd, params);
  let paidAmountUsd = 0;

  if (paymentStatus === "paid") {
    paidAmountUsd = totalUsd;
  } else if (paymentStatus === "partial") {
    paidAmountUsd = prepaymentUsd;
  } else if (paymentStatus === "refunded") {
    paidAmountUsd = 0;
  }

  return {
    totalAmountUsd: totalUsd,
    paidAmountUsd,
    remainingAmountUsd: Math.max(0, totalUsd - paidAmountUsd),
    serviceFeeUsd: computeDefaultServiceFee(totalUsd),
  };
}

export function buildBookingEditForm(booking: Booking): BookingOrganizerEditForm {
  const organizerParams = resolveOrganizerParams(booking);

  return {
    paymentStatus: resolveBookingPaymentStatus(booking),
    contactName: booking.contactName,
    guests: booking.guests,
    organizerTourId: booking.organizerTourId ?? "",
    tourId: booking.tourId,
    tourSlug: booking.tourSlug,
    tourTitle: booking.tourTitle,
    tourImage: booking.tourImage,
    startDate: booking.startDate ?? "",
    endDate: booking.endDate ?? "",
    totalPriceUsd: booking.totalPriceUsd,
    organizerParams,
  };
}

export function getTouristStatusLines(booking: Pick<Booking, "guests" | "travelers">): string[] {
  const travelers = booking.travelers ?? [];
  return Array.from({ length: booking.guests }, (_, index) => {
    const traveler = travelers[index];
    if (traveler?.fullName.trim() && traveler.dateOfBirth.trim()) {
      return traveler.fullName.trim();
    }
    return "Данные туриста не заполнены";
  });
}

export function recalculateBookingTotal(
  pricePerGuestUsd: number,
  guests: number
): number {
  return Math.max(0, Math.round(pricePerGuestUsd * guests));
}

export function normalizeOrganizerParams(
  raw: Partial<BookingOrganizerParams> | undefined
): BookingOrganizerParams {
  return {
    currency: (raw?.currency as CurrencyCode) ?? DEFAULT_BOOKING_ORGANIZER_PARAMS.currency,
    pricePerGuestUsd: Math.max(0, raw?.pricePerGuestUsd ?? 0),
    paymentProcedure:
      raw?.paymentProcedure ?? DEFAULT_BOOKING_ORGANIZER_PARAMS.paymentProcedure,
    prepaymentAmount: Math.max(0, raw?.prepaymentAmount ?? DEFAULT_BOOKING_ORGANIZER_PARAMS.prepaymentAmount),
    prepaymentType: (raw?.prepaymentType as OrganizerPrepaymentType) ?? "percent",
    prepaymentDeadlineDays: Math.max(
      0,
      raw?.prepaymentDeadlineDays ?? DEFAULT_BOOKING_ORGANIZER_PARAMS.prepaymentDeadlineDays
    ),
    fullPaymentDaysBefore: Math.max(
      0,
      raw?.fullPaymentDaysBefore ?? DEFAULT_BOOKING_ORGANIZER_PARAMS.fullPaymentDaysBefore
    ),
    accommodationTerms: raw?.accommodationTerms?.trim() || undefined,
  };
}

export function shouldMarkTravelersIncomplete(
  booking: Booking,
  nextGuests: number
): boolean {
  if (nextGuests !== booking.guests) return true;
  return !hasCompleteBookingTravelers(booking);
}

export function defaultPrepaymentPercent(): number {
  return Math.round(BOOKING_PREPAYMENT_RATIO * 100);
}

export function defaultPrepaymentAmount(totalUsd: number): number {
  return computeDefaultPrepaymentAmount(totalUsd);
}
