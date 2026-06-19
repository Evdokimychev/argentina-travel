import { buildBookingPaymentLinkPath } from "@/lib/booking-payment-link";
import { buildTravelersFormUrl } from "@/lib/booking-travelers";
import { formatBookingDisplayNumber } from "@/lib/booking-display";
import { addNotification } from "@/lib/notifications/store";
import type { Booking } from "@/types/tourist";

function bookingDisplayNumber(booking: Booking): string {
  return formatBookingDisplayNumber(booking.id);
}

export function notifyBookingCreated(booking: Booking): void {
  addNotification({
    userId: booking.userId,
    contactEmail: booking.contactEmail,
    category: "booking",
    bookingId: booking.id,
    title: "Заявка принята",
    body: `Заявка №${bookingDisplayNumber(booking)} на «${booking.tourTitle}» отправлена организатору.`,
    href: `/profile/bookings/${booking.id}`,
  });
}

export function notifyPaymentReminder(booking: Booking, paymentLinkToken?: string): void {
  const token = paymentLinkToken ?? booking.paymentLink?.token ?? booking.paymentLinkToken;
  const href = token ? buildBookingPaymentLinkPath(token) : `/profile/bookings/${booking.id}`;

  addNotification({
    userId: booking.userId,
    contactEmail: booking.contactEmail,
    category: "payment",
    bookingId: booking.id,
    title: "Ожидается оплата",
    body: `По заявке №${bookingDisplayNumber(booking)} доступна ссылка на оплату. Онлайн-оплата через платформу скоро — пока свяжитесь с организатором при необходимости.`,
    href,
  });
}

export function notifyTravelersFormDue(booking: Booking): void {
  const href = booking.travelersFormToken
    ? buildTravelersFormUrl(booking.travelersFormToken)
    : `/profile/bookings/${booking.id}`;

  addNotification({
    userId: booking.userId,
    contactEmail: booking.contactEmail,
    category: "travelers",
    bookingId: booking.id,
    title: "Укажите участников",
    body: `Заполните данные туристов для заявки №${bookingDisplayNumber(booking)}.`,
    href,
  });
}

export function notifyPaymentStatusChanged(
  booking: Booking,
  status: "paid" | "partial" | "refunded"
): void {
  const labels: Record<typeof status, string> = {
    paid: "Оплата получена",
    partial: "Частичная оплата зафиксирована",
    refunded: "Возврат оформлен",
  };

  addNotification({
    userId: booking.userId,
    contactEmail: booking.contactEmail,
    category: "payment",
    bookingId: booking.id,
    title: labels[status],
    body: `Статус оплаты по заявке №${bookingDisplayNumber(booking)} обновлён.`,
    href: `/profile/bookings/${booking.id}`,
  });
}

export function notifyPayLaterAcknowledged(booking: Booking): void {
  addNotification({
    userId: booking.userId,
    contactEmail: booking.contactEmail,
    category: "payment",
    bookingId: booking.id,
    title: "Намерение оплатить подтверждено",
    body: `Вы подтвердили готовность оплатить заявку №${bookingDisplayNumber(booking)}. Организатор свяжется с вами для уточнения деталей.`,
    href: `/profile/bookings/${booking.id}`,
  });
}
