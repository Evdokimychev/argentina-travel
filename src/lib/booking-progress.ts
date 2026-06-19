import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import type { Booking } from "@/types/tourist";

export type BookingProgressStepId = "application" | "confirmation" | "payment" | "completed";

export type BookingProgressStepState = "done" | "current" | "upcoming";

export interface BookingProgressStep {
  id: BookingProgressStepId;
  label: string;
  state: BookingProgressStepState;
}

const PROGRESS_STEP_DEFS: Array<{ id: BookingProgressStepId; label: string }> = [
  { id: "application", label: "Заявка" },
  { id: "confirmation", label: "Подтверждение" },
  { id: "payment", label: "Оплата" },
  { id: "completed", label: "Завершено" },
];

function resolveCurrentStepIndex(booking: Booking): number {
  const paymentStatus = resolveBookingPaymentStatus(booking);

  if (booking.status === "completed") {
    return PROGRESS_STEP_DEFS.length;
  }

  if (booking.status === "new" || booking.status === "pending") {
    return 1;
  }

  if (booking.status === "confirmed") {
    if (paymentStatus === "paid") {
      return 3;
    }
    if (paymentStatus === "pending" || paymentStatus === "partial") {
      return 2;
    }
    return 3;
  }

  return 0;
}

export function resolveBookingProgressSteps(booking: Booking): {
  steps: BookingProgressStep[];
  cancelled: boolean;
} {
  const cancelled = booking.status === "cancelled";
  const currentIndex = cancelled ? -1 : resolveCurrentStepIndex(booking);

  const steps = PROGRESS_STEP_DEFS.map((step, index) => {
    let state: BookingProgressStepState = "upcoming";

    if (cancelled) {
      state = index === 0 ? "done" : "upcoming";
    } else if (index < currentIndex) {
      state = "done";
    } else if (index === currentIndex) {
      state = "current";
    }

    return { ...step, state };
  });

  return { steps, cancelled };
}
