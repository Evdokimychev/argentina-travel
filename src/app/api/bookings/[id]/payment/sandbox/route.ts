import { NextResponse } from "next/server";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import { bookingMatchesContactEmail } from "@/lib/guest-booking";
import { fetchBookingById } from "@/lib/bookings-server";
import { assertPaymentSandboxAllowed } from "@/lib/payments/sandbox-mode";
import { simulateSandboxPayment } from "@/lib/payments/sandbox-payment-server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { userHasAccountRole } from "@/types/user";

type SandboxPaymentBody = {
  asPartial?: boolean;
  amountUsd?: number;
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const guard = assertPaymentSandboxAllowed();
  if (!guard.ok) {
    return NextResponse.json({ error: guard.reason }, { status: 403 });
  }

  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  const { id: bookingId } = await context.params;

  try {
    const supabase = await createSupabaseServerClient();
    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const booking = await fetchBookingById(supabase, bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isOwner =
      booking.userId === sessionUser.id ||
      bookingMatchesContactEmail(booking, sessionUser.email);
    const isAdmin = userHasAccountRole(sessionUser, "admin");

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let body: SandboxPaymentBody = {};
    try {
      body = (await request.json()) as SandboxPaymentBody;
    } catch {
      body = {};
    }

    const admin = createSupabaseAdminClient();
    const result = await simulateSandboxPayment(admin, bookingId, {
      asPartial: body.asPartial === true,
      amountUsd:
        typeof body.amountUsd === "number" && Number.isFinite(body.amountUsd)
          ? body.amountUsd
          : undefined,
    });

    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      booking: result.booking,
      paymentStatus: result.paymentStatus,
      amountUsd: result.amountUsd,
      externalId: result.externalId,
      sandbox: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unexpected error while simulating payment",
      },
      { status: 500 }
    );
  }
}
