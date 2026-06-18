import type { ItineraryActivityKind } from "@/data/itinerary-activity-kinds";

export interface TourDayActivity {
  id: string;
  kind: ItineraryActivityKind;
  /** Пользовательское название; если пусто — берётся из каталога вида */
  title?: string;
  description?: string;
  /** Свободная подпись длительности, напр. «полдня», «3–4 ч» */
  durationLabel?: string;
  /** Длительность в минутах — для автоматического форматирования */
  durationMinutes?: number;
  distanceKm?: number;
  elevationGainM?: number;
  elevationLossM?: number;
}

export const ORGANIZER_TOUR_DAY_ACTIVITIES_MAX = 30;
export const ORGANIZER_TOUR_DAY_MEALS_MAX = 8;
export const ORGANIZER_TOUR_DAY_ACTIVITY_DESCRIPTION_MAX = 500;
