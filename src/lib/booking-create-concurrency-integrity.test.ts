import { describe, expect, it, vi } from "vitest";
import { insertCanonicalBookingAtomically } from "@/lib/bookings-server";
import { bookingToRow } from "@/lib/bookings-db-mapper";
import type { Booking } from "@/types/tourist";

function baseBooking(): Booking {
  return {
    id: "booking-concurrency-1",
    userId: "actor-1",
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

describe("booking create concurrency integrity", () => {
  it("maps a lost inventory race to 409 without inventing a booking", async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: null,
        error: { message: "BOOKING_SLOT_CAPACITY: no seats left" },
      })),
    };

    const result = await insertCanonicalBookingAtomically(client as never, {
      booking: baseBooking(),
      organizerUserId: "organizer-1",
      slotDate: "2026-12-20",
    });

    expect(result).toEqual({
      error: "На выбранную дату уже недостаточно мест.",
      status: 409,
    });
    expect(client.rpc).toHaveBeenCalledTimes(1);
  });

  it("maps idempotency key reuse under parallel double-submit to 409", async () => {
    const client = {
      rpc: vi.fn(async () => ({
        data: null,
        error: { message: "IDEMPOTENCY_KEY_REUSED" },
      })),
    };

    const [first, second] = await Promise.all([
      insertCanonicalBookingAtomically(client as never, {
        booking: baseBooking(),
        organizerUserId: "organizer-1",
        slotDate: "2026-12-20",
      }),
      insertCanonicalBookingAtomically(client as never, {
        booking: baseBooking(),
        organizerUserId: "organizer-1",
        slotDate: "2026-12-20",
      }),
    ]);

    expect(first).toEqual({
      error: "Эта форма уже использовалась для другой заявки. Обновите страницу.",
      status: 409,
    });
    expect(second).toEqual(first);
    expect(client.rpc).toHaveBeenCalledTimes(2);
  });

  it("returns only one created=true when the RPC serializes a double create", async () => {
    const stored = baseBooking();
    let calls = 0;
    const client = {
      rpc: vi.fn(async () => {
        calls += 1;
        return {
          data: {
            booking: bookingToRow(stored),
            created: calls === 1,
          },
          error: null,
        };
      }),
    };

    const results = await Promise.all([
      insertCanonicalBookingAtomically(client as never, {
        booking: stored,
        organizerUserId: "organizer-1",
        slotDate: "2026-12-20",
      }),
      insertCanonicalBookingAtomically(client as never, {
        booking: stored,
        organizerUserId: "organizer-1",
        slotDate: "2026-12-20",
      }),
    ]);

    const createdFlags = results.map((result) =>
      "created" in result ? result.created : null,
    );
    expect(createdFlags.filter((flag) => flag === true)).toHaveLength(1);
    expect(createdFlags.filter((flag) => flag === false)).toHaveLength(1);
  });
});
