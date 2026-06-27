import { describe, expect, it } from "vitest";
import { buildExcursionBookingConditions } from "@/lib/tripster/booking-conditions";

describe("buildExcursionBookingConditions", () => {
  it("includes pricing rules from priceDescription", () => {
    const conditions = buildExcursionBookingConditions({
      quote: null,
      priceDescription: "$150 за 1–3 человек или $45 с человека, если больше",
    });

    expect(conditions.items[0]).toEqual({
      kind: "custom",
      text: "$150 за 1–3 человек или $45 с человека, если больше",
    });
  });

  it("includes prepayment percents from quote", () => {
    const conditions = buildExcursionBookingConditions({
      quote: {
        value: 150,
        pre_pay: 33,
        payment_to_guide: 117,
      },
    });

    expect(conditions.items.some((item) => item.kind === "prepayment")).toBe(true);
    const prepayment = conditions.items.find((item) => item.kind === "prepayment");
    expect(prepayment?.prepaymentPercent).toBe(22);
    expect(prepayment?.restPercent).toBe(78);
  });
});
