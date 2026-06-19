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
