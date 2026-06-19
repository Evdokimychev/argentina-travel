import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import {
  fetchPaymentDetails,
  isMercadoPagoConfigured,
  mapMercadoPagoCapturePhase,
} from "@/lib/payments/mercadopago-client";
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
        error: error instanceof Error ? error.message : "Не удалось загрузить данные Mercado Pago",
      };
    }
  }

  return NextResponse.json({ transaction, receipt, livePayment });
}
