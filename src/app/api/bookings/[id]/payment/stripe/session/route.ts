import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { fetchBookingById, updateBookingRecord } from "@/lib/bookings-server";
import { isBookingPaymentLinkExpired } from "@/lib/booking-payment-link";
import { normalizeBooking } from "@/lib/bookings-store";
import { addPaymentBreadcrumb, captureException } from "@/lib/monitoring/sentry";
import { createCheckoutSession, isStripeConfigured } from "@/lib/payments/stripe-client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CreateSessionBody = {
  paymentLinkToken?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey || !isStripeConfigured()) {
    return NextResponse.json(
      {
        error:
          "Stripe не настроен. Задайте STRIPE_SECRET_KEY для создания сессии оплаты.",
      },
      { status: 503 }
    );
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as CreateSessionBody;

  try {
    const supabase = createSupabaseAdminClient();
    const booking = await fetchBookingById(supabase, id);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (!booking.paymentLink) {
      return NextResponse.json({ error: "Booking has no active payment link" }, { status: 400 });
    }

    if (!body.paymentLinkToken?.trim()) {
      return NextResponse.json({ error: "paymentLinkToken is required" }, { status: 400 });
    }

    if (booking.paymentLink.token !== body.paymentLinkToken.trim()) {
      return NextResponse.json({ error: "Invalid payment link token" }, { status: 403 });
    }

    if (isBookingPaymentLinkExpired(booking.paymentLink)) {
      return NextResponse.json({ error: "Payment link expired" }, { status: 409 });
    }

    if (booking.paymentLink.status === "cancelled") {
      return NextResponse.json({ error: "Payment link cancelled" }, { status: 409 });
    }

    if (booking.paymentLink.status === "paid") {
      return NextResponse.json({ error: "Booking already paid" }, { status: 409 });
    }

    if (
      booking.paymentLink.gateway === "stripe" &&
      booking.paymentLink.sessionId &&
      booking.paymentLink.checkoutUrl
    ) {
      return NextResponse.json({
        sessionId: booking.paymentLink.sessionId,
        checkoutUrl: booking.paymentLink.checkoutUrl,
      });
    }

    const session = await createCheckoutSession(booking, {
      secretKey,
      baseUrl: new URL(request.url).origin,
      idempotencyKey: `booking-stripe-${booking.id}-${Date.now().toString(36)}`,
    });
    addPaymentBreadcrumb("stripe.checkout_session.created", {
      bookingId: booking.id,
      sessionId: session.sessionId,
    });

    const now = new Date().toISOString();
    const updatedBooking = normalizeBooking({
      ...booking,
      updatedAt: now,
      paymentLink: {
        ...booking.paymentLink,
        gateway: "stripe",
        sessionId: session.sessionId,
        checkoutUrl: session.checkoutUrl,
        sessionCreatedAt: now,
      },
    });

    const updateResult = await updateBookingRecord(supabase, updatedBooking);
    if ("error" in updateResult) {
      addPaymentBreadcrumb("stripe.checkout_session.persist_failed", {
        bookingId: booking.id,
        error: updateResult.error,
      });
      return NextResponse.json({ error: updateResult.error }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: session.sessionId,
      checkoutUrl: session.checkoutUrl,
    });
  } catch (error) {
    addPaymentBreadcrumb("stripe.checkout_session.failed", {
      bookingId: id,
      error: error instanceof Error ? error.message : "Unexpected error",
    });
    captureException(error, {
      tags: { area: "payments", provider: "stripe", action: "create_checkout_session" },
      extra: { bookingId: id },
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while creating Stripe checkout session",
      },
      { status: 500 }
    );
  }
}
