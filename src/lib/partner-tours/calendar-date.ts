/**
 * Calendar-date helpers for partner marketplace (Argentina timezone).
 * Avoid hardcoding "today" in callers — always pass `now` in tests.
 */

export const MARKETPLACE_TIME_ZONE = "America/Argentina/Buenos_Aires";

/** YYYY-MM-DD in the marketplace timezone (default: Argentina). */
export function todayYmdInTimeZone(
  now: Date = new Date(),
  timeZone: string = MARKETPLACE_TIME_ZONE,
): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isValidYmd(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return false;
  const dt = new Date(Date.UTC(y, m - 1, d));
  return (
    dt.getUTCFullYear() === y &&
    dt.getUTCMonth() === m - 1 &&
    dt.getUTCDate() === d
  );
}

/** Departure is still bookable if its start date is today or later (calendar day). */
export function isFutureOrTodayYmd(
  startYmd: string,
  now: Date = new Date(),
  timeZone: string = MARKETPLACE_TIME_ZONE,
): boolean {
  if (!isValidYmd(startYmd)) return false;
  return startYmd >= todayYmdInTimeZone(now, timeZone);
}

export function isPastYmd(
  startYmd: string,
  now: Date = new Date(),
  timeZone: string = MARKETPLACE_TIME_ZONE,
): boolean {
  if (!isValidYmd(startYmd)) return false;
  return startYmd < todayYmdInTimeZone(now, timeZone);
}
