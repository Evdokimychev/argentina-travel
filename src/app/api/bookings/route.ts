import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { isSupabaseBookingsEnabled } from "@/lib/auth-mode";
import {
  attachGuestBookingsToCurrentUser,
  insertCanonicalBookingAtomically,
} from "@/lib/bookings-server";
import { addBookingBreadcrumb, captureException } from "@/lib/monitoring/sentry";
import { getClientIp, withRateLimit } from "@/lib/rate-limit";
import { loadSessionUserFromSupabase } from "@/lib/supabase-auth-provider";
import { ensureAvailabilitySlotForBooking } from "@/lib/tour-availability-server";
import {
  BookingCommandError,
  buildCanonicalBooking,
  parseCreateBookingCommand,
} from "@/lib/booking-create-server";
import { notifyBookingCreatedEmail } from "@/lib/bookings-notify";
import { verifyGuestFormProtection } from "@/lib/forms/captcha-server";
import { fetchSiteNavigation } from "@/lib/site-settings-server";
import { publicBookingError } from "@/lib/partner-booking/public-errors";

async function postBooking(request: Request) {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json(publicBookingError("BOOKING_SERVICE_UNAVAILABLE"), { status: 503 });
  }

  try {
    const body = (await request.json()) as {
      command?: unknown;
      captchaToken?: string;
      company?: string;
    };
    const protection = await verifyGuestFormProtection({
      request,
      formId: "native_booking",
      captchaToken: body.captchaToken,
      honeypot: body.company,
    });
    if (!protection.ok) {
      if (protection.kind === "configuration") {
        return NextResponse.json(
          publicBookingError("BOOKING_VERIFICATION_UNAVAILABLE"),
          { status: 503 },
        );
      }
      return NextResponse.json(
        publicBookingError("BOOKING_VERIFICATION_FAILED"),
        { status: 400 },
      );
    }
    const command = parseCreateBookingCommand(body.command);

    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    const admin = createSupabaseAdminClient();
    const canonical = await buildCanonicalBooking(admin, command, authUser?.id);
    const navigation = await fetchSiteNavigation();
    const productEnabled =
      canonical.productKind === "excursion"
        ? navigation.showExcursions
        : navigation.showTours;
    if (!productEnabled) {
      return NextResponse.json({ error: "Раздел временно недоступен." }, { status: 404 });
    }
    const booking = canonical.booking;

    addBookingBreadcrumb("booking.create.requested", {
      bookingId: booking.id,
      userId: booking.userId,
      tourSlug: booking.tourSlug,
    });

    if (canonical.reservationSlotDate) {
      const slotReady = await ensureAvailabilitySlotForBooking(admin, {
        tourId: booking.tourId,
        tourSlug: booking.tourSlug,
        startDate: canonical.reservationSlotDate,
      });
      if (!slotReady) {
        return NextResponse.json(
          publicBookingError("BOOKING_AVAILABILITY_UNAVAILABLE"),
          { status: 409 },
        );
      }
    }
    if (authUser) {
      await attachGuestBookingsToCurrentUser(supabase);
    }
    const result = await insertCanonicalBookingAtomically(admin, {
      booking,
      organizerUserId: canonical.organizerUserId,
      slotDate: canonical.reservationSlotDate,
    });
    if ("error" in result) {
      addBookingBreadcrumb("booking.create.failed", {
        bookingId: booking.id,
        error: result.error,
      });
      const status = result.status ?? 500;
      return status >= 500
        ? NextResponse.json(publicBookingError("BOOKING_SERVICE_UNAVAILABLE"), { status: 503 })
        : NextResponse.json({ error: result.error }, { status });
    }

    if (result.created) {
      void notifyBookingCreatedEmail({
        userId: authUser?.id,
        bookingId: result.booking.id,
        tourTitle: result.booking.tourTitle,
        contactEmail: result.booking.contactEmail,
        contactName: result.booking.contactName,
        guests: result.booking.guests,
        startDate: result.booking.startDate,
        endDate: result.booking.endDate,
      });
    }

    addBookingBreadcrumb("booking.created", {
      bookingId: result.booking.id,
      userId: result.booking.userId,
      status: result.booking.status,
    });
    return NextResponse.json({ booking: { id: result.booking.id } });
  } catch (error) {
    addBookingBreadcrumb("booking.create.failed", {
      error: error instanceof Error ? error.message : "Unexpected error",
    });
    captureException(error, { tags: { area: "booking", action: "create" } });
    if (error instanceof BookingCommandError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(publicBookingError("BOOKING_SERVICE_UNAVAILABLE"), {
      status: 503,
    });
  }
}

export const POST = withRateLimit(postBooking, {
  limit: 10,
  window: 60_000,
  keyPrefix: "bookings:create",
  key: (request) => `ip:${getClientIp(request)}`,
  message: "Слишком много попыток бронирования. Повторите позже.",
});

export async function GET() {
  if (!isSupabaseBookingsEnabled()) {
    return NextResponse.json({ error: "Bookings API unavailable" }, { status: 503 });
  }

  try {
    const supabase = await createSupabaseServerClient();
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser();

    if (!authUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessionUser = await loadSessionUserFromSupabase(supabase);
    if (!sessionUser) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const { attachGuestBookingsToCurrentUser, fetchUserBookings } = await import("@/lib/bookings-server");
    await attachGuestBookingsToCurrentUser(supabase);
    const byUserId = await fetchUserBookings(supabase, authUser.id);

    return NextResponse.json({
      bookings: byUserId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected error" },
      { status: 500 }
    );
  }
}
