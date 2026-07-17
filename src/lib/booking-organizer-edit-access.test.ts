import { describe, expect, it } from "vitest";
import { getOrganizerBookingEditAvailability } from "@/lib/booking-organizer-edit-access";

describe("organizer booking edit availability", () => {
  it("keeps local demo editing available", () => {
    expect(getOrganizerBookingEditAvailability(false)).toEqual({
      canEdit: true,
      notice: null,
    });
  });

  it("blocks local-only editing for remote bookings", () => {
    const availability = getOrganizerBookingEditAvailability(true);

    expect(availability.canEdit).toBe(false);
    expect(availability.notice).toContain("защищены от ручного изменения");
  });
});
