import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { canAccessBooking } from "@/lib/bookings-server";
import type { Booking } from "@/types/tourist";
import type { SessionUser } from "@/types/user";

const booking = {
  id: "booking-1",
  userId: "tourist-1",
  contactEmail: "tourist@example.com",
  tourSlug: "native-tour",
} as Booking;

function user(id: string, roles: SessionUser["roles"], email = `${id}@example.com`): SessionUser {
  return { id, email, roles, role: roles[0] ?? "tourist" } as SessionUser;
}

describe("booking access security", () => {
  it("allows the booking owner", () => {
    expect(canAccessBooking(booking, user("tourist-1", ["tourist"]))).toBe(true);
  });

  it("does not treat a profile admin role as booking-wide access", () => {
    expect(canAccessBooking(booking, user("limited-staff", ["admin"]))).toBe(false);
  });

  it("requires operations.bookings capability for the sandbox staff override", () => {
    const route = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/app/api/bookings/[id]/payment/sandbox/route.ts",
      ),
      "utf8",
    );

    expect(route).toContain("resolveAdminCapabilitiesWithClient");
    expect(route).toContain('hasAdminCapability(staff?.capabilities, "operations.bookings")');
    expect(route).not.toContain('userHasAccountRole(sessionUser, "admin")');
  });
});
