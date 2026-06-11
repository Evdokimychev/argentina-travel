import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import type { Booking, BookingStatus, BookingStatusActor } from "@/types/tourist";

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? `Request failed (${response.status})`);
  }
  return body;
}

export async function apiCreateBooking(booking: Booking): Promise<Booking> {
  const data = await parseJson<{ booking: Booking }>(
    await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking }),
    })
  );
  return data.booking;
}

export async function apiFetchUserBookings(): Promise<Booking[]> {
  const data = await parseJson<{ bookings: Booking[] }>(await fetch("/api/bookings"));
  return data.bookings;
}

export async function apiFetchBookingById(bookingId: string): Promise<Booking | null> {
  const response = await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`);
  if (response.status === 404) return null;
  const data = await parseJson<{ booking: Booking }>(response);
  return data.booking;
}

export async function apiFetchOrganizerBookings(): Promise<Booking[]> {
  const data = await parseJson<{ bookings: Booking[] }>(
    await fetch("/api/organizer/bookings")
  );
  return data.bookings;
}

export async function apiAttachGuestBookings(): Promise<number> {
  const data = await parseJson<{ attached: number }>(
    await fetch("/api/bookings/attach-guest", { method: "POST" })
  );
  return data.attached;
}

export async function apiUpdateBookingStatus(input: {
  bookingId: string;
  status: BookingStatus;
  changedBy?: BookingStatusActor;
  note?: string;
}): Promise<Booking> {
  const data = await parseJson<{ booking: Booking }>(
    await fetch(`/api/bookings/${encodeURIComponent(input.bookingId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update_status",
        status: input.status,
        changedBy: input.changedBy,
        note: input.note,
      }),
    })
  );
  return data.booking;
}

export async function apiCancelBooking(bookingId: string): Promise<Booking> {
  const data = await parseJson<{ booking: Booking }>(
    await fetch(`/api/bookings/${encodeURIComponent(bookingId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel" }),
    })
  );
  return data.booking;
}

export async function apiAddOrganizerComment(input: {
  bookingId: string;
  text: string;
  authorName: string;
}): Promise<Booking> {
  const data = await parseJson<{ booking: Booking }>(
    await fetch(`/api/bookings/${encodeURIComponent(input.bookingId)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "add_comment",
        comment: { text: input.text, authorName: input.authorName },
      }),
    })
  );
  return data.booking;
}

export async function apiPatchBooking(booking: Booking): Promise<Booking> {
  const data = await parseJson<{ booking: Booking }>(
    await fetch(`/api/bookings/${encodeURIComponent(booking.id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ booking }),
    })
  );
  return data.booking;
}

export function isRemoteBookingsMode(): boolean {
  return isSupabaseBookingsEnabled();
}
