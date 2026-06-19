import { format, isValid, parseISO } from "date-fns";
import type { CheckoutFormState, TravelerForm } from "@/components/tour-detail/checkout/types";
import type { Booking, BookingTraveler } from "@/types/tourist";

export function createEmptyBookingTraveler(id?: string): BookingTraveler {
  return {
    id: id ?? `guest-${Date.now().toString(36)}`,
    fullName: "",
    dateOfBirth: "",
    passportNumber: "",
    dietaryRestrictions: "",
    email: "",
    phone: "",
  };
}

export function mapCheckoutTravelersToBooking(travelers: TravelerForm[]): BookingTraveler[] {
  return travelers.map((traveler, index) => ({
    id: `guest-${index + 1}`,
    fullName: [traveler.firstName.trim(), traveler.lastName.trim()].filter(Boolean).join(" "),
    dateOfBirth: traveler.dateOfBirth ? format(traveler.dateOfBirth, "yyyy-MM-dd") : "",
  }));
}

export function isBookingTravelerComplete(traveler: BookingTraveler): boolean {
  return Boolean(traveler.fullName.trim() && traveler.dateOfBirth.trim());
}

export function hasCompleteBookingTravelers(booking: Pick<Booking, "guests" | "travelers" | "travelersCompletedAt">): boolean {
  if (!booking.travelersCompletedAt) return false;
  if (!booking.travelers?.length) return false;
  if (booking.travelers.length < booking.guests) return false;
  return booking.travelers.slice(0, booking.guests).every(isBookingTravelerComplete);
}

export function needsBookingTravelersForm(
  booking: Pick<Booking, "guests" | "fillTravelersLater" | "travelers" | "travelersCompletedAt">
): boolean {
  return !hasCompleteBookingTravelers(booking);
}

export function buildTravelersFormPath(token: string): string {
  return `/booking/travelers/${token}`;
}

export function buildTravelersFormUrl(token: string, origin?: string): string {
  const base = origin ?? (typeof window !== "undefined" ? window.location.origin : "");
  return `${base}${buildTravelersFormPath(token)}`;
}

export function travelersFromCheckoutForm(form: CheckoutFormState): BookingTraveler[] | undefined {
  if (form.fillTravelersLater) return undefined;
  const mapped = mapCheckoutTravelersToBooking(form.travelers).filter(isBookingTravelerComplete);
  return mapped.length > 0 ? mapped : undefined;
}

export function ensureTravelersSlotCount(travelers: BookingTraveler[], guests: number): BookingTraveler[] {
  const next = [...travelers];
  while (next.length < guests) {
    next.push(createEmptyBookingTraveler(`guest-${next.length + 1}`));
  }
  return next.slice(0, guests);
}

export function getTravelersSummaryText(
  booking: Pick<Booking, "guests" | "travelers" | "travelersCompletedAt" | "fillTravelersLater">
): string {
  if (hasCompleteBookingTravelers(booking) && booking.travelers?.length) {
    return booking.travelers
      .slice(0, booking.guests)
      .map((traveler) => traveler.fullName)
      .join(", ");
  }
  if (needsBookingTravelersForm(booking)) {
    return "Данные о туристах ещё не заполнены";
  }
  return `${booking.guests} ${booking.guests === 1 ? "участник" : "участника"}`;
}

export function parseBookingTravelerDate(value: string): Date | null {
  if (!value.trim()) return null;
  const parsed = parseISO(value);
  return isValid(parsed) ? parsed : null;
}

export function formatBookingTravelerDate(date: Date | null): string {
  if (!date) return "";
  return format(date, "yyyy-MM-dd");
}
