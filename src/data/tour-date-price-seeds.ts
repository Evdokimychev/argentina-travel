import type { TourDatePrice } from "@/types";
import type { OrganizerGroupTourDate } from "@/data/tour-booking-defaults";

/** Демо: разная стоимость по датам заезда (conditional price). */
export interface TourDatePriceSeed {
  /** Полный список дат для демо (если в legacy одна дата). */
  dates?: TourDatePrice[];
  /** id даты → цена USD за туриста. */
  priceOverrides?: Record<string, number>;
}

export const TOUR_DATE_PRICE_SEEDS: Record<string, TourDatePriceSeed> = {
  "patagonia-glaciers": {
    priceOverrides: {
      dt1: 2663,
      dt2: 2663,
      dt3: 2990,
      dt4: 2540,
    },
  },
  "mendoza-wine": {
    dates: [
      {
        id: "dt-mendoza-1",
        startDate: "2026-03-15",
        endDate: "2026-03-21",
        spotsLeft: 6,
        priceUsd: 1890,
      },
      {
        id: "dt-mendoza-2",
        startDate: "2026-04-12",
        endDate: "2026-04-18",
        spotsLeft: 4,
        priceUsd: 2150,
      },
      {
        id: "dt-mendoza-3",
        startDate: "2026-05-10",
        endDate: "2026-05-16",
        spotsLeft: 8,
        priceUsd: 1890,
      },
      {
        id: "dt-mendoza-4",
        startDate: "2026-09-20",
        endDate: "2026-09-26",
        spotsLeft: 5,
        priceUsd: 2350,
      },
    ],
  },
};

export function getDatePriceSeedForSlug(slug: string): TourDatePriceSeed | undefined {
  return TOUR_DATE_PRICE_SEEDS[slug];
}

export function applyDatePriceSeedOverrides<T extends { id: string; priceUsd: number }>(
  slug: string,
  dates: T[]
): T[] {
  const seed = getDatePriceSeedForSlug(slug);
  if (!seed?.priceOverrides) return dates;
  return dates.map((date) => ({
    ...date,
    priceUsd: seed.priceOverrides![date.id] ?? date.priceUsd,
  }));
}

export function resolveDemoTourDates(
  slug: string,
  dates: TourDatePrice[],
  basePriceUsd: number
): TourDatePrice[] {
  const seed = getDatePriceSeedForSlug(slug);
  const source = seed?.dates?.length ? seed.dates : dates;
  const withPrices = source.map((date) => ({
    ...date,
    priceUsd: date.priceUsd > 0 ? date.priceUsd : basePriceUsd,
  }));
  return applyDatePriceSeedOverrides(slug, withPrices);
}

export function applyDatePriceSeedToGroupDates(
  slug: string,
  dates: OrganizerGroupTourDate[],
  basePriceUsd: number
): OrganizerGroupTourDate[] {
  const publicDates = resolveDemoTourDates(
    slug,
    dates.map((date) => ({
      id: date.id,
      startDate: date.startDate,
      endDate: date.endDate,
      spotsLeft: date.spotsLeft,
      priceUsd: date.priceUsd,
    })),
    basePriceUsd
  );

  if (!publicDates.length) return dates;

  const byId = new Map(publicDates.map((date) => [date.id, date]));
  return dates.map((date) => {
    const override = byId.get(date.id);
    if (!override) return date;
    return { ...date, priceUsd: override.priceUsd };
  });
}

export function mergeGroupDatesSeed(
  slug: string,
  dates: OrganizerGroupTourDate[],
  basePriceUsd: number
): OrganizerGroupTourDate[] {
  const seed = getDatePriceSeedForSlug(slug);
  if (seed?.dates?.length) {
    return seed.dates.map((date) => ({
      id: date.id,
      startDate: date.startDate,
      endDate: date.endDate,
      priceUsd: date.priceUsd,
      totalSeats: date.spotsLeft,
      spotsLeft: date.spotsLeft,
      fullPaymentDaysBefore: 30,
      prepaymentAmount: 15,
      prepaymentType: "percent" as const,
      applyDiscount: false,
      notGuaranteed: false,
      flightIncluded: false,
    }));
  }
  return applyDatePriceSeedToGroupDates(slug, dates, basePriceUsd);
}
