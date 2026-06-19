export type BookingCheckoutStepId = "dates" | "contacts" | "payment" | "result";

export const BOOKING_CHECKOUT_STEPS: ReadonlyArray<{
  id: BookingCheckoutStepId;
  label: string;
  shortLabel: string;
}> = [
  { id: "dates", label: "Даты и туристы", shortLabel: "Даты" },
  { id: "contacts", label: "Контакты", shortLabel: "Контакты" },
  { id: "payment", label: "Оплата", shortLabel: "Оплата" },
  { id: "result", label: "Итог", shortLabel: "Итог" },
] as const;

export function resolveBookingCheckoutStepIndex(step: BookingCheckoutStepId): number {
  return BOOKING_CHECKOUT_STEPS.findIndex((item) => item.id === step);
}

/** 0–100 progress for the macro checkout journey. */
export function resolveBookingCheckoutProgress(step: BookingCheckoutStepId): number {
  const index = resolveBookingCheckoutStepIndex(step);
  if (index < 0) return 0;
  return Math.round(((index + 1) / BOOKING_CHECKOUT_STEPS.length) * 100);
}

export function isBookingCheckoutStepComplete(
  step: BookingCheckoutStepId,
  currentStep: BookingCheckoutStepId
): boolean {
  return resolveBookingCheckoutStepIndex(step) < resolveBookingCheckoutStepIndex(currentStep);
}
