import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import type { PaymentTransactionReceiptView } from "@/types/payment-platform";
import type {
  BookingCommissionSnapshotRow,
  PlatformCommissionRuleRow,
} from "@/types/platform-commission";
import type { TripsterBookingRequestView } from "@/types/tripster-booking";
import type { YouTravelBookingRequestView } from "@/types/youtravel-booking";
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

export async function apiCreateBookingPaymentPreference(input: {
  bookingId: string;
  paymentLinkToken: string;
}): Promise<{ preferenceId: string; checkoutUrl: string; checkoutSandboxUrl?: string | null }> {
  return parseJson<{ preferenceId: string; checkoutUrl: string; checkoutSandboxUrl?: string | null }>(
    await fetch(`/api/bookings/${encodeURIComponent(input.bookingId)}/payment/preference`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentLinkToken: input.paymentLinkToken,
      }),
    })
  );
}

export async function apiCreateBookingStripeSession(input: {
  bookingId: string;
  paymentLinkToken: string;
}): Promise<{ sessionId: string; checkoutUrl: string }> {
  return parseJson<{ sessionId: string; checkoutUrl: string }>(
    await fetch(`/api/bookings/${encodeURIComponent(input.bookingId)}/payment/stripe/session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentLinkToken: input.paymentLinkToken,
      }),
    })
  );
}

export type PaymentLinkStatusResponse = {
  bookingId: string;
  tourTitle: string;
  contactName: string;
  paymentStatus: string;
  linkStatus: string;
  amountUsd: number;
  expired: boolean;
  paidAt: string | null;
  receipt: PaymentTransactionReceiptView | null;
};

export async function apiFetchPaymentLinkStatus(token: string): Promise<PaymentLinkStatusResponse> {
  return parseJson<PaymentLinkStatusResponse>(
    await fetch(`/api/bookings/payment-link/${encodeURIComponent(token)}`, { cache: "no-store" })
  );
}

export async function apiFetchBookingPaymentReceipt(bookingId: string): Promise<{
  receipt: PaymentTransactionReceiptView | null;
  paymentStatus: string;
}> {
  return parseJson<{
    receipt: PaymentTransactionReceiptView | null;
    paymentStatus: string;
  }>(await fetch(`/api/bookings/${encodeURIComponent(bookingId)}/payment/receipt`, { cache: "no-store" }));
}

export async function apiFetchPaymentSandboxMode(): Promise<{ enabled: boolean }> {
  return parseJson<{ enabled: boolean }>(
    await fetch("/api/payments/sandbox-mode", { cache: "no-store" })
  );
}

export async function apiSimulateSandboxPayment(input: {
  bookingId: string;
  asPartial?: boolean;
  amountUsd?: number;
}): Promise<{
  booking: Booking;
  paymentStatus: string;
  amountUsd: number;
  externalId: string;
  sandbox: boolean;
}> {
  return parseJson<{
    booking: Booking;
    paymentStatus: string;
    amountUsd: number;
    externalId: string;
    sandbox: boolean;
  }>(
    await fetch(`/api/bookings/${encodeURIComponent(input.bookingId)}/payment/sandbox`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        asPartial: input.asPartial === true,
        amountUsd: input.amountUsd,
      }),
    })
  );
}

export async function apiFetchOrganizerBookingCommission(bookingId: string): Promise<{
  snapshots: BookingCommissionSnapshotRow[];
  rule: PlatformCommissionRuleRow | null;
}> {
  return parseJson(
    await fetch(`/api/organizer/bookings/${encodeURIComponent(bookingId)}/commission`, {
      cache: "no-store",
    })
  );
}

export function isRemoteBookingsMode(): boolean {
  return isSupabaseBookingsEnabled();
}

export async function apiLookupBookingsByEmail(email: string): Promise<Booking[]> {
  const data = await parseJson<{ bookings: Booking[] }>(
    await fetch("/api/bookings/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
  );
  return data.bookings;
}

export async function apiFetchTripsterBookingRequests(): Promise<TripsterBookingRequestView[]> {
  const data = await parseJson<{ requests: TripsterBookingRequestView[] }>(
    await fetch("/api/tripster/booking-request", { cache: "no-store" })
  );
  return data.requests ?? [];
}

export async function apiFetchYouTravelBookingRequests(): Promise<YouTravelBookingRequestView[]> {
  const data = await parseJson<{ requests: YouTravelBookingRequestView[] }>(
    await fetch("/api/youtravel/booking-request", { cache: "no-store" })
  );
  return data.requests ?? [];
}

export async function apiRefreshYouTravelBookingRequest(
  id: string
): Promise<YouTravelBookingRequestView> {
  const data = await parseJson<{ request: YouTravelBookingRequestView }>(
    await fetch(`/api/youtravel/booking-request/${encodeURIComponent(id)}/refresh`, {
      method: "POST",
    })
  );
  return data.request;
}
