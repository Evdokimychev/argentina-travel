import { NextResponse } from "next/server";
import {
  applyPaymentWebhookPatch,
  mapWebhookToBookingPaymentUpdate,
  persistWebhookChargeTransaction,
} from "@/lib/payments/webhook-handler";
import {
  fetchPaymentDetails,
  parseNotification,
  verifyWebhookSignature,
} from "@/lib/payments/mercadopago-client";
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

function toPaymentStatus(status: string, statusDetail?: string): PaymentWebhookEvent["paymentStatus"] {
  const normalized = status.trim().toLowerCase();
  const detail = statusDetail?.trim().toLowerCase();

  if (normalized === "approved") {
    return "paid";
  }

  if (normalized === "partially_refunded") {
    return "partial";
  }

  if (
    normalized === "pending" ||
    normalized === "in_process" ||
    normalized === "in_mediation" ||
    normalized === "authorized" ||
    normalized === "process"
  ) {
    return detail === "partially_paid" ? "partial" : "pending";
  }

  return "pending";
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

    const event: PaymentWebhookEvent = {
      provider: "mercadopago",
      eventId: notification.notificationId ?? `mp-payment-${payment.id}`,
      eventType: notification.action ?? "payment.updated",
      bookingId,
      paymentStatus: toPaymentStatus(payment.status, payment.statusDetail),
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
      });
    }

    console.info("[payments-webhook][mercadopago] payment processed", {
      bookingId,
      paymentId: payment.id,
      status: payment.status,
      paymentStatus: patch.paymentStatus,
      applied,
    });

    return NextResponse.json({ ok: true, applied });
  } catch (error) {
    console.error("[payments-webhook][mercadopago] processing failed", {
      error: error instanceof Error ? error.message : String(error),
      notificationId: notification.notificationId,
      dataId: notification.dataId,
    });
    return NextResponse.json({ ok: false, error: "Failed to process Mercado Pago webhook." }, { status: 500 });
  }

}
