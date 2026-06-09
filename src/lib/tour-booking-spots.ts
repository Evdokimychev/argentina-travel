import { TourDatePrice, TourDetail } from "@/types";
import { formatSpots, spotsWord } from "@/lib/pluralize";

export type BookingDateMode = "scheduled" | "custom";

export function dateFitsGuestCount(
  date: TourDatePrice,
  guests: number,
  groupMin: number
): boolean {
  return date.spotsLeft >= guests && date.spotsLeft >= groupMin;
}

export function findBookableDates(
  dates: TourDatePrice[],
  guests: number,
  groupMin: number
): TourDatePrice[] {
  return dates.filter((d) => dateFitsGuestCount(d, guests, groupMin));
}

export function pickInitialDateId(
  dates: TourDatePrice[],
  guests: number,
  groupMin: number
): string {
  return findBookableDates(dates, guests, groupMin)[0]?.id ?? dates[0]?.id ?? "";
}

export function getGuestLimits(
  tour: Pick<TourDetail, "groupMin" | "groupMax">,
  selectedDate: TourDatePrice | undefined,
  dateMode: BookingDateMode
): { min: number; max: number } {
  const min = tour.groupMin;
  if (dateMode !== "scheduled" || !selectedDate) {
    return { min, max: tour.groupMax };
  }
  return {
    min,
    max: Math.min(tour.groupMax, selectedDate.spotsLeft),
  };
}

export function validateGuestsForScheduledBooking(
  tour: TourDetail,
  guests: number,
  selectedDateId: string
): string | null {
  const date = tour.dates.find((d) => d.id === selectedDateId);
  if (!date) {
    return "Выберите дату заезда";
  }

  if (date.spotsLeft < tour.groupMin) {
    return `На ${formatDateRangeLabel(date)} осталось только ${formatSpots(date.spotsLeft)} — для этого тура нужно минимум ${tour.groupMin}. Выберите другую дату.`;
  }

  if (guests > date.spotsLeft) {
    return `На выбранную дату свободно ${formatSpots(date.spotsLeft)}, а вы бронируете ${guests}. Выберите другую дату или уменьшите группу.`;
  }

  if (guests < tour.groupMin) {
    return `Минимум ${tour.groupMin} ${tour.groupMin === 1 ? "турист" : "туриста"}`;
  }

  return null;
}

export function suggestBookableDatesMessage(
  dates: TourDatePrice[],
  guests: number,
  groupMin: number
): string | null {
  const alternatives = findBookableDates(dates, guests, groupMin);
  if (alternatives.length === 0) {
    return "Сейчас нет дат с достаточным количеством мест для вашей группы. Попробуйте уменьшить число туристов или выберите индивидуальный формат.";
  }
  const labels = alternatives.slice(0, 3).map(formatDateRangeLabel);
  const suffix = alternatives.length > 3 ? " и другие" : "";
  return `Доступные даты: ${labels.join(", ")}${suffix}.`;
}

function formatDateRangeLabel(date: TourDatePrice): string {
  const start = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(new Date(date.startDate));
  const end = new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(new Date(date.endDate));
  return `${start} – ${end}`;
}

export function dateOptionSuffix(
  date: TourDatePrice,
  guests: number,
  groupMin: number
): string {
  if (date.spotsLeft < groupMin) {
    return " · мало мест для группы";
  }
  if (date.spotsLeft < guests) {
    return ` · нужно ${guests}, есть ${date.spotsLeft} ${spotsWord(date.spotsLeft)}`;
  }
  return "";
}
