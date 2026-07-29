import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { fetchBookingByPaymentLinkToken } from "@/lib/bookings-server";
import { isBookingPaymentLinkExpired } from "@/lib/booking-payment-link";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import { fetchLatestChargeReceiptForBooking } from "@/lib/payments/transaction-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { publicApiError } from "@/lib/public-api/safe-error";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json(publicApiError("SERVICE_UNAVAILABLE"), { status: 503 });
  }

  const { token } = await context.params;
  const normalizedToken = token?.trim();
  if (!normalizedToken) {
    return NextResponse.json(publicApiError("INVALID_REQUEST"), { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const booking = await fetchBookingByPaymentLinkToken(supabase, normalizedToken);
    if (!booking?.paymentLink) {
      return NextResponse.json(publicApiError("PAYMENT_LINK_UNAVAILABLE"), { status: 404 });
    }

    const link = booking.paymentLink;
    const paymentStatus = resolveBookingPaymentStatus(booking);
    const expired = isBookingPaymentLinkExpired(link);
    const receipt =
      paymentStatus === "paid" || paymentStatus === "partial"
        ? await fetchLatestChargeReceiptForBooking(supabase, booking.id)
        : null;

    return NextResponse.json({
      bookingId: booking.id,
      tourTitle: booking.tourTitle,
      contactName: booking.contactName,
      paymentStatus,
      linkStatus: link.status,
      amountUsd: link.amountUsd,
      expired,
      paidAt: link.paidAt ?? receipt?.paidAt ?? null,
      receipt,
      booking: {
        id: booking.id,
        tourTitle: booking.tourTitle,
        contactName: booking.contactName,
        contactEmail: booking.contactEmail,
        paymentLink: link,
        metadata: booking.metadata?.checkoutCurrency
          ? { checkoutCurrency: booking.metadata.checkoutCurrency }
          : undefined,
      },
    });
  } catch {
    return NextResponse.json(publicApiError("SERVICE_UNAVAILABLE"), { status: 503 });
  }
}
