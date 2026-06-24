export type AffiseSnapshotDays = 7 | 30 | 90;

export type AffiseSnapshotRow = {
  snapshotDate: string;
  conversions: number;
  clicks: number | null;
};

export type AffiseHistoryPoint = {
  date: string;
  conversions: number;
  clicks: number | null;
};

export type AffiseConversionDropAlert = {
  kind: "conversion_drop";
  previous7: number;
  last7: number;
  dropPercent: number;
};

function formatIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function parseIsoDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

function addDays(date: string, days: number): string {
  const next = parseIsoDate(date);
  next.setUTCDate(next.getUTCDate() + days);
  return formatIsoDate(next);
}

/** Fill missing calendar days with zero conversions/clicks for chart continuity. */
export function fillAffiseHistoryDays(
  snapshots: AffiseSnapshotRow[],
  days: AffiseSnapshotDays,
  endDate: string = formatIsoDate(new Date())
): AffiseHistoryPoint[] {
  const byDate = new Map(snapshots.map((row) => [row.snapshotDate, row]));
  const startDate = addDays(endDate, -(days - 1));
  const points: AffiseHistoryPoint[] = [];

  for (let cursor = startDate; cursor <= endDate; cursor = addDays(cursor, 1)) {
    const row = byDate.get(cursor);
    points.push({
      date: cursor,
      conversions: row?.conversions ?? 0,
      clicks: row?.clicks ?? null,
    });
  }

  return points;
}

/** Sum conversions for the most recent N-day window ending on endDate. */
export function sumAffiseConversionsForWindow(
  snapshots: AffiseSnapshotRow[],
  windowDays: number,
  endDate: string
): number {
  const startDate = addDays(endDate, -(windowDays - 1));
  return snapshots
    .filter((row) => row.snapshotDate >= startDate && row.snapshotDate <= endDate)
    .reduce((sum, row) => sum + row.conversions, 0);
}

/** Alert when last 7 days drop >50% vs the previous 7 and baseline had >=3 conversions. */
export function detectAffiseConversionDropAlert(
  snapshots: AffiseSnapshotRow[],
  endDate: string = formatIsoDate(new Date())
): AffiseConversionDropAlert | null {
  const last7End = endDate;
  const last7Start = addDays(endDate, -6);
  const previous7End = addDays(last7Start, -1);
  const previous7Start = addDays(previous7End, -6);

  const last7 = snapshots
    .filter((row) => row.snapshotDate >= last7Start && row.snapshotDate <= last7End)
    .reduce((sum, row) => sum + row.conversions, 0);

  const previous7 = snapshots
    .filter((row) => row.snapshotDate >= previous7Start && row.snapshotDate <= previous7End)
    .reduce((sum, row) => sum + row.conversions, 0);

  if (previous7 < 3) return null;
  if (last7 >= previous7 * 0.5) return null;

  const dropPercent = Math.round((1 - last7 / previous7) * 100);
  return {
    kind: "conversion_drop",
    previous7,
    last7,
    dropPercent,
  };
}

export function hasAffiseHistoryData(points: AffiseHistoryPoint[]): boolean {
  return points.some((point) => point.conversions > 0 || (point.clicks ?? 0) > 0);
}

export function historyHasClicksData(points: AffiseHistoryPoint[]): boolean {
  return points.some((point) => point.clicks != null);
}

export function buildAffiseHistoryResponse(
  snapshots90: AffiseSnapshotRow[]
): {
  points7: AffiseHistoryPoint[];
  points30: AffiseHistoryPoint[];
  points90: AffiseHistoryPoint[];
  alert: AffiseConversionDropAlert | null;
} {
  const endDate = formatIsoDate(new Date());
  return {
    points7: fillAffiseHistoryDays(snapshots90, 7, endDate),
    points30: fillAffiseHistoryDays(snapshots90, 30, endDate),
    points90: fillAffiseHistoryDays(snapshots90, 90, endDate),
    alert: detectAffiseConversionDropAlert(snapshots90, endDate),
  };
}

export function sumHistoryConversions(points: AffiseHistoryPoint[]): number {
  return points.reduce((sum, point) => sum + point.conversions, 0);
}

export function sumHistoryClicks(points: AffiseHistoryPoint[]): number | null {
  if (!historyHasClicksData(points)) return null;
  return points.reduce((sum, point) => sum + (point.clicks ?? 0), 0);
}
