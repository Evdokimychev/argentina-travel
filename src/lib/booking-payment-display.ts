import { buildBookingPaymentLinkPath } from "@/lib/booking-payment-link";
import { resolveBookingPaymentSummary } from "@/lib/booking-payment";
import {
  resolveBookingPaymentStatus,
} from "@/lib/booking-params";
import type { BookingPaymentStatus } from "@/types/booking-params";
import { buildTravelersFormUrl, needsBookingTravelersForm } from "@/lib/booking-travelers";
import { isBookingPaymentLinkExpired } from "@/lib/booking-payment-link";
import type { Booking } from "@/types/tourist";

export interface BookingNextStep {
  id: string;
  title: string;
  description: string;
  href?: string;
  tone: "info" | "action" | "warning";
}

export function resolveBookingAmounts(booking: Booking) {
  const summary = resolveBookingPaymentSummary(booking);
  return {
    total: summary.totalAmountUsd,
    paid: booking.amountPaid ?? summary.paidAmountUsd,
    due: booking.amountDue ?? summary.remainingAmountUsd,
  };
}

export function resolveTouristPaymentLinkHref(booking: Booking): string | undefined {
  const token = booking.paymentLinkToken ?? booking.paymentLink?.token;
  if (!token) return undefined;

  const link = booking.paymentLink;
  if (!link) return buildBookingPaymentLinkPath(token);
  if (link.status === "paid" || link.status === "cancelled") return undefined;
  if (isBookingPaymentLinkExpired(link)) return undefined;

  return buildBookingPaymentLinkPath(token);
}

export function getBookingNextSteps(booking: Booking): BookingNextStep[] {
  const steps: BookingNextStep[] = [];
  const paymentStatus = resolveBookingPaymentStatus(booking);

  if (booking.status === "new" || booking.status === "pending") {
    steps.push({
      id: "organizer-review",
      title: "Ожидайте подтверждения",
      description:
        "Организатор проверит заявку и свяжется с вами по email для уточнения деталей.",
      tone: "info",
    });
  }

  if (needsBookingTravelersForm(booking)) {
    const href = booking.travelersFormToken
      ? buildTravelersFormUrl(booking.travelersFormToken)
      : undefined;
    steps.push({
      id: "travelers",
      title: "Заполните данные участников",
      description: "Укажите ФИО и даты рождения всех туристов для оформления поездки.",
      href,
      tone: "action",
    });
  }

  if (paymentStatus === "pending" || paymentStatus === "partial") {
    const payHref = resolveTouristPaymentLinkHref(booking);
    steps.push({
      id: "payment",
      title: "Оплата",
      description:
        payHref
          ? "Онлайн-оплата через платформу скоро. Пока откройте ссылку, чтобы увидеть сумму и подтвердить намерение оплатить."
          : "После подтверждения заявки организатор пришлёт ссылку на оплату предоплаты или полной суммы.",
      href: payHref,
      tone: payHref ? "action" : "info",
    });
  }

  if (booking.status === "confirmed") {
    steps.push({
      id: "trip-prep",
      title: "Подготовка к поездке",
      description: "Следите за комментариями организатора и уточняйте детали встречи.",
      tone: "info",
    });
  }

  return steps;
}

export function canTouristAccessBooking(
  booking: Booking,
  userId: string,
  userEmail?: string
): boolean {
  if (booking.userId === userId) return true;
  if (userEmail && booking.contactEmail.trim().toLowerCase() === userEmail.trim().toLowerCase()) {
    return true;
  }
  return false;
}

export function paymentStatusNeedsAction(status: BookingPaymentStatus): boolean {
  return status === "pending" || status === "partial";
}
