import { describe, expect, it } from "vitest";

import {
  DEFAULT_SITE_MODULES,
  DEFAULT_SITE_NAVIGATION,
} from "./cms/site-globals/normalize";
import {
  filterSitemapPathsByPublicSettings,
  isIndexableInternalPath,
  STABLE_TOUR_LANDING_PATHS,
} from "./sitemap-urls";

describe("public sitemap contract", () => {
  it("excludes partner city pages whose availability cannot be guaranteed", () => {
    expect(isIndexableInternalPath("/excursions/city/Buenos_Aires")).toBe(false);
    expect(isIndexableInternalPath("/excursions/city/Ushuaia")).toBe(false);
    expect(isIndexableInternalPath("/excursions/city/Mendoza")).toBe(false);
  });

  it("keeps stable public hubs indexable", () => {
    expect(isIndexableInternalPath("/excursions")).toBe(true);
    expect(isIndexableInternalPath("/blog/authors")).toBe(true);
    expect(isIndexableInternalPath("/tours/region/patagonia")).toBe(true);
  });

  it("publishes the dedicated Patagonia tours landing", () => {
    expect(STABLE_TOUR_LANDING_PATHS).toContain("/tours/region/patagonia");
  });

  it("keeps disabled travel modules and noindex routes out of sitemap", () => {
    const modules = {
      ...DEFAULT_SITE_MODULES,
      carRentalMode: "disabled" as const,
      transfersMode: "disabled" as const,
    };

    expect(
      filterSitemapPathsByPublicSettings(
        [
          "/services",
          "/car-rental",
          "/car-rental/offers",
          "/transfers",
          "/transfers/airport",
          "/baza-znaniy/poisk",
          "/immigration",
          "/immigration/vnzh-i-pmzh",
        ],
        DEFAULT_SITE_NAVIGATION,
        modules,
      ),
    ).toEqual(["/services"]);
  });

  it("returns travel module routes when the same effective settings enable them", () => {
    expect(
      filterSitemapPathsByPublicSettings(
        ["/car-rental", "/transfers"],
        DEFAULT_SITE_NAVIGATION,
        {
          ...DEFAULT_SITE_MODULES,
          carRentalMode: "partner",
          transfersMode: "request",
        },
      ),
    ).toEqual(["/car-rental", "/transfers"]);
  });
});
