import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import {
  fetchPaymentDetails,
  isMercadoPagoConfigured,
  mapMercadoPagoCapturePhase,
} from "@/lib/payments/mercadopago-client";
import {
  fetchCharge,
  fetchPaymentIntent,
  isStripeConfigured,
  mapStripeCapturePhase,
} from "@/lib/payments/stripe-client";
import {
  fetchPaymentTransactionById,
  mapTransactionToReceiptView,
} from "@/lib/payments/transaction-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const { id } = await context.params;
  const includeLive = new URL(request.url).searchParams.get("live") === "1";

  const supabase = createSupabaseAdminClient();
  const transaction = await fetchPaymentTransactionById(supabase, id);
  if (!transaction) {
    return NextResponse.json({ error: "Транзакция не найдена" }, { status: 404 });
  }

  const receipt = mapTransactionToReceiptView(transaction);
  let livePayment: Record<string, unknown> | null = null;

  if (
    includeLive &&
    transaction.provider === "mercadopago" &&
    transaction.externalId &&
    isMercadoPagoConfigured()
  ) {
    try {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN!.trim();
      const payment = await fetchPaymentDetails({
        paymentId: transaction.externalId,
        accessToken,
      });
      livePayment = {
        provider: "mercadopago",
        id: payment.id,
        status: payment.status,
        statusDetail: payment.statusDetail,
        capturePhase: mapMercadoPagoCapturePhase(payment.status, payment.statusDetail),
        transactionAmount: payment.transactionAmount,
        currencyId: payment.currencyId,
        dateCreated: payment.dateCreated,
        dateApproved: payment.dateApproved,
        paymentMethodId: payment.paymentMethodId,
        authorizationCode: payment.authorizationCode,
      };
    } catch (error) {
      livePayment = {
        provider: "mercadopago",
        error: error instanceof Error ? error.message : "Не удалось загрузить данные Mercado Pago",
      };
    }
  }

  if (
    includeLive &&
    transaction.provider === "stripe" &&
    transaction.externalId &&
    isStripeConfigured()
  ) {
    try {
      const secretKey = process.env.STRIPE_SECRET_KEY!.trim();
      const payment = await fetchPaymentIntent({
        paymentIntentId: transaction.externalId,
        secretKey,
      });
      livePayment = {
        provider: "stripe",
        id: payment.id,
        status: payment.status,
        capturePhase: mapStripeCapturePhase({
          status: payment.status,
          amount: payment.amount,
        }),
        transactionAmount: payment.amount / 100,
        currencyId: payment.currency,
        dateCreated: payment.created ? new Date(payment.created * 1000).toISOString() : undefined,
        dateApproved:
          payment.status === "succeeded" && payment.created
            ? new Date(payment.created * 1000).toISOString()
            : undefined,
        paymentMethodId: payment.paymentMethodId,
      };
    } catch {
      try {
        const secretKey = process.env.STRIPE_SECRET_KEY!.trim();
        const charge = await fetchCharge({
          chargeId: transaction.externalId,
          secretKey,
        });
        livePayment = {
          provider: "stripe",
          id: charge.id,
          status: charge.status,
          capturePhase: mapStripeCapturePhase({
            status: charge.status,
            amount: charge.amount,
            amountRefunded: charge.amountRefunded,
            refunded: charge.refunded,
          }),
          transactionAmount: charge.amount / 100,
          currencyId: charge.currency,
          dateCreated: charge.created ? new Date(charge.created * 1000).toISOString() : undefined,
          dateApproved:
            charge.paid && charge.created
              ? new Date(charge.created * 1000).toISOString()
              : undefined,
        };
      } catch (error) {
        livePayment = {
          provider: "stripe",
          error: error instanceof Error ? error.message : "Не удалось загрузить данные Stripe",
        };
      }
    }
  }

  return NextResponse.json({ transaction, receipt, livePayment });
}
