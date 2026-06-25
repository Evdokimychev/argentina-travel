import { describe, expect, it } from "vitest";
import {
  CAPACITY_REGRESSION_CASES,
  PARTNER_PIPELINE_REGRESSION_CASES,
  PRICE_NORMALIZATION_REGRESSION_CASES,
} from "@/lib/youtravel/__fixtures__/regression-payloads";
import {
  assertDepartureCapacityConsistent,
  assertPriceNormalizationSane,
} from "@/lib/youtravel/partner-invariants";
import {
  mapYouTravelOffersToTourDates,
  normalizeYouTravelPartnerPrice,
  resolveYouTravelPartnerPriceUsd,
} from "@/lib/youtravel/offers-mapper";
import { resolveYouTravelDepartureCapacity } from "@/lib/youtravel/partner-tour-details";
import { convertToUsd } from "@/lib/currency";
import type { CurrencyCode } from "@/types/locale";

describe("YouTravel partner pipeline regressions", () => {
  describe.each(PRICE_NORMALIZATION_REGRESSION_CASES)(
    "price normalization ($id)",
    ({ id, value, currency, expectedCurrency, expectedUsd, bug }) => {
      it(`fixes: ${bug}`, () => {
        const normalized = normalizeYouTravelPartnerPrice(value, currency);
        expect(normalized.currency).toBe(expectedCurrency);

        const priceUsd = resolveYouTravelPartnerPriceUsd(value, currency);
        expect(priceUsd).not.toBeNull();

        if (expectedCurrency === "RUB") {
          expect(priceUsd!).toBeCloseTo(convertToUsd(value, "RUB"), 0);
        } else if (id === "usd-label-rub-scale-37766") {
          expect(priceUsd!).toBeGreaterThan(300);
          expect(priceUsd!).toBeLessThan(600);
        } else {
          expect(priceUsd!).toBeCloseTo(expectedUsd, 0);
        }

        assertPriceNormalizationSane(
          {
            rawValue: value,
            rawCurrency: currency,
            normalizedValue: normalized.value,
            normalizedCurrency: normalized.currency,
            priceUsd,
          },
          id
        );
      });
    }
  );

  describe.each(CAPACITY_REGRESSION_CASES)("capacity ($id)", ({ id, offer, groupMax, expected, bug }) => {
    it(`fixes: ${bug}`, () => {
      const dates = mapYouTravelOffersToTourDates({
        tourId: 1,
        offers: [offer],
        fallbackPriceUsd: 1000,
      });

      expect(dates).toHaveLength(1);
      const date = dates[0];

      expect(date.spotsLeft).toBe(expected.spotsLeft);
      if (expected.seatsTotal != null) {
        expect(date.seatsTotal).toBe(expected.seatsTotal);
      }
      if (expected.travelersGoingCount !== undefined) {
        expect(date.travelersGoingCount).toBe(expected.travelersGoingCount);
      }

      const capacity = resolveYouTravelDepartureCapacity({ groupMax }, date);
      expect(capacity).toEqual(expected.capacity);
      assertDepartureCapacityConsistent(expected.capacity, id);
    });
  });

  describe.each(PARTNER_PIPELINE_REGRESSION_CASES)(
    "full pipeline ($id)",
    ({ id, tourId, groupMax, fallbackPriceUsd, offer, expected, bug }) => {
      it(`fixes: ${bug}`, () => {
        const dates = mapYouTravelOffersToTourDates({
          tourId,
          offers: [offer],
          fallbackPriceUsd,
          fallbackCurrency: offer.currency,
          fallbackPriceValue: offer.priceValue,
        });

        expect(dates).toHaveLength(1);
        const date = dates[0];

        if (expected.partnerPriceCurrency === "USD") {
          expect(date.priceUsd).toBeCloseTo(expected.priceUsd, 0);
        } else {
          expect(date.priceUsd!).toBeGreaterThan(300);
          expect(date.priceUsd!).toBeLessThan(600);
        }

        expect(date.partnerPriceCurrency).toBe(expected.partnerPriceCurrency);
        expect(date.spotsLeft).toBe(expected.spotsLeft);

        const capacity = resolveYouTravelDepartureCapacity({ groupMax }, date);
        expect(capacity).toEqual(expected.capacity);
        assertDepartureCapacityConsistent(expected.capacity, `${id} capacity`);

        assertPriceNormalizationSane(
          {
            rawValue: Number(offer.priceValue),
            rawCurrency: String(offer.currency),
            normalizedValue: date.partnerPriceValue ?? null,
            normalizedCurrency: date.partnerPriceCurrency ?? null,
            priceUsd: date.priceUsd,
          },
          `${id} price`
        );
      });
    }
  );
});
