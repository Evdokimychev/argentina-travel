import { format } from "date-fns";
import { enUS, es, ptBR, ru } from "date-fns/locale";

const RU_WEEKDAY_2: Record<number, string> = {
  0: "вс",
  1: "пн",
  2: "вт",
  3: "ср",
  4: "чт",
  5: "пт",
  6: "сб",
};

const PT_WEEKDAY_2: Record<number, string> = {
  0: "dom",
  1: "seg",
  2: "ter",
  3: "qua",
  4: "qui",
  5: "sex",
  6: "sáb",
};

function resolveDateFnsLocale(locale: string) {
  if (locale.startsWith("ru")) return ru;
  if (locale.startsWith("es")) return es;
  if (locale.startsWith("pt")) return ptBR;
  return enUS;
}

function formatAbbreviatedWeekday(date: Date, locale: string): string {
  if (locale.startsWith("ru")) return RU_WEEKDAY_2[date.getDay()]!;
  if (locale.startsWith("pt")) return PT_WEEKDAY_2[date.getDay()]!;
  return format(date, "EE", { locale: resolveDateFnsLocale(locale) });
}

function parseScheduleDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00`);
}

/** Date picker trigger: "5 июля, вс" / "5 July, Sun". */
export function formatExcursionScheduleDayLabel(dateStr: string, locale: string): string {
  const date = parseScheduleDate(dateStr);
  const dateFnsLocale = resolveDateFnsLocale(locale);
  const dayMonth = format(date, "d MMMM", { locale: dateFnsLocale });
  const weekday = formatAbbreviatedWeekday(date, locale);

  if (locale.startsWith("ru") || locale.startsWith("pt")) {
    return `${dayMonth}, ${weekday}`;
  }

  return format(date, "d MMMM, EE", { locale: dateFnsLocale });
}

/** Booking preview row: "5 июля 2026 г., вс" / "5 July 2026, Sun". */
export function formatExcursionBookingPreviewDateLabel(dateStr: string, locale: string): string {
  const date = parseScheduleDate(dateStr);
  const dateFnsLocale = resolveDateFnsLocale(locale);
  const weekday = formatAbbreviatedWeekday(date, locale);

  if (locale.startsWith("ru")) {
    const dayMonthYear = format(date, "d MMMM yyyy 'г.'", { locale: dateFnsLocale });
    return `${dayMonthYear}, ${weekday}`;
  }

  if (locale.startsWith("pt")) {
    const dayMonthYear = format(date, "d MMMM yyyy", { locale: dateFnsLocale });
    return `${dayMonthYear}, ${weekday}`;
  }

  return format(date, "d MMMM yyyy, EE", { locale: dateFnsLocale });
}
