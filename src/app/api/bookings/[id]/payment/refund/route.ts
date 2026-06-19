import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import {
  canAccessBooking,
  fetchBookingById,
  organizerCanAccessBooking,
} from "@/lib/bookings-server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { resolveBookingPaymentSummary } from "@/lib/booking-payment";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import {
  createRefundRequest,
  findLatestRefundForBooking,
  findPendingRefundForBooking,
} from "@/lib/payments/transaction-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { BookingPaymentGateway } from "@/types/booking-payment";
import type { PaymentProviderId } from "@/types/payment-webhook";

type PostBody = {
  reason?: string;
  amountUsd?: number;
};

function gatewayToProvider(gateway?: BookingPaymentGateway): PaymentProviderId {
  if (gateway === "mercadopago") return "mercadopago";
  if (gateway === "stripe") return "stripe";
  return "manual";
}

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

    if (!canAccessBooking(booking, sessionUser, sessionUser?.email)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const admin = createSupabaseAdminClient();
    const pending = await findPendingRefundForBooking(admin, id);
    const latest = await findLatestRefundForBooking(admin, id);

    return NextResponse.json({ pendingRefund: pending, latestRefund: latest });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
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
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);

    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await fetchBookingById(supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const isTourist =
      booking.userId === sessionUser.id ||
      (sessionUser.email &&
        booking.contactEmail.toLowerCase() === sessionUser.email.toLowerCase());
    const isOrganizer = organizerCanAccessBooking(booking, sessionUser.id);

    if (!isTourist && !isOrganizer) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

    const admin = createSupabaseAdminClient();
    const result = await createRefundRequest(admin, {
      bookingId: id,
      amount,
      currency: "USD",
      provider: gatewayToProvider(booking.paymentLink?.gateway),
      requestedBy: sessionUser.id,
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
