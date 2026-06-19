import { NextResponse } from "next/server";
import {
  applyPaymentWebhookPatch,
  mapWebhookToBookingPaymentUpdate,
  persistWebhookChargeTransaction,
} from "@/lib/payments/webhook-handler";
import {
  buildPaymentReceiptMetadata,
  fetchPaymentDetails,
  mapMercadoPagoToBookingPaymentStatus,
  parseNotification,
  verifyWebhookSignature,
} from "@/lib/payments/mercadopago-client";
import { notifyPaymentReceivedFromWebhook } from "@/lib/bookings-notify";
import { addPaymentBreadcrumb, captureException } from "@/lib/monitoring/sentry";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { PaymentWebhookEvent } from "@/types/payment-webhook";

function resolveBookingId(payment: {
  externalReference?: string;
  metadata?: Record<string, unknown>;
}): string | null {
  const fromExternal = payment.externalReference?.trim();
  if (fromExternal) return fromExternal;

  const metadata = payment.metadata;
  if (!metadata) return null;
  const candidates = [metadata.bookingId, metadata.booking_id, metadata.booking];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim()) {
      return candidate.trim();
    }
  }
  return null;
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);
  const notification = parseNotification({
    payload,
    query: new URL(request.url).searchParams,
  });

  if (!notification) {
    return NextResponse.json({ ok: false, error: "Invalid Mercado Pago notification payload." }, { status: 400 });
  }

  const webhookSecret = process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Mercado Pago webhook secret is not configured. Set MERCADOPAGO_WEBHOOK_SECRET to process payments.",
      },
      { status: 503 }
    );
  }

  const verified = verifyWebhookSignature({
    secret: webhookSecret,
    signatureHeader: request.headers.get("x-signature"),
    requestIdHeader: request.headers.get("x-request-id"),
    dataId: notification.dataId,
  });

  if (!verified) {
    console.warn("[payments-webhook][mercadopago] signature verification failed", {
      notificationId: notification.notificationId,
      topic: notification.topic,
      dataId: notification.dataId,
    });
    return NextResponse.json({ ok: false, error: "Invalid Mercado Pago signature." }, { status: 401 });
  }

  if (notification.topic !== "payment") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  addPaymentBreadcrumb("mercadopago.webhook.received", {
    provider: "mercadopago",
    notificationId: notification.notificationId,
    topic: notification.topic,
    dataId: notification.dataId,
  });

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Mercado Pago access token is not configured. Set MERCADOPAGO_ACCESS_TOKEN to process payments.",
      },
      { status: 503 }
    );
  }

  if (!notification.dataId) {
    return NextResponse.json(
      { ok: false, error: "Mercado Pago payment notification has no data.id." },
      { status: 400 }
    );
  }

  try {
    const payment = await fetchPaymentDetails({
      paymentId: notification.dataId,
      accessToken,
    });
    const bookingId = resolveBookingId(payment);

    if (!bookingId) {
      console.warn("[payments-webhook][mercadopago] payment without booking id", {
        paymentId: payment.id,
        externalReference: payment.externalReference,
      });
      return NextResponse.json({ ok: true, ignored: true });
    }

    const receiptMetadata = buildPaymentReceiptMetadata(payment);

    const event: PaymentWebhookEvent = {
      provider: "mercadopago",
      eventId: notification.notificationId ?? `mp-payment-${payment.id}`,
      eventType: notification.action ?? "payment.updated",
      bookingId,
      paymentStatus: mapMercadoPagoToBookingPaymentStatus(payment.status, payment.statusDetail),
      amountPaidUsd: payment.transactionAmount,
      amountTotalUsd: payment.transactionAmount,
      occurredAt: payment.dateApproved ?? payment.dateCreated ?? new Date().toISOString(),
      rawPayload: {
        notification: notification.rawPayload,
        payment,
      },
    };

    const patch = mapWebhookToBookingPaymentUpdate(event, verified);
    const supabase = createSupabaseAdminClient();
    const applied = await applyPaymentWebhookPatch(supabase, bookingId, patch);

    if (applied) {
      await persistWebhookChargeTransaction(supabase, {
        bookingId,
        patch,
        externalId: payment.id,
        amount: payment.transactionAmount,
        currency: payment.currencyId ?? "USD",
        receiptMetadata,
      });
      void notifyPaymentReceivedFromWebhook(supabase, bookingId, patch);
    }

    console.info("[payments-webhook][mercadopago] payment processed", {
      bookingId,
      paymentId: payment.id,
      status: payment.status,
      capturePhase: receiptMetadata.capturePhase,
      paymentStatus: patch.paymentStatus,
      applied,
    });
    addPaymentBreadcrumb("mercadopago.webhook.processed", {
      provider: "mercadopago",
      notificationId: notification.notificationId,
      paymentId: payment.id,
      bookingId,
      paymentStatus: patch.paymentStatus,
      applied,
    });

    return NextResponse.json({ ok: true, applied });
  } catch (error) {
    addPaymentBreadcrumb("mercadopago.webhook.failed", {
      provider: "mercadopago",
      notificationId: notification.notificationId,
      dataId: notification.dataId,
      error: error instanceof Error ? error.message : String(error),
    });
    captureException(error, {
      tags: {
        area: "payments",
        provider: "mercadopago",
        topic: notification.topic,
      },
      extra: {
        notificationId: notification.notificationId ?? null,
        dataId: notification.dataId ?? null,
      },
    });
    console.error("[payments-webhook][mercadopago] processing failed", {
      error: error instanceof Error ? error.message : String(error),
      notificationId: notification.notificationId,
      dataId: notification.dataId,
    });
    return NextResponse.json({ ok: false, error: "Failed to process Mercado Pago webhook." }, { status: 500 });
  }
}
