import type { TourItineraryDay } from "@/types";
import type { TourDayActivity } from "@/types/tour-itinerary-activity";
import { normalizeDayActivities } from "@/lib/tour-itinerary-activity";

export const ORGANIZER_TOUR_PROGRAM_DAYS_MAX = 30;
export const ORGANIZER_TOUR_PROGRAM_DAY_PHOTOS_MAX = 12;
export const ORGANIZER_TOUR_PROGRAM_DAY_DESCRIPTION_MAX = 8000;
export const ORGANIZER_TOUR_PROGRAM_DAY_ACCOMMODATION_MAX = 300;

export interface OrganizerProgramDay {
  id: string;
  dayNumber: number;
  title: string;
  description: string;
  images: string[];
  activities: TourDayActivity[];
  meals: string[];
  accommodation: string;
}

export function createProgramDayId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `day-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createEmptyProgramDay(dayNumber: number): OrganizerProgramDay {
  return {
    id: createProgramDayId(),
    dayNumber,
    title: "",
    description: "",
    images: [],
    activities: [],
    meals: [],
    accommodation: "",
  };
}

function normalizeMeals(items: string[] | undefined): string[] {
  return (items ?? []).map((item) => item.trim()).filter(Boolean);
}

export function mapItineraryToProgramDay(day: TourItineraryDay): OrganizerProgramDay {
  return {
    id: day.id,
    dayNumber: day.dayNumber,
    title: day.title,
    description: day.description,
    images: day.images ?? [],
    activities: normalizeDayActivities(
      day.activities as Array<Partial<TourDayActivity> | string> | undefined
    ),
    meals: normalizeMeals(day.meals),
    accommodation: day.accommodation?.trim() ?? "",
  };
}

export function renumberProgramDays(days: OrganizerProgramDay[]): OrganizerProgramDay[] {
  return days.map((day, index) => ({ ...day, dayNumber: index + 1 }));
}

export function normalizeProgramDay(
  day: Partial<OrganizerProgramDay>,
  dayNumber: number
): OrganizerProgramDay {
  return {
    id: day.id?.trim() || createProgramDayId(),
    dayNumber,
    title: day.title?.trim() ?? "",
    description: day.description ?? "",
    images: day.images?.filter(Boolean) ?? [],
    activities: normalizeDayActivities(day.activities),
    meals: normalizeMeals(day.meals),
    accommodation: day.accommodation?.trim().slice(0, ORGANIZER_TOUR_PROGRAM_DAY_ACCOMMODATION_MAX) ?? "",
  };
}

export function normalizeProgramDays(
  days: OrganizerProgramDay[] | undefined,
  seed: OrganizerProgramDay[]
): OrganizerProgramDay[] {
  if (!days?.length) return seed;
  return renumberProgramDays(days.map((day, index) => normalizeProgramDay(day, index + 1)));
}

export const DEFAULT_IGUAZU_PROGRAM_DAYS: OrganizerProgramDay[] = [
  {
    id: "iguazu-program-day-1",
    dayNumber: 1,
    title: "Прибытие и знакомство с регионом",
    description: `**Утро — День:**
• Трансфер из аэропорта или отеля
• Знакомство с гидом и группой

**Вечер:**
• Свободное время
• Брифинг по программе следующего дня`,
    images: [],
    activities: [
      {
        id: "iguazu-act-1",
        kind: "transfer",
        title: "Трансфер из аэропорта или отеля",
        durationLabel: "40 мин",
      },
      {
        id: "iguazu-act-2",
        kind: "briefing",
        title: "Знакомство с гидом",
        durationLabel: "30 мин",
      },
      {
        id: "iguazu-act-3",
        kind: "free_time",
        title: "Свободное время",
        durationLabel: "2–3 ч",
        description: "Прогулка по городу или отдых в отеле",
      },
    ],
    meals: [],
    accommodation: "",
  },
];
