import { format, isValid, parseISO } from "date-fns";
import { ru } from "date-fns/locale";

export function formatBookingDateTime(iso: string): { date: string; time: string } {
  const parsed = parseISO(iso);
  if (!isValid(parsed)) {
    return { date: iso, time: "" };
  }

  return {
    date: format(parsed, "dd.MM.yyyy", { locale: ru }),
    time: format(parsed, "HH:mm", { locale: ru }),
  };
}

export function formatBookingCreatedAt(iso: string): string {
  const { date, time } = formatBookingDateTime(iso);
  return time ? `${date} ${time}` : date;
}
