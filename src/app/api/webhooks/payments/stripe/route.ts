import { NextResponse } from "next/server";
import {
  applyPaymentWebhookPatch,
  mapWebhookToBookingPaymentUpdate,
  parseAndValidateWebhook,
  persistWebhookChargeTransaction,
} from "@/lib/payments/webhook-handler";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const signatureHeader = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  const parsed = parseAndValidateWebhook({
    provider: "stripe",
    payload,
    signatureHeader,
    secret,
  });

  if (!parsed.event) {
    console.warn("[payments-webhook][stripe] rejected payload", {
      verified: parsed.verified,
      error: parsed.error,
    });
    return NextResponse.json({ ok: true });
  }

  const patch = mapWebhookToBookingPaymentUpdate(parsed.event, parsed.verified);
  console.info("[payments-webhook][stripe] event received", {
    verified: parsed.verified,
    bookingId: parsed.event.bookingId,
    eventId: parsed.event.eventId,
    eventType: parsed.event.eventType,
    paymentStatus: patch.paymentStatus,
  });

  if (!parsed.verified) {
    return NextResponse.json({ ok: true });
  }

  const supabase = createSupabaseAdminClient();
  const applied = await applyPaymentWebhookPatch(supabase, parsed.event.bookingId, patch);

  if (applied && (patch.paymentStatus === "paid" || patch.paymentStatus === "partial")) {
    const externalId =
      parsed.event.rawPayload &&
      typeof parsed.event.rawPayload === "object" &&
      !Array.isArray(parsed.event.rawPayload)
        ? String(
            (parsed.event.rawPayload as Record<string, unknown>).id ??
              parsed.event.eventId
          )
        : parsed.event.eventId;

    await persistWebhookChargeTransaction(supabase, {
      bookingId: parsed.event.bookingId,
      patch,
      externalId,
      amount: patch.paymentSummary.paidAmountUsd,
      currency: "USD",
    });
  }

  return NextResponse.json({ ok: true, applied });
}
