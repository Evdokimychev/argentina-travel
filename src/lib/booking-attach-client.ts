import { apiAttachGuestBookings, isRemoteBookingsMode } from "@/lib/bookings-api";
import { BOOKINGS_UPDATED_EVENT } from "@/types/tourist";

/**
 * Production login only needs the authenticated server endpoint. Keeping this
 * adapter separate prevents the full demo booking/tour stores from entering
 * the global authentication bundle.
 */
export function attachGuestBookingsAfterLogin(): void {
  if (!isRemoteBookingsMode()) return;
  void apiAttachGuestBookings().then(() => {
    window.dispatchEvent(new Event(BOOKINGS_UPDATED_EVENT));
  });
}
