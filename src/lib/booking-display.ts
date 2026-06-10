import { formatDateRange } from "@/lib/utils";
import type { Booking } from "@/types/tourist";
import {
  BOOKING_CHECKOUT_PAYMENT_LABELS,
  type BookingCheckoutPaymentOption,
} from "@/types/booking-params";

/** Stable 6-digit display number for organizer UI (e.g. «Заявка №919937»). */
export function formatBookingDisplayNumber(bookingId: string): string {
  const digits = bookingId.replace(/\D/g, "");
  if (digits.length >= 4) {
    return digits.slice(-6).padStart(6, "0");
  }

  let hash = 0;
  for (let i = 0; i < bookingId.length; i += 1) {
    hash = (hash * 33 + bookingId.charCodeAt(i)) >>> 0;
  }

  return String((hash % 900000) + 100000);
}

export function canOrganizerSeeContactDetails(status: string): boolean {
  return status !== "new" && status !== "cancelled";
}

export function formatBookingCheckoutPaymentOption(
  option: BookingCheckoutPaymentOption | undefined
): string {
  if (!option) return "Не указано";
  return BOOKING_CHECKOUT_PAYMENT_LABELS[option];
}

export function formatBookingTourDates(
  booking: Pick<Booking, "startDate" | "endDate">,
  emptyLabel = "Не указаны"
): string {
  if (!booking.startDate) return emptyLabel;
  return formatDateRange(booking.startDate, booking.endDate);
}
