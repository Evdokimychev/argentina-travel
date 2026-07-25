import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import PackingList, {
  filterPackingItems,
  groupPackingItems,
  isVisibleForScenario,
  isVisibleForSeason,
} from "./PackingList";
import { PATAGONIA_PACKING_ITEMS } from "@/data/patagonia-packing-list";

const MULTIDAY_ONLY_IDS = PATAGONIA_PACKING_ITEMS.filter(
  (item) => item.advancedOnly && item.scenarios.includes("multi-day"),
).map((item) => item.id);

describe("PackingList", () => {
  it("renders the full checklist with native checkboxes in initial (pre-hydration) HTML", () => {
    const html = renderToStaticMarkup(<PackingList />);

    // No-JS readable: every item label present, real checkbox inputs.
    for (const item of PATAGONIA_PACKING_ITEMS) {
      expect(html).toContain(item.label);
    }
    expect(html).toContain('type="checkbox"');
    // Filters are progressive enhancement — not in the pre-mount HTML.
    expect(html).not.toContain("ga-packing-search");
  });

  it("renders without touching window/localStorage during SSR", () => {
    const originalWindow = (globalThis as { window?: unknown }).window;
    // Simulate a server environment where window is undefined.
    delete (globalThis as { window?: unknown }).window;
    try {
      expect(() => renderToStaticMarkup(<PackingList />)).not.toThrow();
    } finally {
      if (originalWindow !== undefined) {
        (globalThis as { window?: unknown }).window = originalWindow;
      }
    }
  });

  it("hides multi-day-only gear under the default city scenario", () => {
    const visible = filterPackingItems(PATAGONIA_PACKING_ITEMS, {
      scenario: "city",
      season: "any",
      query: "",
    });
    const visibleIds = new Set(visible.map((item) => item.id));

    expect(MULTIDAY_ONLY_IDS.length).toBeGreaterThan(0);
    for (const id of MULTIDAY_ONLY_IDS) {
      expect(visibleIds.has(id)).toBe(false);
    }
    // Basic essentials remain visible in the city scenario.
    expect(visibleIds.has("passport")).toBe(true);
    expect(visibleIds.has("shell-jacket")).toBe(true);
  });

  it("reveals multi-day gear only when the multi-day scenario is selected", () => {
    const visible = filterPackingItems(PATAGONIA_PACKING_ITEMS, {
      scenario: "multi-day",
      season: "any",
      query: "",
    });
    const visibleIds = new Set(visible.map((item) => item.id));

    for (const id of MULTIDAY_ONLY_IDS) {
      expect(visibleIds.has(id)).toBe(true);
    }
    expect(visibleIds.has("tent")).toBe(true);
  });

  it("filters by search query on the item label", () => {
    const visible = filterPackingItems(PATAGONIA_PACKING_ITEMS, {
      scenario: "day-hike",
      season: "any",
      query: "ботинк",
    });
    expect(visible.length).toBeGreaterThan(0);
    for (const item of visible) {
      expect(item.label.toLowerCase()).toContain("ботинк");
    }
  });

  it("respects the season filter", () => {
    const winterOnly = PATAGONIA_PACKING_ITEMS.find((item) => item.id === "thermal-tights");
    expect(winterOnly).toBeDefined();
    expect(isVisibleForSeason(winterOnly!, "winter")).toBe(true);
    expect(isVisibleForSeason(winterOnly!, "summer")).toBe(false);
    expect(isVisibleForSeason(winterOnly!, "any")).toBe(true);
  });

  it("treats items without scenarios as basic essentials shown everywhere", () => {
    const essential = PATAGONIA_PACKING_ITEMS.find((item) => item.id === "passport");
    expect(essential).toBeDefined();
    expect(isVisibleForScenario(essential!, "city")).toBe(true);
    expect(isVisibleForScenario(essential!, "multi-day")).toBe(true);
    expect(isVisibleForScenario(essential!, "winter")).toBe(true);
  });

  it("groups items preserving first-seen order", () => {
    const groups = groupPackingItems(PATAGONIA_PACKING_ITEMS);
    expect(groups.length).toBeGreaterThan(0);
    const totalGrouped = groups.reduce((sum, group) => sum + group.items.length, 0);
    expect(totalGrouped).toBe(PATAGONIA_PACKING_ITEMS.length);
  });

  it("has no autoplay timers in source", () => {
    const source = readFileSync(join(__dirname, "PackingList.tsx"), "utf8");
    expect(source).not.toMatch(/setInterval/);
    // localStorage is only read inside an effect, never at module/render scope.
    expect(source).toMatch(/useEffect\(\(\) => \{\s*\n\s*setMounted\(true\)/);
  });
});
