import type { BookingStatus, BookingStatusActive, BookingStatusActor } from "@/types/tourist";

export const BOOKING_STATUSES_ACTIVE: BookingStatusActive[] = [
  "new",
  "pending",
  "confirmed",
  "cancelled",
  "completed",
];

/** Reserved for payment phase — hidden from Phase D v1 UI. */
export const BOOKING_STATUSES_FUTURE: Array<"waiting_payment" | "paid"> = [
  "waiting_payment",
  "paid",
];

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  new: "Новая заявка",
  pending: "В обработке",
  confirmed: "Подтверждена",
  waiting_payment: "Ожидает оплаты",
  paid: "Оплачена",
  cancelled: "Отменена",
  completed: "Завершена",
};

export const BOOKING_STATUS_TONE: Record<BookingStatusActive, string> = {
  new: "bg-sky/10 text-sky ring-sky/20",
  pending: "bg-warning-muted text-warning ring-warning/30",
  confirmed: "bg-success-muted text-success ring-success/30",
  cancelled: "bg-gray-100 text-slate ring-gray-200/60",
  completed: "bg-sky/10 text-sky ring-sky/20",
};

export const BOOKING_STATUS_ACTOR_LABELS: Record<BookingStatusActor, string> = {
  system: "Система",
  organizer: "Организатор",
  tourist: "Турист",
};

/** Organizer transitions in Phase D v1 (no payment flow). */
export const ORGANIZER_BOOKING_TRANSITIONS: Record<
  BookingStatusActive,
  BookingStatusActive[]
> = {
  new: ["pending", "confirmed", "cancelled"],
  pending: ["confirmed", "cancelled"],
  confirmed: ["completed", "cancelled"],
  cancelled: [],
  completed: [],
};

export function isActiveBookingStatus(status: BookingStatus): status is BookingStatusActive {
  return BOOKING_STATUSES_ACTIVE.includes(status as BookingStatusActive);
}

export function getVisibleBookingStatusLabel(status: BookingStatus): string {
  if (isActiveBookingStatus(status)) {
    return BOOKING_STATUS_LABELS[status];
  }
  return BOOKING_STATUS_LABELS.pending;
}
