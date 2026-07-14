import type { BookingStatus, BookingStatusActor } from "@/types/tourist";

export const BOOKING_STATUS_TRANSITIONS: Readonly<Record<BookingStatus, readonly BookingStatus[]>> = {
  new: ["pending", "confirmed", "cancelled"],
  pending: ["confirmed", "cancelled"],
  confirmed: ["waiting_payment", "completed", "cancelled"],
  waiting_payment: ["paid", "cancelled"],
  paid: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const ACTOR_TARGETS: Readonly<Record<BookingStatusActor, readonly BookingStatus[]>> = {
  tourist: ["cancelled"],
  organizer: ["pending", "confirmed", "waiting_payment", "completed", "cancelled"],
  system: ["pending", "confirmed", "waiting_payment", "paid", "completed", "cancelled"],
};

export function canTransitionBookingStatus(input: {
  from: BookingStatus;
  to: BookingStatus;
  actor: BookingStatusActor;
}): boolean {
  if (input.from === input.to) return true;
  return (
    BOOKING_STATUS_TRANSITIONS[input.from].includes(input.to) &&
    ACTOR_TARGETS[input.actor].includes(input.to)
  );
}

export function assertBookingStatusTransition(input: {
  from: BookingStatus;
  to: BookingStatus;
  actor: BookingStatusActor;
}): { ok: true } | { error: string } {
  if (canTransitionBookingStatus(input)) return { ok: true };
  return { error: `Переход из статуса «${input.from}» в «${input.to}» недоступен.` };
}
