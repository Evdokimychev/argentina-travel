import { describe, expect, it } from "vitest";
import {
  HOMEPAGE_BODY_MODULE_DEFAULT_ORDER,
  HOMEPAGE_BODY_MODULE_IDS,
  HOMEPAGE_BODY_MODULE_META,
  resolveHomepageBodyModuleOrder,
} from "@/lib/homepage/homepage-module-registry";

describe("homepage module registry", () => {
  it("keeps default order identical to the module id list", () => {
    expect(HOMEPAGE_BODY_MODULE_DEFAULT_ORDER).toEqual([...HOMEPAGE_BODY_MODULE_IDS]);
  });

  it("has metadata for every module", () => {
    for (const id of HOMEPAGE_BODY_MODULE_IDS) {
      expect(HOMEPAGE_BODY_MODULE_META[id].id).toBe(id);
      expect(HOMEPAGE_BODY_MODULE_META[id].label.trim().length).toBeGreaterThan(0);
    }
  });

  it("returns default order when override is empty", () => {
    expect(resolveHomepageBodyModuleOrder()).toEqual([...HOMEPAGE_BODY_MODULE_DEFAULT_ORDER]);
    expect(resolveHomepageBodyModuleOrder([])).toEqual([...HOMEPAGE_BODY_MODULE_DEFAULT_ORDER]);
  });

  it("applies override and appends missing modules", () => {
    const ordered = resolveHomepageBodyModuleOrder([
      "journal",
      "offers",
      "journal",
      "unknown",
      "geography",
    ]);
    expect(ordered.slice(0, 3)).toEqual(["journal", "offers", "geography"]);
    expect(ordered).toContain("tours-lead");
    expect(ordered.filter((id) => id === "journal")).toHaveLength(1);
    expect(ordered).toHaveLength(HOMEPAGE_BODY_MODULE_DEFAULT_ORDER.length);
  });
});
