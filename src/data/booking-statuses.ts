import type { BookingStatus, BookingStatusActive, BookingStatusActor } from "@/types/tourist";
import { BOOKING_STATUS_TRANSITIONS } from "@/lib/booking-state-machine";

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

export const BOOKING_STATUSES_ADMIN: BookingStatus[] = [
  ...BOOKING_STATUSES_ACTIVE,
  ...BOOKING_STATUSES_FUTURE,
];

export function getAdminBookingStatusTransitions(
  status: BookingStatus,
  paymentStatus?: string | null
): BookingStatus[] {
  if (status === "new") return ["pending", "confirmed", "cancelled"];
  if (status === "pending") return ["confirmed", "cancelled"];
  if (status === "confirmed") return ["waiting_payment", "completed", "cancelled"];
  if (status === "waiting_payment") {
    return paymentStatus === "paid" ? ["completed", "cancelled"] : ["cancelled"];
  }
  if (status === "paid") return ["completed", "cancelled"];
  return [];
}

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  new: "Новая заявка",
  pending: "В обработке",
  confirmed: "Подтверждена",
  waiting_payment: "Ожидает оплаты",
  paid: "Оплачена",
  cancelled: "Отменена",
  completed: "Завершена",
};

export const BOOKING_STATUS_TONE: Record<BookingStatus, string> = {
  new: "bg-sky/10 text-sky ring-sky/20",
  pending: "bg-warning-muted text-warning ring-warning/30",
  confirmed: "bg-success-muted text-success ring-success/30",
  waiting_payment: "bg-amber-50 text-amber-800 ring-amber-200",
  paid: "bg-emerald-50 text-emerald-800 ring-emerald-200",
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
  new: [...BOOKING_STATUS_TRANSITIONS.new].filter(isActiveBookingStatus),
  pending: [...BOOKING_STATUS_TRANSITIONS.pending].filter(isActiveBookingStatus),
  confirmed: [...BOOKING_STATUS_TRANSITIONS.confirmed].filter(isActiveBookingStatus),
  cancelled: [],
  completed: [],
};

export function isActiveBookingStatus(status: BookingStatus): status is BookingStatusActive {
  return BOOKING_STATUSES_ACTIVE.includes(status as BookingStatusActive);
}

export function getVisibleBookingStatusLabel(status: BookingStatus): string {
  return BOOKING_STATUS_LABELS[status];
}
