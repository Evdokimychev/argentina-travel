import { describe, expect, it } from "vitest";
import { buildAvailabilitySlotUpdates } from "@/lib/tour-availability-server";

describe("organizer availability updates", () => {
  it("never includes server-owned booked_count", () => {
    const result = buildAvailabilitySlotUpdates(
      "tour-1",
      [{ date: "2026-08-10", capacity: 12, status: "open" }],
      [{ date: "2026-08-10", bookedCount: 4 }]
    );

    expect(result).toEqual({
      updates: [
        {
          tour_id: "tour-1",
          date: "2026-08-10",
          capacity: 12,
          status: "open",
        },
      ],
    });
    expect(JSON.stringify(result)).not.toContain("booked_count");
  });

  it("rejects capacity below the current booked count", () => {
    expect(
      buildAvailabilitySlotUpdates(
        "tour-1",
        [{ date: "2026-08-10", capacity: 3, status: "open" }],
        [{ date: "2026-08-10", bookedCount: 4 }]
      )
    ).toEqual({
      error: "Вместимость на 2026-08-10 не может быть меньше уже занятых мест (4).",
      status: 409,
    });
  });

  it("fails closed for malformed slots", () => {
    expect(
      buildAvailabilitySlotUpdates("tour-1", [{ date: "tomorrow", capacity: 10 }], [])
    ).toEqual({ error: "Дата слота должна быть в формате YYYY-MM-DD.", status: 400 });
  });
});
