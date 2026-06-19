/** Russian plural: 1 X, 2–4 Y, 5+ Z (with 11–14 exceptions) */
export function pluralRu(
  count: number,
  one: string,
  few: string,
  many: string
): string {
  const abs = Math.abs(count);
  const mod10 = abs % 10;
  const mod100 = abs % 100;

  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export function formatWithWord(
  count: number,
  one: string,
  few: string,
  many: string
): string {
  return `${count} ${pluralRu(count, one, few, many)}`;
}

// Места
export function spotsWord(count: number): string {
  return pluralRu(count, "место", "места", "мест");
}

export function formatSpots(count: number): string {
  return formatWithWord(count, "место", "места", "мест");
}

// Туристы
export function touristsWord(count: number): string {
  return pluralRu(count, "турист", "туриста", "туристов");
}

export function formatTourists(count: number): string {
  return formatWithWord(count, "турист", "туриста", "туристов");
}

/** После «для» / «за»: для 1 туриста, для 2 туристов */
export function touristsGenitiveWord(count: number): string {
  const mod10 = Math.abs(count) % 10;
  const mod100 = Math.abs(count) % 100;
  if (mod10 === 1 && mod100 !== 11) return "туриста";
  return "туристов";
}

export function formatForTourists(count: number): string {
  return `${count} ${touristsGenitiveWord(count)}`;
}

/** Подпись в блоке бронирования: «2 туриста · 10 дней» */
export function formatTourBookingGuestsDays(guests: number, days: number): string {
  return `${formatTourists(guests)} · ${formatDays(days)}`;
}

/** @deprecated Используйте formatTourists или formatForTourists в зависимости от контекста */
export function touristsBookingWord(count: number): string {
  return pluralRu(count, "турист", "туриста", "туристов");
}

export function formatTouristsBooking(count: number): string {
  return formatTourists(count);
}

export function formatTouristsRange(min: number, max: number): string {
  if (min === max) return formatTourists(min);
  return `${min}–${max} ${touristsWord(max)}`;
}

// Дни
export function daysWord(count: number): string {
  return pluralRu(count, "день", "дня", "дней");
}

export function formatDays(count: number): string {
  return formatWithWord(count, "день", "дня", "дней");
}

// Ночи
export function nightsWord(count: number): string {
  return pluralRu(count, "ночь", "ночи", "ночей");
}

export function formatNights(count: number): string {
  return formatWithWord(count, "ночь", "ночи", "ночей");
}

// Отзывы
export function reviewsWord(count: number): string {
  return pluralRu(count, "отзыв", "отзыва", "отзывов");
}

export function formatReviews(count: number): string {
  return formatWithWord(count, "отзыв", "отзыва", "отзывов");
}

// Даты
export function datesWord(count: number): string {
  return pluralRu(count, "дата", "даты", "дат");
}

export function formatMoreDates(count: number): string {
  return `+${count} ${datesWord(count)}`;
}

// Люди
export function peopleWord(count: number): string {
  return pluralRu(count, "человек", "человека", "человек");
}

export function formatPeople(count: number): string {
  return formatWithWord(count, "человек", "человека", "человек");
}

// Годы (1 год, 2 года, 5 лет)
export function yearsWord(count: number): string {
  return pluralRu(count, "год", "года", "лет");
}

export function formatYears(count: number): string {
  return formatWithWord(count, "год", "года", "лет");
}

/** После «от» для возраста: от 1 года, от 5 лет, от 21 года */
export function yearsFromAgeWord(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "года";
  return "лет";
}

export function formatAgeFrom(count: number): string {
  return `от ${count} ${yearsFromAgeWord(count)}`;
}

// Месяцы (1 месяц, 2 месяца, 5 месяцев)
export function monthsWord(count: number): string {
  return pluralRu(count, "месяц", "месяца", "месяцев");
}

export function formatMonths(count: number): string {
  return formatWithWord(count, "месяц", "месяца", "месяцев");
}

/** Компактная длительность для карточек */
export function formatDurationShort(days: number, nights: number): string {
  if (nights > 0) {
    return `${days} дн. (${nights} нч.)`;
  }
  return `${days} дн.`;
}

/** «Открыто 3 дня из 10 дней» */
export function formatDaysOpenOfTotal(openCount: number, totalDays: number): string {
  const totalWord =
    totalDays % 10 === 1 && totalDays % 100 !== 11 ? "дня" : "дней";
  return `Открыто ${formatDays(openCount)} из ${totalDays} ${totalWord}`;
}

/** Подпись раскрытых дней программы */
export function formatOpenedDaysLabel(openCount: number, allExpanded: boolean): string {
  if (allExpanded) return "Показаны все дни маршрута";
  if (openCount === 1) return "Открыт только один день";
  return `Открыто ${formatDays(openCount)}`;
}

// Туры
export function toursWord(count: number): string {
  return pluralRu(count, "тур", "тура", "туров");
}

export function formatTours(count: number): string {
  return formatWithWord(count, "тур", "тура", "туров");
}

// Путешествия
export function tripsWord(count: number): string {
  return pluralRu(count, "путешествие", "путешествия", "путешествий");
}

export function formatTrips(count: number): string {
  return formatWithWord(count, "путешествие", "путешествия", "путешествий");
}

// Активности
export function activitiesWord(count: number): string {
  return pluralRu(count, "активность", "активности", "активностей");
}

export function formatActivities(count: number): string {
  return formatWithWord(count, "активность", "активности", "активностей");
}

// Фильтры
export function filtersWord(count: number): string {
  return pluralRu(count, "фильтр", "фильтра", "фильтров");
}

export function formatFilters(count: number): string {
  return formatWithWord(count, "фильтр", "фильтра", "фильтров");
}

/** «8 туров найдено», «1 тур найден», «2 тура найдено» */
export function formatToursFound(count: number): string {
  const word = pluralRu(count, "тур", "тура", "туров");
  const mod10 = count % 10;
  const mod100 = count % 100;
  const verb =
    mod10 === 1 && mod100 !== 11 ? "найден" : "найдено";
  return `${count} ${word} ${verb}`;
}

/** «8 экскурсий найдено», «1 экскурсия найдена», «2 экскурсии найдено» */
export function formatExcursionsFound(count: number): string {
  const word = pluralRu(count, "экскурсия", "экскурсии", "экскурсий");
  const mod10 = count % 10;
  const mod100 = count % 100;
  const verb =
    mod10 === 1 && mod100 !== 11 ? "найдена" : "найдено";
  return `${count} ${word} ${verb}`;
}
