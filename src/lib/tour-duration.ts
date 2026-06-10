/** Согласованная длительность тура для отображения и бронирования */
export function normalizeTourDuration(
  days: number,
  nights: number
): { durationDays: number; durationNights: number } {
  let durationDays = Math.max(1, Math.floor(days) || 1);
  let durationNights = Math.max(0, Math.floor(nights) || 0);

  // Частая ошибка в данных: ночей больше или столько же, сколько дней
  if (durationNights >= durationDays) {
    durationDays = durationNights + 1;
  } else if (durationDays > 1 && durationNights === 0) {
    durationNights = durationDays - 1;
  }

  return { durationDays, durationNights };
}
