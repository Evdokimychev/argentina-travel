import type { Booking } from "@/types/tourist";

export function guestUserIdFromEmail(email: string): string {
  return `guest-${email.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

export function isGuestUserId(userId: string): boolean {
  return userId.startsWith("guest-");
}

export function normalizeContactEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function bookingMatchesContactEmail(booking: Booking, email: string): boolean {
  return normalizeContactEmail(booking.contactEmail) === normalizeContactEmail(email);
}
