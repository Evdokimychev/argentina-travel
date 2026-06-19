import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { fetchBookingById, updateBookingRecord } from "@/lib/bookings-server";
import { isBookingPaymentLinkExpired } from "@/lib/booking-payment-link";
import { normalizeBooking } from "@/lib/bookings-store";
import { addPaymentBreadcrumb, captureException } from "@/lib/monitoring/sentry";
import { createPreference } from "@/lib/payments/mercadopago-client";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

type CreatePreferenceBody = {
  paymentLinkToken?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return NextResponse.json(
      {
        error:
          "Mercado Pago is not configured. Set MERCADOPAGO_ACCESS_TOKEN to create checkout preferences.",
      },
      { status: 503 }
    );
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as CreatePreferenceBody;

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

    if (booking.paymentLink.preferenceId && booking.paymentLink.checkoutUrl) {
      return NextResponse.json({
        preferenceId: booking.paymentLink.preferenceId,
        checkoutUrl: booking.paymentLink.checkoutUrl,
        checkoutSandboxUrl: booking.paymentLink.checkoutSandboxUrl ?? null,
      });
    }

    const preference = await createPreference(booking, {
      accessToken,
      baseUrl: new URL(request.url).origin,
      idempotencyKey: `booking-${booking.id}-${Date.now().toString(36)}`,
    });
    addPaymentBreadcrumb("mercadopago.preference.created", {
      bookingId: booking.id,
      preferenceId: preference.preferenceId,
    });

    const now = new Date().toISOString();
    const updatedBooking = normalizeBooking({
      ...booking,
      updatedAt: now,
      paymentLink: {
        ...booking.paymentLink,
        gateway: "mercadopago",
        preferenceId: preference.preferenceId,
        checkoutUrl: preference.checkoutUrl,
        checkoutSandboxUrl: preference.sandboxCheckoutUrl,
        preferenceCreatedAt: now,
      },
    });

    const updateResult = await updateBookingRecord(supabase, updatedBooking);
    if ("error" in updateResult) {
      addPaymentBreadcrumb("mercadopago.preference.persist_failed", {
        bookingId: booking.id,
        error: updateResult.error,
      });
      return NextResponse.json({ error: updateResult.error }, { status: 500 });
    }

    return NextResponse.json({
      preferenceId: preference.preferenceId,
      checkoutUrl: preference.checkoutUrl,
      checkoutSandboxUrl: preference.sandboxCheckoutUrl ?? null,
    });
  } catch (error) {
    addPaymentBreadcrumb("mercadopago.preference.failed", {
      bookingId: id,
      error: error instanceof Error ? error.message : "Unexpected error",
    });
    captureException(error, {
      tags: { area: "payments", provider: "mercadopago", action: "create_preference" },
      extra: { bookingId: id },
    });
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while creating Mercado Pago preference",
      },
      { status: 500 }
    );
  }
}
