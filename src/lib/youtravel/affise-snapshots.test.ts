import { describe, expect, it } from "vitest";
import {
  detectAffiseConversionDropAlert,
  fillAffiseHistoryDays,
  type AffiseSnapshotRow,
} from "@/lib/youtravel/affise-snapshots";

const END_DATE = "2025-06-24";

function row(snapshotDate: string, conversions: number, clicks: number | null = null): AffiseSnapshotRow {
  return { snapshotDate, conversions, clicks };
}

describe("fillAffiseHistoryDays", () => {
  it("fills missing days with zero conversions", () => {
    const points = fillAffiseHistoryDays(
      [row("2025-06-22", 2), row("2025-06-24", 5)],
      7,
      END_DATE
    );

    expect(points).toHaveLength(7);
    expect(points[0]).toEqual({ date: "2025-06-18", conversions: 0, clicks: null });
    expect(points[4]).toEqual({ date: "2025-06-22", conversions: 2, clicks: null });
    expect(points[5]).toEqual({ date: "2025-06-23", conversions: 0, clicks: null });
    expect(points[6]).toEqual({ date: "2025-06-24", conversions: 5, clicks: null });
  });

  it("preserves clicks when present on snapshot rows", () => {
    const points = fillAffiseHistoryDays([row("2025-06-24", 1, 10)], 7, END_DATE);

    expect(points).toHaveLength(7);
    expect(points.at(-1)).toEqual({ date: "2025-06-24", conversions: 1, clicks: 10 });
    expect(points[0]).toEqual({ date: "2025-06-18", conversions: 0, clicks: null });
  });
});

describe("detectAffiseConversionDropAlert", () => {
  it("returns null when previous period has fewer than 3 conversions", () => {
    const snapshots = Array.from({ length: 14 }, (_, index) => {
      const day = 11 + index;
      return row(`2025-06-${String(day).padStart(2, "0")}`, index < 7 ? 0 : 1);
    });

    expect(detectAffiseConversionDropAlert(snapshots, END_DATE)).toBeNull();
  });

  it("returns null when drop is 50% or less", () => {
    const snapshots = [
      ...Array.from({ length: 7 }, (_, index) =>
        row(`2025-06-${String(11 + index).padStart(2, "0")}`, 2)
      ),
      ...Array.from({ length: 7 }, (_, index) =>
        row(`2025-06-${String(18 + index).padStart(2, "0")}`, 1)
      ),
    ];

    expect(detectAffiseConversionDropAlert(snapshots, END_DATE)).toBeNull();
  });

  it("alerts when last 7 days drop more than 50% from a >=3 baseline", () => {
    const snapshots = [
      ...Array.from({ length: 7 }, (_, index) =>
        row(`2025-06-${String(11 + index).padStart(2, "0")}`, 2)
      ),
      ...Array.from({ length: 6 }, (_, index) =>
        row(`2025-06-${String(18 + index).padStart(2, "0")}`, 0)
      ),
      row("2025-06-24", 1),
    ];

    const alert = detectAffiseConversionDropAlert(snapshots, END_DATE);

    expect(alert).toEqual({
      kind: "conversion_drop",
      previous7: 14,
      last7: 1,
      dropPercent: 93,
    });
  });
});
