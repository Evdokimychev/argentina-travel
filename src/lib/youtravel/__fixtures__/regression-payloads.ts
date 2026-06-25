import type { YouTravelOffer } from "@/lib/youtravel/types";
import type { TourListing } from "@/types";

/** Documented real-world-shaped API payloads that caused production bugs. */

export type PriceNormalizationRegressionCase = {
  id: string;
  /** What went wrong in production */
  bug: string;
  value: number;
  currency: string;
  expectedCurrency: string;
  /** Expected USD for catalog filter when value is the sale price */
  expectedUsd: number;
};

export const PRICE_NORMALIZATION_REGRESSION_CASES: PriceNormalizationRegressionCase[] = [
  {
    id: "rub-label-usd-denom-5628",
    bug: "5628 with currency=RUB was shown/converted as RUB (~$56) instead of USD ($5628)",
    value: 5628,
    currency: "RUB",
    expectedCurrency: "USD",
    expectedUsd: 5628,
  },
  {
    id: "rub-label-usd-denom-10050",
    bug: "10050 with currency=RUB was converted to ~$100 instead of treated as USD $10050",
    value: 10050,
    currency: "RUB",
    expectedCurrency: "USD",
    expectedUsd: 10050,
  },
  {
    id: "usd-label-rub-scale-37766",
    bug: "37766 with currency=USD was filtered/displayed as $37766 instead of RUB-scale (~$400)",
    value: 37766.3,
    currency: "USD",
    expectedCurrency: "RUB",
    expectedUsd: 37766.3 / 100, // approximate; tests use convertToUsd with relabeled RUB
  },
  {
    id: "legitimate-usd-489",
    bug: "Regression guard: normal sub-threshold USD must stay USD",
    value: 489,
    currency: "USD",
    expectedCurrency: "USD",
    expectedUsd: 489,
  },
  {
    id: "legitimate-usd-10050",
    bug: "Regression guard: legitimate $10050 USD must not be relabeled as RUB",
    value: 10050,
    currency: "USD",
    expectedCurrency: "USD",
    expectedUsd: 10050,
  },
  {
    id: "legitimate-rub-750000",
    bug: "Regression guard: large RUB amounts above relabel band stay RUB",
    value: 750_000,
    currency: "RUB",
    expectedCurrency: "RUB",
    expectedUsd: 750_000 / 100,
  },
];

export type CapacityRegressionCase = {
  id: string;
  bug: string;
  offer: YouTravelOffer;
  groupMax: number;
  expected: {
    spotsLeft: number;
    seatsTotal?: number;
    travelersGoingCount?: number;
    capacity: { total: number; booked: number; free: number };
  };
};

export const CAPACITY_REGRESSION_CASES: CapacityRegressionCase[] = [
  {
    id: "derive-booked-from-free-55478",
    bug: "«Уже едут» must come from total − free, not travelers_count",
    offer: {
      id: 10,
      startDate: "2026-07-01",
      endDate: "2026-07-13",
      booked_spaces: 5,
      seatsTotal: 14,
      freeSpaces: 9,
      priceValue: 2000,
      currency: "USD",
    },
    groupMax: 14,
    expected: {
      spotsLeft: 9,
      seatsTotal: 14,
      travelersGoingCount: 5,
      capacity: { total: 14, booked: 5, free: 9 },
    },
  },
  {
    id: "ignore-travelers-count-when-all-free",
    bug: "travelers_count/participants_count mistaken for booked when every seat is free",
    offer: {
      id: 11,
      startDate: "2026-08-01",
      endDate: "2026-08-13",
      travelers_count: 8,
      participants_count: 8,
      seatsTotal: 8,
      freeSpaces: 8,
      priceValue: 2000,
      currency: "USD",
    },
    groupMax: 8,
    expected: {
      spotsLeft: 8,
      seatsTotal: 8,
      travelersGoingCount: 0,
      capacity: { total: 8, booked: 0, free: 8 },
    },
  },
  {
    id: "dedicated-booked-without-free",
    bug: "When only booked_spaces is present, free must be total − booked",
    offer: {
      id: 12,
      startDate: "2026-09-01",
      endDate: "2026-09-10",
      booked_spaces: 3,
      seatsTotal: 10,
      priceValue: 1500,
      currency: "USD",
    },
    groupMax: 10,
    expected: {
      spotsLeft: 7,
      seatsTotal: 10,
      travelersGoingCount: 3,
      capacity: { total: 10, booked: 3, free: 7 },
    },
  },
  {
    id: "seats-total-not-free-default",
    bug: "seatsTotal alone must not be treated as free spots (spotsLeft should be 0)",
    offer: {
      id: 13,
      startDate: "2026-10-01",
      endDate: "2026-10-08",
      seatsTotal: 12,
      priceValue: 900,
      currency: "USD",
    },
    groupMax: 12,
    expected: {
      spotsLeft: 0,
      seatsTotal: 12,
      travelersGoingCount: undefined,
      capacity: { total: 12, booked: 12, free: 0 },
    },
  },
];

export type CatalogPriceFilterRegressionCase = {
  id: string;
  bug: string;
  listing: Partial<TourListing> & Pick<TourListing, "id" | "slug">;
  filterCurrency: "USD" | "RUB";
  priceMin: number;
  priceMax: number;
  shouldMatch: boolean;
};

export const CATALOG_PRICE_FILTER_REGRESSION_CASES: CatalogPriceFilterRegressionCase[] = [
  {
    id: "youtravel-mislabeled-rub-in-rub-slider",
    bug: "Partner tour with 5628 RUB label must participate in RUB price filter as ~5628 USD equivalent",
    listing: {
      id: "yt-5628",
      slug: "patagonia-yt5628",
      partnerSource: "youtravel",
      partnerPriceValue: 5628,
      partnerPriceCurrency: "RUB",
      priceUsd: 5628,
      availableDates: [{ start: "2026-07-01", end: "2026-07-10", spotsLeft: 4 }],
    },
    filterCurrency: "RUB",
    priceMin: 400_000,
    priceMax: 600_000,
    shouldMatch: true,
  },
  {
    id: "youtravel-mislabeled-rub-excluded-narrow-band",
    bug: "Mislabeled 5628 RUB must be excluded when slider max is below USD-equivalent display price",
    listing: {
      id: "yt-5628",
      slug: "patagonia-yt5628",
      partnerSource: "youtravel",
      partnerPriceValue: 5628,
      partnerPriceCurrency: "RUB",
      priceUsd: 5628,
      availableDates: [{ start: "2026-07-01", end: "2026-07-10", spotsLeft: 4 }],
    },
    filterCurrency: "RUB",
    priceMin: 5_628,
    priceMax: 26_188,
    shouldMatch: false,
  },
  {
    id: "tripster-partner-price-not-bypassed",
    bug: "Tripster partner tours must not bypass price filter",
    listing: {
      id: "ts-price",
      slug: "tripster-expensive",
      partnerSource: "tripster",
      priceUsd: 0,
      priceOnRequest: true,
      partnerPriceValue: 300_000,
      partnerPriceCurrency: "RUB",
      availableDates: [],
    },
    filterCurrency: "RUB",
    priceMin: 5_628,
    priceMax: 26_188,
    shouldMatch: false,
  },
];

/** Full offer rows for end-to-end pipeline tests (mapper → detail capacity). */
export type PartnerPipelineRegressionCase = {
  id: string;
  bug: string;
  tourId: number;
  groupMax: number;
  fallbackPriceUsd: number;
  offer: YouTravelOffer;
  expected: {
    priceUsd: number;
    partnerPriceCurrency: string;
    spotsLeft: number;
    capacity: { total: number; booked: number; free: number };
  };
};

export const PARTNER_PIPELINE_REGRESSION_CASES: PartnerPipelineRegressionCase[] = [
  {
    id: "pipeline-price-capacity-55478",
    bug: "Combined price + capacity regression from tour 55478-style payload",
    tourId: 55478,
    groupMax: 14,
    fallbackPriceUsd: 2000,
    offer: {
      id: 10,
      startDate: "2026-07-01",
      endDate: "2026-07-13",
      booked_spaces: 5,
      seatsTotal: 14,
      freeSpaces: 9,
      priceValue: 5628,
      currency: "RUB",
    },
    expected: {
      priceUsd: 5628,
      partnerPriceCurrency: "USD",
      spotsLeft: 9,
      capacity: { total: 14, booked: 5, free: 9 },
    },
  },
  {
    id: "pipeline-mislabeled-usd-listing-price",
    bug: "37766 USD-labeled offer must map to realistic USD filter price",
    tourId: 52537,
    groupMax: 16,
    fallbackPriceUsd: 400,
    offer: {
      id: 20,
      startDate: "2026-03-01",
      endDate: "2026-03-10",
      priceValue: 37766.3,
      currency: "USD",
      freeSpaces: 6,
      seatsTotal: 16,
    },
    expected: {
      priceUsd: 37766.3 / 100,
      partnerPriceCurrency: "RUB",
      spotsLeft: 6,
      capacity: { total: 16, booked: 10, free: 6 },
    },
  },
];
