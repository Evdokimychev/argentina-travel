import type { Booking } from "@/types/tourist";

/** Production provider: demo bookings never enter the production module graph. */
export function getDemoBookingSeeds(_now: string): Booking[] {
  return [];
}
