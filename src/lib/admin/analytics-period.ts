import type { AnalyticsPeriod } from "@/types/admin-analytics";

export function parseAnalyticsPeriod(value: string | null | undefined): AnalyticsPeriod {
  if (value === "7d" || value === "30d" || value === "90d" || value === "all") return value;
  return "30d";
}

export function periodStartIso(period: AnalyticsPeriod): string | null {
  if (period === "all") return null;
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return start.toISOString();
}

export function periodDayKeys(period: AnalyticsPeriod): string[] {
  if (period === "all") return [];
  const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
  const keys: string[] = [];
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);
  cursor.setUTCDate(cursor.getUTCDate() - (days - 1));
  for (let i = 0; i < days; i += 1) {
    keys.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

export function bucketCreatedAtByDay(
  timestamps: string[],
  dayKeys: string[]
): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const key of dayKeys) counts.set(key, 0);
  for (const ts of timestamps) {
    const day = ts.slice(0, 10);
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return dayKeys.map((date) => ({ date, count: counts.get(date) ?? 0 }));
}

const MONTH_LABELS = [
  "янв",
  "фев",
  "мар",
  "апр",
  "май",
  "июн",
  "июл",
  "авг",
  "сен",
  "окт",
  "ноя",
  "дек",
];

export function formatMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-");
  const index = Number(month) - 1;
  if (!year || index < 0 || index > 11) return monthKey;
  return `${MONTH_LABELS[index]} ${year}`;
}

export function periodMonthKeys(period: AnalyticsPeriod): string[] {
  const now = new Date();
  const count =
    period === "7d" ? 1 : period === "30d" ? 2 : period === "90d" ? 4 : 12;
  const keys: string[] = [];
  const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  for (let i = count - 1; i >= 0; i -= 1) {
    const d = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() - i, 1));
    keys.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`);
  }
  return keys;
}

export function bucketCreatedAtByMonth(
  timestamps: string[],
  monthKeys: string[]
): { month: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const key of monthKeys) counts.set(key, 0);
  for (const ts of timestamps) {
    const month = ts.slice(0, 7);
    if (counts.has(month)) counts.set(month, (counts.get(month) ?? 0) + 1);
  }
  return monthKeys.map((month) => ({ month, count: counts.get(month) ?? 0 }));
}
