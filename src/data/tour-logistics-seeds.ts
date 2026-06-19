import {
  createEmptyArrivalDepartureCity,
  normalizeArrivalDepartureCities,
  type OrganizerArrivalDepartureCity,
} from "@/data/tour-logistics-defaults";

export interface TourLogisticsSeed {
  arrivalDepartureEnabled?: boolean;
  arrivalDepartureCities?: OrganizerArrivalDepartureCity[];
}

export const TOUR_LOGISTICS_SEEDS: Record<string, TourLogisticsSeed> = {
  "patagonia-glaciers": {
    arrivalDepartureEnabled: true,
    arrivalDepartureCities: [
      {
        ...createEmptyArrivalDepartureCity("Буэнос-Айрес"),
        id: "patagonia-ba-logistics",
        plane: {
          enabled: true,
          arrivalDay: "day_before_tour",
          latestArrivalTime: "23:00",
          departureDay: "tour_end_day",
          earliestDepartureTime: "19:30",
        },
        otherEnabled: true,
        comment:
          "Старт и финиш — Буэнос-Айрес, Аргентина. Средняя цена авиабилетов из Москвы туда и обратно — 120–150 тыс. руб. Можно подобрать рейс с пересадкой в Бразилии и совместить поездку с Рио или Сан-Паулу.",
      },
    ],
  },
};

export function getLogisticsSeedForSlug(slug: string): TourLogisticsSeed | undefined {
  return TOUR_LOGISTICS_SEEDS[slug];
}

export function mergeLogisticsSeed(
  slug: string,
  logistics: {
    arrivalDepartureEnabled: boolean;
    arrivalDepartureCities: OrganizerArrivalDepartureCity[];
  }
): {
  arrivalDepartureEnabled: boolean;
  arrivalDepartureCities: OrganizerArrivalDepartureCity[];
} {
  const seed = getLogisticsSeedForSlug(slug);
  if (!seed) return logistics;

  const hasCities = logistics.arrivalDepartureCities.some((city) => city.city.trim());

  return {
    arrivalDepartureEnabled: logistics.arrivalDepartureEnabled || seed.arrivalDepartureEnabled === true,
    arrivalDepartureCities: hasCities
      ? normalizeArrivalDepartureCities(logistics.arrivalDepartureCities)
      : normalizeArrivalDepartureCities(seed.arrivalDepartureCities ?? []),
  };
}
