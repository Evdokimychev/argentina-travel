import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { fetchBookingById, updateBookingRecord } from "@/lib/bookings-server";
import { isBookingPaymentLinkExpired } from "@/lib/booking-payment-link";
import { normalizeBooking } from "@/lib/bookings-store";
import { addPaymentBreadcrumb, captureException } from "@/lib/monitoring/sentry";
import { createPreference } from "@/lib/payments/mercadopago-client";
import {
  buildPaymentCheckoutIdempotencyKey,
  canStartPaymentForBookingStatus,
  isPaymentProviderLocked,
  nextPaymentBookingUpdatedAt,
} from "@/lib/payments/payment-integrity";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publicApiError } from "@/lib/public-api/safe-error";
import { rejectIfOwnPaymentDisabled } from "@/lib/payments/own-payment-gate";

type CreatePreferenceBody = {
  paymentLinkToken?: string;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json(publicApiError("SERVICE_UNAVAILABLE"), { status: 503 });
  }

  const ownPaymentBlocked = rejectIfOwnPaymentDisabled();
  if (ownPaymentBlocked) return ownPaymentBlocked;

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return NextResponse.json(publicApiError("PAYMENT_UNAVAILABLE"), { status: 503 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as CreatePreferenceBody;

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
      booking.paymentLink.gateway === "mercadopago" &&
      booking.paymentLink.preferenceId &&
      booking.paymentLink.checkoutUrl
    ) {
      return NextResponse.json({
        preferenceId: booking.paymentLink.preferenceId,
        checkoutUrl: booking.paymentLink.checkoutUrl,
        checkoutSandboxUrl: booking.paymentLink.checkoutSandboxUrl ?? null,
      });
    }

    if (isPaymentProviderLocked(booking.paymentLink.gateway, "mercadopago")) {
      return NextResponse.json(publicApiError("PAYMENT_PROVIDER_LOCKED"), { status: 409 });
    }

    let providerBooking = booking;
    if (booking.paymentLink.gateway !== "mercadopago") {
      const claimTime = nextPaymentBookingUpdatedAt(booking.updatedAt);
      const claimedBooking = normalizeBooking({
        ...booking,
        updatedAt: claimTime,
        paymentLink: {
          ...booking.paymentLink,
          gateway: "mercadopago",
        },
      });
      const claimResult = await updateBookingRecord(
        supabase,
        claimedBooking,
        booking.updatedAt,
      );
      if ("error" in claimResult) {
        addPaymentBreadcrumb("mercadopago.preference.claim_failed", {
          bookingId: booking.id,
          error: claimResult.error,
        });
        return NextResponse.json(publicApiError("PAYMENT_PROCESSING_FAILED"), {
          status: claimResult.status ?? 500,
        });
      }
      providerBooking = claimResult.booking;
    }

    const preference = await createPreference(providerBooking, {
      accessToken,
      idempotencyKey: buildPaymentCheckoutIdempotencyKey({
        provider: "mercadopago",
        bookingId: providerBooking.id,
        paymentLinkToken: providerBooking.paymentLink!.token,
        amountUsd: providerBooking.paymentLink!.amountUsd,
        currency: providerBooking.metadata?.checkoutCurrency ?? "USD",
      }),
    });
    addPaymentBreadcrumb("mercadopago.preference.created", {
      bookingId: booking.id,
      preferenceId: preference.preferenceId,
    });

    const now = nextPaymentBookingUpdatedAt(providerBooking.updatedAt);
    const updatedBooking = normalizeBooking({
      ...providerBooking,
      updatedAt: now,
      paymentLink: {
        ...providerBooking.paymentLink!,
        gateway: "mercadopago",
        preferenceId: preference.preferenceId,
        checkoutUrl: preference.checkoutUrl,
        checkoutSandboxUrl: preference.sandboxCheckoutUrl,
        preferenceCreatedAt: now,
      },
    });

    const updateResult = await updateBookingRecord(
      supabase,
      updatedBooking,
      providerBooking.updatedAt,
    );
    if ("error" in updateResult) {
      addPaymentBreadcrumb("mercadopago.preference.persist_failed", {
        bookingId: booking.id,
        error: updateResult.error,
      });
      return NextResponse.json(publicApiError("PAYMENT_PROCESSING_FAILED"), {
        status: updateResult.status ?? 500,
      });
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
    return NextResponse.json(publicApiError("PAYMENT_PROCESSING_FAILED"), { status: 500 });
  }
}
