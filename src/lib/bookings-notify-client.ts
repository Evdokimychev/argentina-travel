/**
 * Client-safe booking notification triggers (demo / localStorage mode).
 * Delegates to POST /api/bookings/notify — never imports server modules.
 */

type BookingCreatedEmailInput = {
  userId?: string | null;
  bookingId: string;
  tourTitle: string;
  contactEmail: string;
  contactName: string;
  guests?: number;
  startDate?: string | null;
  endDate?: string | null;
};

type PaymentReceivedEmailInput = {
  userId?: string | null;
  bookingId: string;
  tourTitle: string;
  contactEmail: string;
  contactName?: string | null;
  amountUsd?: number | null;
  paymentStatus: "paid" | "partial" | "refunded";
  providerLabel?: string | null;
};

async function postBookingNotify(body: Record<string, unknown>): Promise<void> {
  try {
    await fetch("/api/bookings/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // Non-blocking
  }
}

export function notifyBookingCreatedEmail(input: BookingCreatedEmailInput): void {
  void postBookingNotify({ kind: "booking_created", ...input });
}

export function notifyPaymentReceivedEmail(input: PaymentReceivedEmailInput): void {
  void postBookingNotify({ kind: "payment_received", ...input });
}
