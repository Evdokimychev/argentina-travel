import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { resolveBookingPaymentSummary } from "@/lib/booking-payment";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import { fetchBookingById, organizerCanAccessBooking } from "@/lib/bookings-server";
import {
  createRefundRequest,
  executeRefundAttempt,
} from "@/lib/payments/transaction-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type { BookingPaymentGateway } from "@/types/booking-payment";
import type { PaymentProviderId } from "@/types/payment-webhook";
import { userHasAccountRole } from "@/types/user";

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
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "API платежей недоступен" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as PostBody;
  const bookingId = body.bookingId?.trim();
  if (!bookingId) {
    return NextResponse.json({ error: "Укажите бронирование" }, { status: 400 });
  }

  const supabase = await createSupabaseServerClient();
  const sessionUser = await loadSessionUserFromSupabase(supabase);
  if (!sessionUser || !userHasAccountRole(sessionUser, "organizer")) {
    return NextResponse.json({ error: "Доступ запрещён" }, { status: 403 });
  }

  const booking = await fetchBookingById(supabase, bookingId);
  if (!booking) {
    return NextResponse.json({ error: "Заявка не найдена" }, { status: 404 });
  }

  if (!organizerCanAccessBooking(booking, sessionUser.id)) {
    return NextResponse.json({ error: "Нет доступа к заявке" }, { status: 403 });
  }

  const paymentStatus = resolveBookingPaymentStatus(booking);
  if (paymentStatus !== "paid") {
    return NextResponse.json(
      { error: "Запросить возврат можно только для полностью оплаченной заявки" },
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

  const admin = createSupabaseAdminClient();
  const created = await createRefundRequest(admin, {
    bookingId,
    amount,
    currency: "USD",
    provider: gatewayToProvider(booking.paymentLink?.gateway),
    requestedBy: sessionUser.id,
    reason: body.reason,
    metadata: {
      source: "organizer_refund_request",
      organizerUserId: sessionUser.id,
    },
  });

  if ("error" in created) {
    return NextResponse.json({ error: created.error }, { status: 400 });
  }

  const attempt = await executeRefundAttempt(admin, {
    transactionId: created.transaction.id,
    actorUserId: sessionUser.id,
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

  return NextResponse.json(
    {
      transaction,
      providerAttempt,
    },
    { status: 201 }
  );
}
