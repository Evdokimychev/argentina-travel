import { describe, expect, it } from "vitest";
import { assertBookingStatusTransition, canTransitionBookingStatus } from "@/lib/booking-state-machine";

describe("booking state machine", () => {
  it("allows the organizer lifecycle", () => {
    expect(canTransitionBookingStatus({ from: "new", to: "pending", actor: "organizer" })).toBe(true);
    expect(canTransitionBookingStatus({ from: "pending", to: "confirmed", actor: "organizer" })).toBe(true);
    expect(canTransitionBookingStatus({ from: "confirmed", to: "completed", actor: "organizer" })).toBe(true);
  });

  it("only lets tourists cancel eligible requests", () => {
    expect(canTransitionBookingStatus({ from: "new", to: "cancelled", actor: "tourist" })).toBe(true);
    expect(canTransitionBookingStatus({ from: "confirmed", to: "completed", actor: "tourist" })).toBe(false);
    expect(canTransitionBookingStatus({ from: "completed", to: "cancelled", actor: "tourist" })).toBe(false);
  });

  it("rejects backward and terminal transitions", () => {
    expect(assertBookingStatusTransition({ from: "confirmed", to: "pending", actor: "organizer" })).toEqual({
      error: "Переход из статуса «confirmed» в «pending» недоступен.",
    });
    expect(canTransitionBookingStatus({ from: "cancelled", to: "new", actor: "system" })).toBe(false);
  });
});
