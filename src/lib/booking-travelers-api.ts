import type { BookingTraveler } from "@/types/tourist";
import type { TravelersFormBookingView } from "@/lib/booking-travelers-server";

async function parseJson<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T & { error?: string };
  if (!response.ok) throw new Error(body.error ?? `Request failed (${response.status})`);
  return body;
}

export async function apiFetchTravelersFormBooking(
  token: string
): Promise<TravelersFormBookingView | null> {
  const response = await fetch(`/api/bookings/travelers/${encodeURIComponent(token)}`, { cache: "no-store" });
  if (response.status === 404) return null;
  const data = await parseJson<{ booking: TravelersFormBookingView }>(response);
  return data.booking;
}

export async function apiSaveTravelersFormBooking(
  token: string,
  travelers: BookingTraveler[]
): Promise<TravelersFormBookingView> {
  const data = await parseJson<{ booking: TravelersFormBookingView }>(
    await fetch(`/api/bookings/travelers/${encodeURIComponent(token)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ travelers }),
    })
  );
  return data.booking;
}
