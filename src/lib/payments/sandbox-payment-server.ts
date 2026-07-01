import type { SupabaseClient } from "@supabase/supabase-js";
import {
  computePrepaymentAmount,
  resolveBookingPaymentStatus,
  resolveOrganizerParams,
} from "@/lib/booking-params";
import { resolveBookingAmounts } from "@/lib/booking-payment-display";
import { fetchBookingById } from "@/lib/bookings-server";
import {
  applyPaymentWebhookPatch,
  mapWebhookToBookingPaymentUpdate,
  persistWebhookChargeTransaction,
} from "@/lib/payments/webhook-handler";
import type { Database } from "@/types/database";
import type { BookingPaymentStatus } from "@/types/booking-params";
import type { PaymentWebhookEvent } from "@/types/payment-webhook";
import type { Booking } from "@/types/tourist";

type DbClient = SupabaseClient<Database>;

export type SimulateSandboxPaymentInput = {
  /** Charge deposit / partial amount instead of clearing the full balance. */
  asPartial?: boolean;
  /** Explicit charge amount in USD; defaults to remaining due. */
  amountUsd?: number;
};

export type SimulateSandboxPaymentResult = {
  booking: Booking;
  paymentStatus: BookingPaymentStatus;
  externalId: string;
  amountUsd: number;
};

export async function simulateSandboxPayment(
  supabase: DbClient,
  bookingId: string,
  input: SimulateSandboxPaymentInput = {}
): Promise<SimulateSandboxPaymentResult | { error: string }> {
  const booking = await fetchBookingById(supabase, bookingId);
  if (!booking) return { error: "Бронирование не найдено" };

  const amounts = resolveBookingAmounts(booking);
  if (amounts.due <= 0 && resolveBookingPaymentStatus(booking) === "paid") {
    return { error: "Заявка уже полностью оплачена" };
  }

  let chargeAmount = input.amountUsd ?? amounts.due;
  if (chargeAmount <= 0 && booking.paymentLink?.amountUsd) {
    chargeAmount = booking.paymentLink.amountUsd;
  }
  if (chargeAmount <= 0) {
    chargeAmount = amounts.total;
  }

  if (input.asPartial) {
    const organizerParams = resolveOrganizerParams(booking);
    const deposit = computePrepaymentAmount(amounts.total, organizerParams);
    chargeAmount = deposit > 0 ? deposit : Math.max(1, Math.round(amounts.total * 0.1));
  }

  const maxCharge = amounts.due > 0 ? amounts.due : amounts.total;
  chargeAmount = Math.min(Math.max(0, Math.round(chargeAmount)), maxCharge);
  if (chargeAmount <= 0) {
    return { error: "Нет суммы для симуляции оплаты" };
  }

  const nextPaid = Math.min(amounts.total, amounts.paid + chargeAmount);
  const paymentStatus: BookingPaymentStatus =
    nextPaid >= amounts.total ? "paid" : nextPaid > 0 ? "partial" : "pending";

  const now = new Date().toISOString();
  const externalId = `sandbox-${bookingId.slice(-8)}-${Date.now()}`;

  const event: PaymentWebhookEvent = {
    provider: "manual",
    eventId: externalId,
    eventType: "sandbox.simulated",
    bookingId,
    paymentStatus,
    amountPaidUsd: chargeAmount,
    amountTotalUsd: amounts.total,
    occurredAt: now,
    rawPayload: { sandbox: true, simulated: true },
  };

  const patch = mapWebhookToBookingPaymentUpdate(event, true);
  patch.paymentSummary = {
    totalAmountUsd: amounts.total,
    paidAmountUsd: nextPaid,
    remainingAmountUsd: Math.max(0, amounts.total - nextPaid),
    serviceFeeUsd: booking.paymentSummary?.serviceFeeUsd ?? 0,
  };

  const applied = await applyPaymentWebhookPatch(supabase, bookingId, patch);
  if (!applied) {
    return { error: "Не удалось обновить статус оплаты" };
  }

  await persistWebhookChargeTransaction(supabase, {
    bookingId,
    patch,
    externalId,
    amount: chargeAmount,
    currency: booking.metadata?.checkoutCurrency ?? "USD",
    receiptMetadata: {
      providerPaymentId: externalId,
      providerStatus: "approved",
      capturePhase: "captured",
      statusDetail: "sandbox_simulation",
    },
  });

  const updated = await fetchBookingById(supabase, bookingId);
  if (!updated) return { error: "Бронирование не найдено после обновления" };

  return {
    booking: updated,
    paymentStatus,
    externalId,
    amountUsd: chargeAmount,
  };
}
