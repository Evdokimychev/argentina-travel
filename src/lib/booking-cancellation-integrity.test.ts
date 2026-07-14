import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const ROOT = process.cwd();

describe("booking cancellation inventory integrity", () => {
  it("cancels the booking and releases seats through one database function", () => {
    const migration = readFileSync(
      `${ROOT}/supabase/migrations/20260714234321_atomic_booking_cancellation.sql`,
      "utf8",
    );
    const route = readFileSync(`${ROOT}/src/app/api/bookings/[id]/route.ts`, "utf8");
    const expiryRoute = readFileSync(
      `${ROOT}/src/app/api/cron/bookings/expire-unpaid/route.ts`,
      "utf8",
    );

    expect(migration).toContain("for update");
    expect(migration).toContain("booked_count = greatest(0, booked_count - greatest(1, v_booking.guests))");
    expect(migration).toContain("set status = 'cancelled'");
    expect(migration).toContain("grant execute on function public.cancel_booking_with_reservation_release");
    expect(route).toContain("cancelBookingAndReleaseReservation(");
    expect(route).not.toContain("releaseTourSlotReservation(");
    expect(expiryRoute).toContain('.eq("status", "waiting_payment")');
    expect(expiryRoute).toContain('.eq("payment_status", "pending")');
    expect(expiryRoute).toContain('note: "Истёк срок оплаты"');
    expect(expiryRoute).toContain("cancelBookingAndReleaseReservation(");
  });
});
