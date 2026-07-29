import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { fetchBookingById, updateBookingRecord } from "@/lib/bookings-server";
import { isBookingPaymentLinkExpired } from "@/lib/booking-payment-link";
import { normalizeBooking } from "@/lib/bookings-store";
import { addPaymentBreadcrumb, captureException } from "@/lib/monitoring/sentry";
import { createCheckoutSession, isStripeConfigured } from "@/lib/payments/stripe-client";
import {
  buildPaymentCheckoutIdempotencyKey,
  canStartPaymentForBookingStatus,
  isPaymentProviderLocked,
  nextPaymentBookingUpdatedAt,
} from "@/lib/payments/payment-integrity";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publicApiError } from "@/lib/public-api/safe-error";

type CreateSessionBody = {
  paymentLinkToken?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json(publicApiError("SERVICE_UNAVAILABLE"), { status: 503 });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey || !isStripeConfigured()) {
    return NextResponse.json(publicApiError("PAYMENT_UNAVAILABLE"), { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as CreateSessionBody;

  try {
    const supabase = createSupabaseAdminClient();
    const booking = await fetchBookingById(supabase, id);
    if (!booking) {
      return NextResponse.json(publicApiError("RESOURCE_NOT_FOUND"), { status: 404 });
    }

    if (!booking.paymentLink) {
      return NextResponse.json(publicApiError("PAYMENT_LINK_UNAVAILABLE"), { status: 400 });
    }

    if (!canStartPaymentForBookingStatus(booking.status)) {
      return NextResponse.json(
        publicApiError("PAYMENT_NOT_ALLOWED"),
        { status: 409 },
      );
    }

    if (!body.paymentLinkToken?.trim()) {
      return NextResponse.json(publicApiError("INVALID_REQUEST"), { status: 400 });
    }

    if (booking.paymentLink.token !== body.paymentLinkToken.trim()) {
      return NextResponse.json(publicApiError("PAYMENT_LINK_UNAVAILABLE"), { status: 403 });
    }

    if (isBookingPaymentLinkExpired(booking.paymentLink)) {
      return NextResponse.json(publicApiError("PAYMENT_LINK_EXPIRED"), { status: 409 });
    }

    if (booking.paymentLink.status === "cancelled") {
      return NextResponse.json(publicApiError("PAYMENT_NOT_ALLOWED"), { status: 409 });
    }

    if (booking.paymentLink.status === "paid") {
      return NextResponse.json(publicApiError("PAYMENT_ALREADY_COMPLETED"), { status: 409 });
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

    if (isPaymentProviderLocked(booking.paymentLink.gateway, "stripe")) {
      return NextResponse.json(publicApiError("PAYMENT_PROVIDER_LOCKED"), { status: 409 });
    }

    let providerBooking = booking;
    if (booking.paymentLink.gateway !== "stripe") {
      const claimTime = nextPaymentBookingUpdatedAt(booking.updatedAt);
      const claimedBooking = normalizeBooking({
        ...booking,
        updatedAt: claimTime,
        paymentLink: {
          ...booking.paymentLink,
          gateway: "stripe",
        },
      });
      const claimResult = await updateBookingRecord(
        supabase,
        claimedBooking,
        booking.updatedAt,
      );
      if ("error" in claimResult) {
        addPaymentBreadcrumb("stripe.checkout_session.claim_failed", {
          bookingId: booking.id,
          error: claimResult.error,
        });
        return NextResponse.json(publicApiError("PAYMENT_PROCESSING_FAILED"), {
          status: claimResult.status ?? 500,
        });
      }
      providerBooking = claimResult.booking;
    }

    const session = await createCheckoutSession(providerBooking, {
      secretKey,
      idempotencyKey: buildPaymentCheckoutIdempotencyKey({
        provider: "stripe",
        bookingId: providerBooking.id,
        paymentLinkToken: providerBooking.paymentLink!.token,
        amountUsd: providerBooking.paymentLink!.amountUsd,
        currency: providerBooking.metadata?.checkoutCurrency ?? "USD",
      }),
    });
    addPaymentBreadcrumb("stripe.checkout_session.created", {
      bookingId: booking.id,
      sessionId: session.sessionId,
    });

    const now = nextPaymentBookingUpdatedAt(providerBooking.updatedAt);
    const updatedBooking = normalizeBooking({
      ...providerBooking,
      updatedAt: now,
      paymentLink: {
        ...providerBooking.paymentLink!,
        gateway: "stripe",
        sessionId: session.sessionId,
        checkoutUrl: session.checkoutUrl,
        sessionCreatedAt: now,
      },
    });

    const updateResult = await updateBookingRecord(
      supabase,
      updatedBooking,
      providerBooking.updatedAt,
    );
    if ("error" in updateResult) {
      addPaymentBreadcrumb("stripe.checkout_session.persist_failed", {
        bookingId: booking.id,
        error: updateResult.error,
      });
      return NextResponse.json(publicApiError("PAYMENT_PROCESSING_FAILED"), {
        status: updateResult.status ?? 500,
      });
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
    return NextResponse.json(publicApiError("PAYMENT_PROCESSING_FAILED"), { status: 500 });
  }
}
