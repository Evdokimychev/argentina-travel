import { describe, expect, it } from "vitest";
import {
  partnerTransitionMessage,
  partnerTransitionTitle,
} from "@/lib/booking/partner-handoff-copy";

describe("partner booking transition copy", () => {
  it("does not claim an order exists for affiliate fallback", () => {
    const message = partnerTransitionMessage({
      outcome: "partner_handoff",
      productType: "tour",
      partnerLabel: "Tripster",
    });

    expect(partnerTransitionTitle("partner_handoff")).toBe("Продолжите у партнёра");
    expect(message).toContain("ещё не создан");
    expect(message).not.toContain("Спасибо за бронирование");
  });

  it("states partner ownership after a confirmed partner order", () => {
    expect(
      partnerTransitionMessage({
        outcome: "order_created",
        productType: "excursion",
        partnerLabel: "Tripster",
      })
    ).toContain("создан у Tripster");
  });
});
