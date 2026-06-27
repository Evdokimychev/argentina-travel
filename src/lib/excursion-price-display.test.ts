import { describe, expect, it } from "vitest";
import {
  estimateExcursionBookingPriceUsd,
  isExcursionBookingPriceEstimate,
  resolveExcursionBookingPreviewPrepaymentHint,
  resolveExcursionBookingPreviewPrice,
  resolveExcursionBookingPriceUsd,
  stripExcursionPriceFromPrefix,
} from "@/lib/excursion-price-display";

describe("excursion booking preview price", () => {
  it("strips from-prefix from catalog labels", () => {
    expect(stripExcursionPriceFromPrefix("от $150")).toBe("$150");
  });

  it("prefers exact quote value over catalog from-price", () => {
    expect(
      resolveExcursionBookingPreviewPrice({
        quote: { value: 150, currency: "USD", value_string: "от $150" },
        priceDisplay: "от $150",
      })
    ).toBe("$150");
  });

  it("builds prepayment hint from quote", () => {
    const hint = resolveExcursionBookingPreviewPrepaymentHint(
      { value: 150, pre_pay: 33, payment_to_guide: 117 },
      (key) =>
        key === "excursions.bookingConditions.prepayment"
          ? "Предоплата {prepay}% на сайте, остальные {rest}% — организатору напрямую"
          : key
    );

    expect(hint).toBe(
      "Предоплата 22% на сайте, остальные 78% — организатору напрямую"
    );
  });
});

describe("excursion booking sidebar price", () => {
  const perPersonExcursion = {
    priceValue: 45,
    priceCurrency: "USD",
    priceUnit: "per_person" as const,
  };

  const perExcursionExcursion = {
    priceValue: 150,
    priceCurrency: "USD",
    priceUnit: "per_excursion" as const,
  };

  it("scales per-person listing price by guest count", () => {
    expect(estimateExcursionBookingPriceUsd(perPersonExcursion, 3)).toBe(135);
  });

  it("keeps flat price for per-excursion listings", () => {
    expect(estimateExcursionBookingPriceUsd(perExcursionExcursion, 4)).toBe(150);
  });

  it("uses confirmed quote only when request params match", () => {
    expect(
      resolveExcursionBookingPriceUsd({
        excursion: perPersonExcursion,
        persons: 2,
        quote: { value: 90, currency: "USD" },
        quoteMatchesRequest: true,
      })
    ).toBe(90);

    expect(
      resolveExcursionBookingPriceUsd({
        excursion: perPersonExcursion,
        persons: 3,
        quote: { value: 90, currency: "USD" },
        quoteMatchesRequest: false,
      })
    ).toBe(135);
  });

  it("marks price as estimate while quote is stale or loading", () => {
    expect(
      isExcursionBookingPriceEstimate({
        hasDateAndTime: true,
        quoteMatchesRequest: false,
        quote: { value: 90, currency: "USD" },
      })
    ).toBe(true);

    expect(
      isExcursionBookingPriceEstimate({
        hasDateAndTime: true,
        quoteMatchesRequest: true,
        quote: { value: 90, currency: "USD" },
      })
    ).toBe(false);
  });
});
