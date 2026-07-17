import { describe, expect, it } from "vitest";
import {
  canOrganizerTransitionWaitlistStatus,
  mapRemoteWaitlistEntry,
} from "@/lib/organizer-waitlist-server";
import type { Database } from "@/types/database";

type Row = Database["public"]["Tables"]["tour_waitlist_entries"]["Row"];

const row: Row = {
  id: "w1",
  tour_id: "t1",
  user_id: null,
  email: "guest@example.com",
  contact_name: "Анна",
  contact_phone: "+54 11 0000 0000",
  slot_date: "2026-08-10",
  guests: 2,
  status: "waiting",
  source: "site",
  note: "Готовы подождать",
  status_history: [],
  organizer_comments: [],
  converted_booking_id: null,
  created_at: "2026-07-16T10:00:00.000Z",
  updated_at: "2026-07-16T10:00:00.000Z",
};

describe("organizer remote waitlist", () => {
  it("maps a production row without losing contact and tour data", () => {
    const entry = mapRemoteWaitlistEntry(row, {
      id: "t1",
      slug: "andes",
      title: "По Андам",
      owner_user_id: "organizer-1",
      listing: { image: "/media/tours/andes.webp" },
      approved_listing: null,
    });
    expect(entry.contactEmail).toBe("guest@example.com");
    expect(entry.tourSlug).toBe("andes");
    expect(entry.statusHistory[0]?.to).toBe("waiting");
  });

  it("allows only declared organizer status transitions", () => {
    expect(canOrganizerTransitionWaitlistStatus("waiting", "contacted")).toBe(true);
    expect(canOrganizerTransitionWaitlistStatus("waiting", "converted")).toBe(false);
    expect(canOrganizerTransitionWaitlistStatus("cancelled", "waiting")).toBe(false);
  });
});
