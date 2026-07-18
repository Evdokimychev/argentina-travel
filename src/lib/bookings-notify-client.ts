/** Demo/localStorage mode never sends transactional email. */

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

export function notifyBookingCreatedEmail(input: BookingCreatedEmailInput): void {
  void input;
  // Production notifications originate from the canonical booking API.
}

export function notifyPaymentReceivedEmail(input: PaymentReceivedEmailInput): void {
  void input;
  // Production payment notifications originate from verified webhooks.
}
