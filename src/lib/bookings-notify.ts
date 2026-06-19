/**
 * Transactional email alerts for booking lifecycle (Resend).
 * Non-blocking — skipped when env is missing or preferences disable email.
 */

import {
  sendBookingConfirmedEmail,
  sendBookingStatusChangedEmail,
  sendPaymentReceivedEmail,
} from "@/lib/notifications/email-delivery";
import { notifyBookingStatusInApp } from "@/lib/notifications/event-emitters";
import { sendPushToUser } from "@/lib/notifications/push-server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import type { BookingPaymentWebhookPatch } from "@/types/payment-webhook";
import { BOOKING_STATUS_LABELS } from "@/data/booking-statuses";

export async function notifyBookingCreatedEmail(input: {
  userId?: string | null;
  bookingId: string;
  tourTitle: string;
  contactEmail: string;
  contactName: string;
  guests?: number;
  startDate?: string | null;
  endDate?: string | null;
}): Promise<void> {
  try {
    await sendBookingConfirmedEmail({
      userId: input.userId,
      recipientEmail: input.contactEmail,
      recipientName: input.contactName,
      bookingId: input.bookingId,
      tourTitle: input.tourTitle,
      guests: input.guests,
      startDate: input.startDate,
      endDate: input.endDate,
    });
  } catch {
    // Non-blocking
  }
}

export async function notifyBookingStatusChanged(input: {
  bookingId: string;
  userId?: string | null;
  tourTitle: string;
  contactEmail: string;
  contactName: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt?: string;
}): Promise<void> {
  void notifyBookingStatusInApp({
    userId: input.userId,
    bookingId: input.bookingId,
    tourTitle: input.tourTitle,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    changedAt: input.changedAt,
  });

  const statusLabel =
    BOOKING_STATUS_LABELS[input.toStatus as keyof typeof BOOKING_STATUS_LABELS] ?? input.toStatus;
  const bookingHref = `/profile/bookings/${encodeURIComponent(input.bookingId)}`;

  try {
    await Promise.all([
      sendBookingStatusChangedEmail({
        userId: input.userId,
        recipientEmail: input.contactEmail,
        recipientName: input.contactName,
        bookingId: input.bookingId,
        tourTitle: input.tourTitle,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
      }),
      sendBookingStatusChangedEmail({
        bookingId: input.bookingId,
        tourTitle: input.tourTitle,
        fromStatus: input.fromStatus,
        toStatus: input.toStatus,
        recipientEmail: input.contactEmail,
        adminCopy: true,
      }),
      sendPushToUser(input.userId, {
        title: "Статус заявки изменён",
        body: `«${input.tourTitle}» — ${statusLabel}`,
        href: bookingHref,
        tag: `booking-status-${input.bookingId}`,
        data: {
          bookingId: input.bookingId,
          toStatus: input.toStatus,
        },
      }),
    ]);
  } catch {
    // Non-blocking
  }
}

export async function notifyPaymentReceivedEmail(input: {
  userId?: string | null;
  bookingId: string;
  tourTitle: string;
  contactEmail: string;
  contactName?: string | null;
  amountUsd?: number | null;
  paymentStatus: "paid" | "partial" | "refunded";
  providerLabel?: string | null;
}): Promise<void> {
  try {
    await sendPaymentReceivedEmail({
      userId: input.userId,
      recipientEmail: input.contactEmail,
      recipientName: input.contactName,
      bookingId: input.bookingId,
      tourTitle: input.tourTitle,
      amountUsd: input.amountUsd,
      paymentStatus: input.paymentStatus,
      providerLabel: input.providerLabel,
    });
  } catch {
    // Non-blocking
  }
}

const PROVIDER_LABELS: Record<"stripe" | "mercadopago" | "manual", string> = {
  stripe: "Stripe",
  mercadopago: "Mercado Pago",
  manual: "Вручную",
};

/** Sends payment email after webhook patch (Supabase bookings). */
export async function notifyPaymentReceivedFromWebhook(
  supabase: SupabaseClient<Database>,
  bookingId: string,
  patch: BookingPaymentWebhookPatch
): Promise<void> {
  if (!patch.verified) return;
  if (patch.paymentStatus !== "paid" && patch.paymentStatus !== "partial" && patch.paymentStatus !== "refunded") {
    return;
  }

  const { data } = await supabase
    .from("bookings")
    .select("user_id, guest_user_id, tour_title, contact_email, contact_name")
    .eq("id", bookingId)
    .maybeSingle();

  if (!data?.contact_email?.trim()) return;

  await notifyPaymentReceivedEmail({
    userId: data.user_id ?? data.guest_user_id,
    bookingId,
    tourTitle: data.tour_title,
    contactEmail: data.contact_email,
    contactName: data.contact_name,
    amountUsd: patch.paymentSummary.paidAmountUsd,
    paymentStatus: patch.paymentStatus,
    providerLabel: PROVIDER_LABELS[patch.provider],
  });
}
