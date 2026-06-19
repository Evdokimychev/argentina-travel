/** Демо: лист ожидания и переопределение мест по slug тура. */
export interface TourWaitlistSeed {
  waitlistEnabled: boolean;
  /** id даты → свободных мест (для демо «нет мест»). */
  dateSpotsOverrides?: Record<string, number>;
}

export const TOUR_WAITLIST_SEEDS: Record<string, TourWaitlistSeed> = {
  "patagonia-glaciers": {
    waitlistEnabled: true,
    dateSpotsOverrides: {
      dt1: 3,
      dt3: 0,
    },
  },
  "mendoza-wine": {
    waitlistEnabled: true,
    dateSpotsOverrides: {
      "dt-default": 0,
    },
  },
};

export function getWaitlistSeedForSlug(slug: string): TourWaitlistSeed | undefined {
  return TOUR_WAITLIST_SEEDS[slug];
}
