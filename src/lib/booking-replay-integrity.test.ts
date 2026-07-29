import { describe, expect, it, vi } from "vitest";
import { bookingToRow } from "@/lib/bookings-db-mapper";
import { insertCanonicalBookingAtomically } from "@/lib/bookings-server";
import type { Booking } from "@/types/tourist";

function booking(userId: string): Booking {
  return {
    id: "booking-replay-integrity",
    userId,
    organizerUserId: "organizer-1",
    organizerTourId: "tour-1",
    tourId: "tour-1",
    tourSlug: "native-tour",
    tourTitle: "Канонический тур",
    tourImage: "/tour.jpg",
    status: "new",
    guests: 2,
    startDate: "2026-12-20",
    totalPriceUsd: 840,
    contactName: "Иван Иванов",
    contactEmail: "ivan@example.com",
    contactPhone: "+5491112345678",
    organizerComments: [],
    statusHistory: [],
    paymentStatus: "pending",
    travelersFormToken: "private-travelers-token",
    metadata: { requestFingerprint: "same-command" },
    createdAt: "2026-07-29T10:00:00.000Z",
    updatedAt: "2026-07-29T10:00:00.000Z",
  };
}

function replayClient(stored: Booking) {
  return {
    rpc: vi.fn(async () => ({
      data: { booking: bookingToRow(stored), created: false },
      error: null,
    })),
  };
}

describe("booking replay actor integrity", () => {
  it("returns the canonical replay only to the same authenticated actor", async () => {
    const stored = booking("actor-1");
    const client = replayClient(stored);

    const result = await insertCanonicalBookingAtomically(client as never, {
      booking: booking("actor-1"),
      organizerUserId: "organizer-1",
      slotDate: "2026-12-20",
    });

    expect(result).toMatchObject({ created: false, booking: { id: stored.id, userId: "actor-1" } });
  });

  it("rejects an exact replay returned for a different authenticated actor", async () => {
    const client = replayClient(booking("actor-1"));

    const result = await insertCanonicalBookingAtomically(client as never, {
      booking: booking("actor-2"),
      organizerUserId: "organizer-1",
      slotDate: "2026-12-20",
    });

    expect(result).toEqual({
      error: "Эта форма уже использовалась для другой заявки. Обновите страницу.",
      status: 409,
    });
  });

  it("rejects a guest replay after ownership moved to an account", async () => {
    const client = replayClient(booking("account-owner"));

    const result = await insertCanonicalBookingAtomically(client as never, {
      booking: booking("guest-ivan-example-com"),
      organizerUserId: "organizer-1",
      slotDate: "2026-12-20",
    });

    expect(result).toMatchObject({ status: 409 });
    expect(result).not.toHaveProperty("booking");
  });
});
