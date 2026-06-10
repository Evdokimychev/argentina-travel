import type { Booking } from "@/types/tourist";
import type { BookingPaymentLink, BookingPaymentLinkTarget } from "@/types/booking-payment";
import {
  computePrepaymentAmount,
  resolveOrganizerParams,
  resolveBookingPaymentStatus,
} from "@/lib/booking-params";
import {
  resolveCheckoutDepositAmountUsd,
  resolveTourCheckoutPaymentOptions,
  resolveTourCheckoutPaymentOptionsFromTour,
} from "@/lib/tour-checkout-payment";
import { getCanonicalTourBySlug } from "@/lib/tour-repository";

const PAYMENT_LINK_TTL_DAYS = 14;

export function buildBookingPaymentLinkPath(token: string): string {
  return `/booking/pay/${token}`;
}

export function buildBookingPaymentLinkUrl(token: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${buildBookingPaymentLinkPath(token)}`;
}

export function resolvePaymentLinkTarget(
  booking: Booking,
  target?: BookingPaymentLinkTarget
): BookingPaymentLinkTarget {
  if (target) return target;

  if (booking.checkoutPaymentOption === "deposit") return "deposit";
  if (booking.checkoutPaymentOption === "full") return "full";

  const status = resolveBookingPaymentStatus(booking);
  if (status === "partial") return "remaining";
  return "full";
}

export function resolvePaymentLinkAmountUsd(
  booking: Booking,
  target: BookingPaymentLinkTarget
): number {
  const total = booking.totalPriceUsd;
  const params = resolveOrganizerParams(booking);
  const paid = booking.paymentSummary?.paidAmountUsd ?? 0;
  const tour = getCanonicalTourBySlug(booking.tourSlug);
  const checkoutOptions = tour
    ? resolveTourCheckoutPaymentOptionsFromTour(tour)
    : resolveTourCheckoutPaymentOptions();

  if (target === "deposit") {
    if (booking.checkoutPaymentOption === "deposit") {
      return resolveCheckoutDepositAmountUsd(total, checkoutOptions);
    }
    return computePrepaymentAmount(total, params);
  }

  if (target === "remaining") {
    return Math.max(0, total - paid);
  }

  return total;
}

export function createBookingPaymentLinkRecord(input: {
  token: string;
  booking: Booking;
  target?: BookingPaymentLinkTarget;
  now?: string;
}): BookingPaymentLink {
  const now = input.now ?? new Date().toISOString();
  const target = resolvePaymentLinkTarget(input.booking, input.target);
  const amountUsd = resolvePaymentLinkAmountUsd(input.booking, target);
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + PAYMENT_LINK_TTL_DAYS);

  return {
    token: input.token,
    createdAt: now,
    expiresAt: expiresAt.toISOString(),
    status: "active",
    target,
    amountUsd,
  };
}

export function isBookingPaymentLinkExpired(link: BookingPaymentLink, now = Date.now()): boolean {
  if (link.status === "expired") return true;
  if (!link.expiresAt) return false;
  return new Date(link.expiresAt).getTime() < now;
}

export function formatBookingPaymentLinkStatus(link: BookingPaymentLink): string {
  if (link.status === "paid") return "Оплачено по ссылке";
  if (link.status === "cancelled") return "Ссылка отменена";
  if (isBookingPaymentLinkExpired(link)) return "Ссылка истекла";
  if (link.openedAt) return "Ссылка открыта";
  if (link.sentAt) return "Ссылка отправлена";
  return "Ссылка активна";
}

export function shouldShowOrganizerPaymentLink(booking: Booking): boolean {
  if (booking.checkoutPaymentOption === "later") return true;
  const status = resolveBookingPaymentStatus(booking);
  return status !== "paid";
}
