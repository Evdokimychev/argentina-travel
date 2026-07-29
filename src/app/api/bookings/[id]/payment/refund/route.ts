import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import {
  canAccessBooking,
  fetchBookingById,
} from "@/lib/bookings-server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import {
  createRefundRequest,
  findLatestRefundForBooking,
  findPendingRefundForBooking,
} from "@/lib/payments/transaction-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/admin/user-identity-management";

type PostBody = {
  reason?: string;
  operationId?: string;
};

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  const { id } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    const booking = await fetchBookingById(supabase, id);

    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    if (!canAccessBooking(booking, sessionUser)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();
    const pending = await findPendingRefundForBooking(admin, id);
    const latest = await findLatestRefundForBooking(admin, id);

    return NextResponse.json({ pendingRefund: pending, latestRefund: latest });
  } catch (error) {
    console.error("Refund status route failed", error);
    return NextResponse.json({ error: "Не удалось загрузить статус возврата" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  const { id } = await context.params;

  try {
    const body = (await request.json().catch(() => ({}))) as PostBody;
    const operationId = body.operationId?.trim();
    if (!isUuid(operationId)) {
      return NextResponse.json({ error: "Некорректный идентификатор операции" }, { status: 400 });
    }
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await fetchBookingById(supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isTourist = booking.userId === sessionUser.id;
    const canAccess = canAccessBooking(booking, sessionUser);
    const isOrganizer = canAccess && !isTourist;

    if (!canAccess) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const paymentStatus = resolveBookingPaymentStatus(booking);
    if (paymentStatus !== "paid" && paymentStatus !== "partial") {
      return NextResponse.json(
        { error: "Возврат можно запросить только для оплаченной заявки" },
        { status: 400 }
      );
    }

    const admin = createSupabaseAdminClient();
    const result = await createRefundRequest(admin, {
      bookingId: id,
      requestedBy: sessionUser.id,
      operationId,
      reason: body.reason,
      metadata: {
        source: isOrganizer ? "organizer_refund_request_legacy" : "tourist_refund_request",
      },
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({ transaction: result.transaction }, { status: 201 });
  } catch (error) {
    console.error("Refund request route failed", error);
    return NextResponse.json({ error: "Не удалось обработать запрос на возврат" }, { status: 500 });
  }
}
