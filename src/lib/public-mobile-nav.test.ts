import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_MODULES,
  DEFAULT_SITE_NAVIGATION,
} from "@/lib/cms/site-globals/normalize";
import {
  getPublicMobileNavItems,
  isPublicMobileNavItemActive,
  PUBLIC_MOBILE_NAV_ITEMS,
  shouldShowPublicMobileNav,
} from "@/lib/public-mobile-nav";

describe("public mobile app navigation", () => {
  it("stays on public discovery pages and yields to workspaces and transactions", () => {
    expect(shouldShowPublicMobileNav("/")).toBe(true);
    expect(shouldShowPublicMobileNav("/mapa-argentina")).toBe(true);
    expect(shouldShowPublicMobileNav("/blog/patagonia-guide")).toBe(true);

    for (const pathname of [
      "/profile",
      "/profile/favorites",
      "/organizer/tours",
      "/admin/settings",
      "/booking/pay/token",
      "/trip/token",
      "/tours/patagonia",
      "/excursions/iguazu",
    ]) {
      expect(shouldShowPublicMobileNav(pathname), pathname).toBe(false);
    }
  });

  it("contains five compact app destinations", () => {
    expect(PUBLIC_MOBILE_NAV_ITEMS.map((item) => item.label)).toEqual([
      "Главная",
      "Туры",
      "Карта",
      "Избранное",
      "Профиль",
    ]);
  });

  it("respects administrator module visibility", () => {
    const items = getPublicMobileNavItems(
      { ...DEFAULT_SITE_NAVIGATION, showTours: false, showPlaces: false },
      DEFAULT_SITE_MODULES,
    );
    expect(items.map((item) => item.id)).toEqual(["home", "favorites", "profile"]);
  });

  it("marks only the current destination as active", () => {
    const tours = PUBLIC_MOBILE_NAV_ITEMS.find((item) => item.id === "tours")!;
    const home = PUBLIC_MOBILE_NAV_ITEMS.find((item) => item.id === "home")!;
    expect(isPublicMobileNavItemActive(tours, "/tours")).toBe(true);
    expect(isPublicMobileNavItemActive(tours, "/tours/patagonia")).toBe(true);
    expect(isPublicMobileNavItemActive(home, "/guide")).toBe(false);
  });
});
