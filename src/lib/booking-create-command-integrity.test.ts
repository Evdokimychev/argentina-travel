import { describe, expect, it } from "vitest";
import { BookingCommandError, parseCreateBookingCommand } from "./booking-create-server";

const baseCommand = {
  tourId: "tour-1",
  startDate: "2026-12-20",
  travelers: { adults: 2 },
  customer: { name: "Тест", email: "test@example.com" },
  idempotencyKey: "0123456789abcdef",
};

describe("booking command tampering", () => {
  it("drops client-owned price, organizer, commission and payment fields", () => {
    const command = parseCreateBookingCommand({
      ...baseCommand,
      totalPriceUsd: 1,
      currency: "ARS",
      organizerId: "attacker",
      commission: 0,
      paymentStatus: "paid",
      status: "completed",
    });

    expect(command).not.toHaveProperty("totalPriceUsd");
    expect(command).not.toHaveProperty("currency");
    expect(command).not.toHaveProperty("organizerId");
    expect(command).not.toHaveProperty("commission");
    expect(command).not.toHaveProperty("paymentStatus");
    expect(command).not.toHaveProperty("status");
  });

  it("rejects an unverified promo code instead of trusting its discount", () => {
    expect(() => parseCreateBookingCommand({ ...baseCommand, promoCode: "FREE100" })).toThrow(
      BookingCommandError,
    );
  });
});
