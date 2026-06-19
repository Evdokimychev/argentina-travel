import { NextResponse } from "next/server";
import {
  applyPaymentWebhookPatch,
  mapWebhookToBookingPaymentUpdate,
  persistWebhookChargeTransaction,
} from "@/lib/payments/webhook-handler";
import {
  buildStripeChargeReceiptMetadata,
  buildStripePaymentIntentReceiptMetadata,
  fetchCharge,
  fetchPaymentIntent,
  mapStripeToBookingPaymentStatus,
  parseStripeWebhookPayload,
  resolveStripeBookingId,
  stripeAmountToUsd,
  verifyStripeWebhookSignature,
} from "@/lib/payments/stripe-client";
import { notifyPaymentReceivedFromWebhook } from "@/lib/bookings-notify";
import { addPaymentBreadcrumb, captureException } from "@/lib/monitoring/sentry";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PaymentWebhookEvent } from "@/types/payment-webhook";

const HANDLED_EVENT_TYPES = new Set([
  "payment_intent.succeeded",
  "payment_intent.amount_capturable_updated",
  "payment_intent.payment_failed",
  "charge.refunded",
]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  let payload: unknown = null;
  try {
    payload = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid Stripe webhook JSON." }, { status: 400 });
  }
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

  if (!webhookSecret) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Stripe webhook secret is not configured. Set STRIPE_WEBHOOK_SECRET to process payments.",
      },
      { status: 503 }
    );
  }

  const verified = verifyStripeWebhookSignature({
    secret: webhookSecret,
    signatureHeader: request.headers.get("stripe-signature"),
    rawBody,
  });

  if (!verified) {
    console.warn("[payments-webhook][stripe] signature verification failed");
    return NextResponse.json({ ok: false, error: "Invalid Stripe signature." }, { status: 401 });
  }

  const event = parseStripeWebhookPayload(payload);
  if (!event) {
    return NextResponse.json({ ok: false, error: "Invalid Stripe webhook payload." }, { status: 400 });
  }

  if (!HANDLED_EVENT_TYPES.has(event.type)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  addPaymentBreadcrumb("stripe.webhook.received", {
    provider: "stripe",
    eventId: event.id,
    eventType: event.type,
  });

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Stripe secret key is not configured. Set STRIPE_SECRET_KEY to process payments.",
      },
      { status: 503 }
    );
  }

  try {
    let paymentEvent: PaymentWebhookEvent | null = null;
    let receiptMetadata: Record<string, unknown> | undefined;
    let externalId = "";
    let amount = 0;
    let ledgerAmount = 0;
    let currency = "USD";

    if (event.type.startsWith("payment_intent.")) {
      const paymentIntentId =
        typeof event.dataObject.id === "string" ? event.dataObject.id.trim() : "";
      if (!paymentIntentId) {
        return NextResponse.json(
          { ok: false, error: "Stripe PaymentIntent event has no id." },
          { status: 400 }
        );
      }

      const payment = await fetchPaymentIntent({ paymentIntentId, secretKey });
      const bookingId = resolveStripeBookingId({ metadata: payment.metadata });

      if (!bookingId) {
        console.warn("[payments-webhook][stripe] payment intent without booking id", {
          paymentIntentId: payment.id,
        });
        return NextResponse.json({ ok: true, ignored: true });
      }

      receiptMetadata = buildStripePaymentIntentReceiptMetadata(payment);
      externalId = payment.id;
      amount = stripeAmountToUsd(payment.amountReceived || payment.amount);
      ledgerAmount = amount;
      currency = payment.currency;

      paymentEvent = {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        bookingId,
        paymentStatus: mapStripeToBookingPaymentStatus({
          status: payment.status,
          amount: payment.amount,
          amountReceived: payment.amountReceived,
        }),
        amountPaidUsd: amount,
        amountTotalUsd: stripeAmountToUsd(payment.amount),
        occurredAt: new Date(event.created * 1000).toISOString(),
        rawPayload: {
          event: event.rawPayload,
          paymentIntent: payment,
        },
      };
    } else if (event.type === "charge.refunded") {
      const chargeId = typeof event.dataObject.id === "string" ? event.dataObject.id.trim() : "";
      if (!chargeId) {
        return NextResponse.json({ ok: false, error: "Stripe Charge event has no id." }, { status: 400 });
      }

      const charge = await fetchCharge({ chargeId, secretKey });
      const bookingId = resolveStripeBookingId({ metadata: charge.metadata });

      if (!bookingId) {
        console.warn("[payments-webhook][stripe] charge without booking id", {
          chargeId: charge.id,
        });
        return NextResponse.json({ ok: true, ignored: true });
      }

      receiptMetadata = buildStripeChargeReceiptMetadata(charge);
      externalId = charge.paymentIntentId ?? charge.id;
      amount = stripeAmountToUsd(charge.amount - charge.amountRefunded);
      ledgerAmount = stripeAmountToUsd(charge.amount);
      currency = charge.currency;

      paymentEvent = {
        provider: "stripe",
        eventId: event.id,
        eventType: event.type,
        bookingId,
        paymentStatus: mapStripeToBookingPaymentStatus({
          status: charge.status,
          amount: charge.amount,
          amountRefunded: charge.amountRefunded,
          refunded: charge.refunded,
        }),
        amountPaidUsd: amount,
        amountTotalUsd: stripeAmountToUsd(charge.amount),
        occurredAt: new Date(event.created * 1000).toISOString(),
        rawPayload: {
          event: event.rawPayload,
          charge,
        },
      };
    }

    if (!paymentEvent) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const patch = mapWebhookToBookingPaymentUpdate(paymentEvent, verified);
    const supabase = createSupabaseAdminClient();
    const applied = await applyPaymentWebhookPatch(supabase, paymentEvent.bookingId, patch);

    if (applied) {
      await persistWebhookChargeTransaction(supabase, {
        bookingId: paymentEvent.bookingId,
        patch,
        externalId,
        amount: ledgerAmount,
        currency,
        receiptMetadata,
      });
      void notifyPaymentReceivedFromWebhook(supabase, paymentEvent.bookingId, patch);
    }

    console.info("[payments-webhook][stripe] event processed", {
      bookingId: paymentEvent.bookingId,
      eventType: event.type,
      externalId,
      capturePhase: receiptMetadata?.capturePhase,
      paymentStatus: patch.paymentStatus,
      applied,
    });
    addPaymentBreadcrumb("stripe.webhook.processed", {
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      bookingId: paymentEvent.bookingId,
      paymentStatus: patch.paymentStatus,
      applied,
    });

    return NextResponse.json({ ok: true, applied });
  } catch (error) {
    addPaymentBreadcrumb("stripe.webhook.failed", {
      provider: "stripe",
      eventId: event.id,
      eventType: event.type,
      error: error instanceof Error ? error.message : String(error),
    });
    captureException(error, {
      tags: {
        area: "payments",
        provider: "stripe",
        eventType: event.type,
      },
      extra: {
        eventId: event.id,
      },
    });
    console.error("[payments-webhook][stripe] processing failed", {
      error: error instanceof Error ? error.message : String(error),
      eventId: event.id,
      eventType: event.type,
    });
    return NextResponse.json({ ok: false, error: "Failed to process Stripe webhook." }, { status: 500 });
  }
}
