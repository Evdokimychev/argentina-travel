import { describe, expect, it } from "vitest";
import { SITE_NAV_MOBILE_SECTIONS } from "@/data/site-nav";
import {
  SITE_NAV_MOBILE_GROUPS,
  assertMobileNavCoverage,
  buildMobileNavGroups,
} from "@/data/site-nav-mobile";

describe("mobile site navigation", () => {
  it("groups cover every mobile section exactly once", () => {
    assertMobileNavCoverage();

    const groupedIds = SITE_NAV_MOBILE_GROUPS.flatMap((group) => group.sectionIds);
    const mobileIds = SITE_NAV_MOBILE_SECTIONS.map((section) => section.id);

    expect(new Set(groupedIds).size).toBe(groupedIds.length);
    expect(groupedIds.sort()).toEqual(mobileIds.sort());
  });

  it("buildMobileNavGroups resolves sections in declared order", () => {
    const groups = buildMobileNavGroups();
    expect(groups[0]?.id).toBe("travel");
    expect(groups[0]?.sections.map((section) => section.id)).toEqual([
      "geography",
      "tours",
      "excursions",
      "gallery",
    ]);
  });
});
