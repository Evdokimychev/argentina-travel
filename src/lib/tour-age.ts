import { formatAgeFrom } from "@/lib/pluralize";

/** Подпись для карточек и статистики: «от 12 лет» или «без возрастных ограничений» */
export function formatMinimumAgeSummary(minimumAge?: number): string {
  if (minimumAge == null || minimumAge <= 0) {
    return "без возрастных ограничений";
  }
  return formatAgeFrom(minimumAge);
}

/** Компактная форма для таблиц и тегов: «12+» или «Без ограничений» */
export function formatMinimumAgeShort(minimumAge?: number): string {
  if (minimumAge == null || minimumAge <= 0) {
    return "Без ограничений";
  }
  return `${minimumAge}+`;
}
