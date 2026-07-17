import { describe, expect, it } from "vitest";
import { normalizeRemoteBookingTravelers, TravelersFormError } from "@/lib/booking-travelers-server";

describe("remote booking travelers form", () => {
  it("normalizes exactly the expected number of travelers", () => {
    const result = normalizeRemoteBookingTravelers([
      { fullName: " Анна Петрова ", dateOfBirth: "1990-05-12", email: "ANNA@example.com" },
      { fullName: "Иван Петров", dateOfBirth: "1988-01-30" },
    ], 2);
    expect(result).toHaveLength(2);
    expect(result[0]?.email).toBe("anna@example.com");
    expect(result[0]?.id).toBe("guest-1");
  });

  it("rejects missing travelers and invalid dates", () => {
    expect(() => normalizeRemoteBookingTravelers([], 2)).toThrow(TravelersFormError);
    expect(() => normalizeRemoteBookingTravelers([
      { fullName: "Анна Петрова", dateOfBirth: "2030-01-01" },
    ], 1)).toThrow("Проверьте ФИО и дату рождения");
  });

  it("caps sensitive free-text fields", () => {
    const [traveler] = normalizeRemoteBookingTravelers([
      {
        fullName: "Анна Петрова",
        dateOfBirth: "1990-05-12",
        passportNumber: "4510 123456",
        dietaryRestrictions: "x".repeat(700),
      },
    ], 1);
    expect(traveler?.passportNumber).toBeUndefined();
    expect(traveler?.dietaryRestrictions).toHaveLength(500);
  });
});
