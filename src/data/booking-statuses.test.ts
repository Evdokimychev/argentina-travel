import { describe, expect, it } from "vitest";
import {
  BOOKING_STATUS_TONE,
  getVisibleBookingStatusLabel,
} from "@/data/booking-statuses";

describe("canonical booking status presentation", () => {
  it.each([
    ["waiting_payment", "Ожидает оплаты"],
    ["paid", "Оплачена"],
  ] as const)("does not collapse %s into pending", (status, label) => {
    expect(getVisibleBookingStatusLabel(status)).toBe(label);
    expect(BOOKING_STATUS_TONE[status]).not.toBe(BOOKING_STATUS_TONE.pending);
  });
});
