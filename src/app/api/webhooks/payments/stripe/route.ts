import { NextResponse } from "next/server";
import {
  mapWebhookToBookingPaymentUpdate,
  parseAndValidateWebhook,
} from "@/lib/payments/webhook-handler";

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const signatureHeader = request.headers.get("stripe-signature");
  // If set, STRIPE_WEBHOOK_SECRET enables signature verification for this endpoint.
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

  return NextResponse.json({ ok: true });
}
