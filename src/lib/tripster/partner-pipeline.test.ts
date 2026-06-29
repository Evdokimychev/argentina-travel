import { describe, expect, it } from "vitest";
import { buildPartnerTourAffiliateFallbackPath } from "@/lib/partner-tour/affiliate-fallback";
import { assertDepartureCapacityConsistent } from "@/lib/youtravel/partner-invariants";
import {
  TRIPSTER_AFFILIATE_TRANSITION,
  TRIPSTER_LISTING_ROW,
  TRIPSTER_SCHEDULE_REGRESSION,
} from "@/lib/tripster/__fixtures__/regression-payloads";
import {
  mapScheduleToAvailableDates,
  mapScheduleToPartnerDates,
} from "@/lib/tripster/partner-tour-content";
import { resolveTripsterDepartureCapacity } from "@/lib/tripster/partner-tour-details";
import { resolveTripsterDifficultyLevelFromPayload } from "@/lib/tripster/partner-tour-levels";
import { resolveTripsterCatalogAvailableDates } from "@/lib/tripster/partner-tour-listing-schedule";
import { partnerTourRowToListing } from "@/lib/tripster/partner-tour-mapper";
import { resolvePartnerTourPriceUsd } from "@/lib/tripster/partner-tour-price";

describe("Tripster partner pipeline regressions", () => {
  it("maps catalog availableDates from cached schedule snapshot", () => {
    const dates = resolveTripsterCatalogAvailableDates(
      TRIPSTER_LISTING_ROW,
      TRIPSTER_LISTING_ROW.payload as import("@/lib/tripster/partner-tour-listing-schedule").TripsterExperienceWithSchedule,
    );

    expect(dates).toHaveLength(2);
    expect(dates[0]?.start).toBe("2026-09-01");
    expect(dates[0]?.spotsLeft).toBe(4);
  });

  it("includes availableDates in partner tour listing", () => {
    const listing = partnerTourRowToListing(TRIPSTER_LISTING_ROW, null);

    expect(listing.availableDates).toHaveLength(2);
    expect(listing.difficultyLevel).toBe("Высокая");
  });

  it("maps schedule to partner dates with seats total", () => {
    const dates = mapScheduleToPartnerDates(TRIPSTER_SCHEDULE_REGRESSION, 14, "RUB", 12);

    expect(dates[0]?.spotsLeft).toBe(4);
    expect(dates[0]?.seatsTotal).toBe(12);
    expect(dates[0]?.id).toBe("tripster-2026-09-01-08:00");
  });

  it("keeps departure capacity consistent", () => {
    const dates = mapScheduleToPartnerDates(TRIPSTER_SCHEDULE_REGRESSION, 14, "RUB", 12);
    const capacity = resolveTripsterDepartureCapacity({ groupMax: 12 }, dates[0]!);

    expect(capacity).toEqual({ total: 12, booked: 8, free: 4 });
    assertDepartureCapacityConsistent(capacity!, "tripster-capacity");
  });

  it("builds affiliate fallback path with start_date, time and guests", () => {
    const path = buildPartnerTourAffiliateFallbackPath({
      slug: TRIPSTER_AFFILIATE_TRANSITION.slug,
      partner: "tripster",
      startDate: TRIPSTER_AFFILIATE_TRANSITION.startDate,
      guests: TRIPSTER_AFFILIATE_TRANSITION.guests,
      time: TRIPSTER_AFFILIATE_TRANSITION.time,
      name: TRIPSTER_AFFILIATE_TRANSITION.name,
      email: TRIPSTER_AFFILIATE_TRANSITION.email,
      phone: TRIPSTER_AFFILIATE_TRANSITION.phone,
    });

    expect(path).toContain("/api/affiliate/go/patagonia-t92278");
    expect(path).toContain("start_date=2026-09-01");
    expect(path).toContain("time=08%3A00");
    expect(path).toContain("guests=3");
  });

  it("derives difficulty from comfort_level_info when grade is absent", () => {
    expect(
      resolveTripsterDifficultyLevelFromPayload(TRIPSTER_LISTING_ROW.payload as never),
    ).toBe("Высокая");
  });

  it("aggregates catalog dates by start day", () => {
    const available = mapScheduleToAvailableDates(TRIPSTER_SCHEDULE_REGRESSION, 14);
    expect(available).toHaveLength(2);
    expect(available[0]?.spotsLeft).toBe(4);
  });

  it("maps RUB listing price to positive USD in catalog listing", () => {
    const row = {
      ...TRIPSTER_LISTING_ROW,
      price_value: 373_099,
      price_currency: "RUB",
      payload: {
        ...(TRIPSTER_LISTING_ROW.payload as object),
        price: { value: 373_099, currency: "RUB", price_from: true },
      },
    };

    const price = resolvePartnerTourPriceUsd(row);
    expect(price.priceOnRequest).toBe(false);
    expect(price.priceUsd).toBeGreaterThan(3000);

    const listing = partnerTourRowToListing(row, null);
    expect(listing.priceOnRequest).toBe(false);
    expect(listing.priceUsd).toBeGreaterThan(3000);
  });
});
