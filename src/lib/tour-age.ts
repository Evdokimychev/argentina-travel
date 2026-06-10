import { formatAgeFrom } from "@/lib/pluralize";

/** Подпись для карточек и статистики: «от 12 лет» или «без возрастных ограничений» */
export function formatMinimumAgeSummary(minimumAge?: number): string {
  if (minimumAge == null || minimumAge <= 0) {
    return "без возрастных ограничений";
  }
  return formatAgeFrom(minimumAge);
}

/** Диапазон возраста: «от 12 до 65 лет» или только минимум */
export function formatAgeRangeSummary(minimumAge?: number, maximumAge?: number | null): string {
  const min = minimumAge != null && minimumAge > 0 ? minimumAge : null;
  const max = maximumAge != null && maximumAge > 0 ? maximumAge : null;

  if (min && max) return `от ${min} до ${max} лет`;
  if (min) return formatMinimumAgeSummary(min);
  if (max) return `до ${max} лет`;
  return formatMinimumAgeSummary(undefined);
}

/** Ограничение по весу участника */
export function formatMaxWeightSummary(enabled?: boolean, maxWeightKg?: number | null): string | null {
  if (!enabled || maxWeightKg == null || maxWeightKg <= 0) return null;
  return `до ${maxWeightKg} кг на участника`;
}

/** Компактная форма для таблиц и тегов: «12+» или «Без ограничений» */
export function formatMinimumAgeShort(minimumAge?: number): string {
  if (minimumAge == null || minimumAge <= 0) {
    return "Без ограничений";
  }
  return `${minimumAge}+`;
}
