import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { clientIpFromRequest, writeAdminAuditLog } from "@/lib/admin/audit";
import { resolveBookingPaymentSummary } from "@/lib/booking-payment";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import { fetchBookingById } from "@/lib/bookings-server";
import {
  createRefundRequest,
  executeRefundAttempt,
} from "@/lib/payments/transaction-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BookingPaymentGateway } from "@/types/booking-payment";
import type { PaymentProviderId } from "@/types/payment-webhook";

type PostBody = {
  bookingId?: string;
  amountUsd?: number;
  reason?: string;
};

function gatewayToProvider(gateway?: BookingPaymentGateway): PaymentProviderId {
  if (gateway === "mercadopago") return "mercadopago";
  if (gateway === "stripe") return "stripe";
  return "manual";
}

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "operations.bookings");
  if (!auth.ok) return auth.response;

  const body = (await request.json().catch(() => ({}))) as PostBody;
  const bookingId = body.bookingId?.trim();
  if (!bookingId) {
    return NextResponse.json({ error: "Укажите идентификатор бронирования" }, { status: 400 });
  }

  const supabase = createSupabaseAdminClient();
  const booking = await fetchBookingById(supabase, bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Бронирование не найдено" }, { status: 404 });
  }

  const paymentStatus = resolveBookingPaymentStatus(booking);
  if (paymentStatus !== "paid" && paymentStatus !== "partial") {
    return NextResponse.json(
      { error: "Возврат можно запросить только для оплаченной заявки" },
      { status: 400 }
    );
  }

  const summary = resolveBookingPaymentSummary(booking);
  const amount = Math.max(
    0,
    Math.round(body.amountUsd ?? summary.paidAmountUsd ?? booking.amountPaid ?? 0)
  );
  if (amount <= 0) {
    return NextResponse.json({ error: "Укажите сумму возврата" }, { status: 400 });
  }

  const created = await createRefundRequest(supabase, {
    bookingId,
    amount,
    currency: "USD",
    provider: gatewayToProvider(booking.paymentLink?.gateway),
    requestedBy: auth.actorId,
    reason: body.reason,
    metadata: {
      source: "admin_refund_action",
      initiatedBy: auth.actorId,
    },
  });

  if ("error" in created) {
    return NextResponse.json({ error: created.error }, { status: 400 });
  }

  const attempt = await executeRefundAttempt(supabase, {
    transactionId: created.transaction.id,
    actorUserId: auth.actorId,
    adminNotes: "Запуск возврата из админ-панели",
    strictProviderConfig: false,
    allowManualCompletion: false,
  });

  const transaction = attempt.ok ? attempt.transaction : created.transaction;
  const providerAttempt = attempt.ok
    ? {
        executed: attempt.providerExecuted,
        skippedReason: attempt.skippedReason ?? null,
      }
    : {
        executed: false,
        error: attempt.error,
        code: attempt.code,
      };

  await writeAdminAuditLog({
    actorUserId: auth.actorId,
    action: "payment.refund_created",
    entityType: "payment_transaction",
    entityId: transaction.id,
    payload: {
      bookingId,
      provider: transaction.provider,
      providerAttempt,
    },
    ipAddress: clientIpFromRequest(request),
  });

  return NextResponse.json(
    {
      transaction,
      providerAttempt,
    },
    { status: 201 }
  );
}
