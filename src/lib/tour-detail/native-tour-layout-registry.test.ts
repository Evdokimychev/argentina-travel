import { describe, expect, it } from "vitest";
import {
  NATIVE_TOUR_LAYOUT_DEFAULT_ORDER,
  NATIVE_TOUR_LAYOUT_SLOT_IDS,
  NATIVE_TOUR_LAYOUT_SLOT_META,
  resolveNativeTourLayoutOrder,
} from "@/lib/tour-detail/native-tour-layout-registry";

describe("native tour layout registry", () => {
  it("keeps default order identical to the slot id list", () => {
    expect(NATIVE_TOUR_LAYOUT_DEFAULT_ORDER).toEqual([...NATIVE_TOUR_LAYOUT_SLOT_IDS]);
  });

  it("has metadata for every slot", () => {
    for (const id of NATIVE_TOUR_LAYOUT_SLOT_IDS) {
      expect(NATIVE_TOUR_LAYOUT_SLOT_META[id].id).toBe(id);
      expect(NATIVE_TOUR_LAYOUT_SLOT_META[id].label.trim().length).toBeGreaterThan(0);
    }
  });

  it("returns the default order when override is empty", () => {
    expect(resolveNativeTourLayoutOrder()).toEqual([...NATIVE_TOUR_LAYOUT_DEFAULT_ORDER]);
    expect(resolveNativeTourLayoutOrder(null)).toEqual([...NATIVE_TOUR_LAYOUT_DEFAULT_ORDER]);
    expect(resolveNativeTourLayoutOrder([])).toEqual([...NATIVE_TOUR_LAYOUT_DEFAULT_ORDER]);
  });

  it("applies override order and appends missing slots", () => {
    const ordered = resolveNativeTourLayoutOrder(["faq", "reviews", "faq", "unknown", "itinerary"]);
    expect(ordered.slice(0, 3)).toEqual(["faq", "reviews", "itinerary"]);
    expect(ordered).toContain("stats");
    expect(ordered).toContain("description");
    expect(ordered.filter((id) => id === "faq")).toHaveLength(1);
    expect(ordered).not.toContain("unknown");
    expect(ordered).toHaveLength(NATIVE_TOUR_LAYOUT_DEFAULT_ORDER.length);
  });
});
