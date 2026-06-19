import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { fetchBookingByPaymentLinkToken } from "@/lib/bookings-server";
import { isBookingPaymentLinkExpired } from "@/lib/booking-payment-link";
import { resolveBookingPaymentStatus } from "@/lib/booking-params";
import { fetchLatestChargeReceiptForBooking } from "@/lib/payments/transaction-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  const { token } = await context.params;
  const normalizedToken = token?.trim();
  if (!normalizedToken) {
    return NextResponse.json({ error: "Invalid payment link token" }, { status: 400 });
  }

  try {
    const supabase = createSupabaseAdminClient();
    const booking = await fetchBookingByPaymentLinkToken(supabase, normalizedToken);
    if (!booking?.paymentLink) {
      return NextResponse.json({ error: "Payment link not found" }, { status: 404 });
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
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unexpected error while loading payment link status",
      },
      { status: 500 }
    );
  }
}
