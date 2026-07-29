import { NextResponse } from "next/server";
import { authorizeAdminRequest } from "@/lib/admin/authorize-request";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import { fetchBookingById } from "@/lib/bookings-server";
import {
  createRefundRequest,
} from "@/lib/payments/transaction-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/admin/user-identity-management";

type PostBody = {
  bookingId?: string;
  amount?: number;
  currency?: string;
  /** Backward-compatible only; rejected by the service for non-USD charges. */
  amountUsd?: number;
  reason?: string;
  operationId?: string;
  sourceTransactionId?: string;
};

export async function POST(request: Request) {
  const auth = await authorizeAdminRequest(request, "finance.refunds.prepare");
  if (!auth.ok) return auth.response;
  if (auth.via !== "session" || !isUuid(auth.actorId)) {
    return NextResponse.json({ error: "Финансовые операции требуют личную сессию" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as PostBody;
  const bookingId = body.bookingId?.trim();
  if (!bookingId) {
    return NextResponse.json({ error: "Укажите идентификатор бронирования" }, { status: 400 });
  }
  if (!isUuid(body.operationId)) {
    return NextResponse.json({ error: "Некорректный идентификатор операции" }, { status: 400 });
  }
  if (body.sourceTransactionId && !isUuid(body.sourceTransactionId)) {
    return NextResponse.json({ error: "Некорректное исходное списание" }, { status: 400 });
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

  const amount = body.amount ?? body.amountUsd;
  const currency = body.currency?.trim().toUpperCase() ??
    (body.amountUsd !== undefined ? "USD" : undefined);

  const created = await createRefundRequest(supabase, {
    bookingId,
    amount,
    currency,
    requestedBy: auth.actorId,
    operationId: body.operationId,
    sourceTransactionId: body.sourceTransactionId,
    reason: body.reason,
    metadata: {
      source: "admin_refund_action",
      initiatedBy: auth.actorId,
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
