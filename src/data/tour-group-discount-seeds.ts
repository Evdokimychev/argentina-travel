import type { GroupDiscountSettings } from "@/types/group-discount";

/** Демо-настройки групповых скидок по slug тура в каталоге. */
export const TOUR_GROUP_DISCOUNT_SEEDS: Record<string, GroupDiscountSettings> = {
  "patagonia-glaciers": {
    enabled: true,
    tiers: [
      {
        id: "patagonia-2",
        minGuests: 2,
        maxGuests: 3,
        discountType: "percent",
        value: 5,
      },
      {
        id: "patagonia-4",
        minGuests: 4,
        maxGuests: null,
        discountType: "percent",
        value: 10,
      },
    ],
  },
  "mendoza-wine": {
    enabled: true,
    tiers: [
      {
        id: "mendoza-2",
        minGuests: 2,
        maxGuests: null,
        discountType: "percent",
        value: 8,
      },
    ],
  },
  "iguazu-falls": {
    enabled: true,
    tiers: [
      {
        id: "iguazu-2",
        minGuests: 2,
        maxGuests: 5,
        discountType: "fixed_per_person",
        value: 720,
      },
      {
        id: "iguazu-6",
        minGuests: 6,
        maxGuests: null,
        discountType: "fixed_per_person",
        value: 680,
      },
    ],
  },
};

export function getGroupDiscountSeedForSlug(slug: string): GroupDiscountSettings | undefined {
  return TOUR_GROUP_DISCOUNT_SEEDS[slug];
}
