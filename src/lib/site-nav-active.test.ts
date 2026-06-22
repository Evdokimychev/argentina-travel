import { describe, expect, it } from "vitest";
import { SITE_NAV_SECTIONS } from "@/data/site-nav";
import { getActiveNavSectionId, isNavSectionActive } from "@/lib/site-nav";

describe("nav section active state", () => {
  it("highlights only tours on /tours despite cross-links in other menus", () => {
    expect(getActiveNavSectionId("/tours", SITE_NAV_SECTIONS)).toBe("tours");

    const activePrimary = ["geography", "tours", "excursions", "guide", "immigration"].filter(
      (id) => isNavSectionActive("/tours", SITE_NAV_SECTIONS.find((s) => s.id === id)!, SITE_NAV_SECTIONS),
    );

    expect(activePrimary).toEqual(["tours"]);
  });

  it("highlights geography on map and destination pages", () => {
    expect(getActiveNavSectionId("/mapa-argentina", SITE_NAV_SECTIONS)).toBe("geography");
    expect(getActiveNavSectionId("/destinations/patagonia", SITE_NAV_SECTIONS)).toBe("geography");
  });

  it("highlights journal on blog pages", () => {
    expect(getActiveNavSectionId("/blog", SITE_NAV_SECTIONS)).toBe("journal");
    expect(getActiveNavSectionId("/blog/argentina-tourist-visa-2026", SITE_NAV_SECTIONS)).toBe(
      "journal",
    );
  });

  it("highlights excursions on /excursions", () => {
    expect(getActiveNavSectionId("/excursions", SITE_NAV_SECTIONS)).toBe("excursions");
  });

  it("highlights tours for deep travel tools like /podbor", () => {
    expect(getActiveNavSectionId("/podbor", SITE_NAV_SECTIONS)).toBe("tours");
  });
});
