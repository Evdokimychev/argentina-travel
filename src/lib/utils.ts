export function formatPrice(price: number): string {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(price);
}

function parseDisplayDate(dateStr: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return new Date(`${dateStr}T12:00:00`);
  }
  return new Date(dateStr);
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(parseDisplayDate(dateStr));
}

export function formatDateShort(dateStr: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(parseDisplayDate(dateStr));
}

/** Day + short month + year, e.g. «2 нояб. 2025 г.» */
export function formatDateShortWithYear(dateStr: string): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(parseDisplayDate(dateStr));
}

function formatDayMonth(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
  }).format(date);
}

/** Компактный диапазон для модалки заездов: «19 июн. — 1 июл.» */
export function formatDepartureRangeCompact(startDate: string, endDate?: string): string {
  if (!endDate || endDate === startDate) {
    return formatDateShort(startDate);
  }

  const start = parseDisplayDate(startDate);
  const end = parseDisplayDate(endDate);
  return `${formatDayMonth(start)} — ${formatDayMonth(end)}`;
}

/** Название месяца с заглавной буквы */
export function formatMonthName(dateStr: string): string {
  const month = new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(parseDisplayDate(dateStr));
  return month.charAt(0).toUpperCase() + month.slice(1);
}

function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    month: "short",
    year: "numeric",
  }).format(date);
}

/** Trip/booking range with year to avoid ambiguity across seasons. */
export function formatDateRange(startDate?: string, endDate?: string): string {
  if (!startDate) return "Не указаны";

  if (!endDate || endDate === startDate) {
    return formatDateShortWithYear(startDate);
  }

  const start = parseDisplayDate(startDate);
  const end = parseDisplayDate(endDate);
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${start.getDate()}–${end.getDate()} ${formatMonthYear(end)}`;
  }

  if (sameYear) {
    return `${formatDayMonth(start)} — ${formatDayMonth(end)} ${start.getFullYear()}`;
  }

  return `${formatDateShortWithYear(startDate)} — ${formatDateShortWithYear(endDate)}`;
}

export function cn(...classes: (string | false | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
