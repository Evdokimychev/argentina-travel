import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { resolveBookingPaymentSummary } from "@/lib/booking-payment";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import { fetchBookingById, organizerCanAccessBooking } from "@/lib/bookings-server";
import {
  createRefundRequest,
} from "@/lib/payments/transaction-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import type { BookingPaymentGateway } from "@/types/booking-payment";
import type { PaymentProviderId } from "@/types/payment-webhook";
import { userHasAccountRole } from "@/types/user";
import { isUuid } from "@/lib/admin/user-identity-management";

type PostBody = {
  bookingId?: string;
  amountUsd?: number;
  reason?: string;
  operationId?: string;
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
  const operationId = body.operationId?.trim();
  if (!isUuid(operationId)) {
    return NextResponse.json({ error: "Некорректный идентификатор операции" }, { status: 400 });
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
    Math.round((body.amountUsd ?? summary.paidAmountUsd ?? booking.amountPaid ?? 0) * 100) / 100
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
    operationId,
    reason: body.reason,
    metadata: {
      source: "organizer_refund_request",
      organizerUserId: sessionUser.id,
    },
  });

  if ("error" in created) {
    return NextResponse.json({ error: created.error }, { status: 400 });
  }

  return NextResponse.json(
    {
      transaction: created.transaction,
      nextStep: "approval_required",
    },
    { status: 201 }
  );
}
