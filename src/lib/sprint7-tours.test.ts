import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getMarketplaceListings } from "@/lib/tour-repository";
import { getTourDetailBySlug as getPatagoniaTourDetail } from "@/data/tour-details/patagonia";
import { marketplaceTours } from "@/data/marketplace-tours";
import {
  formatTourPriceForPdf,
  resolveCatalogPriceUsd,
  tourPriceSourcesMatch,
} from "@/lib/tour-pricing";
import { resolveTourCoverImage } from "@/lib/tour-metadata";
import { getProductionBrandDomain } from "@/lib/site-brand";
import { getRoutePointsForDay } from "@/lib/tour-itinerary-map";
import { tourRoutesMap } from "@/data/tour-routes";

const root = join(process.cwd(), "src");

describe("Sprint 7 — tours catalog & detail", () => {
  it("patagonia-glaciers listing and detail prices match", () => {
    const listing = marketplaceTours.find((t) => t.slug === "patagonia-glaciers");
    const detail = getPatagoniaTourDetail("patagonia-glaciers");
    expect(listing).toBeDefined();
    expect(detail).toBeDefined();
    expect(listing!.priceUsd).toBe(2540);
    expect(detail!.priceUsd).toBe(2540);
    expect(
      tourPriceSourcesMatch(listing!.priceUsd, detail!.priceUsd, detail!.dates)
    ).toBe(true);
    expect(resolveCatalogPriceUsd({ priceUsd: listing!.priceUsd, dates: detail!.dates })).toBe(
      2540
    );
  });

  it("formatTourPriceForPdf uses unified module", () => {
    const formatted = formatTourPriceForPdf({ priceUsd: 2663, priceFromPrefix: true });
    expect(formatted).toMatch(/^от \$2[\s\u00a0]?663 USD$/);
    expect(formatTourPriceForPdf({ priceUsd: 0, priceOnRequest: true })).toBe("Цена по запросу");
  });

  it("resolveTourCoverImage prefers gallery cover", () => {
    const detail = getPatagoniaTourDetail("patagonia-glaciers")!;
    const cover = resolveTourCoverImage(detail);
    expect(cover).toBeTruthy();
    expect(cover).toBe(detail.gallery[0] ?? detail.image);
  });

  it("PDF meta uses production brand domain helper", () => {
    const source = readFileSync(join(root, "lib/tour-itinerary-pdf/pdf-meta.ts"), "utf8");
    expect(source).toContain("getProductionBrandDomain");
    const domain = getProductionBrandDomain();
    expect(domain).not.toContain("vercel.app");
    expect(domain).toBe("www.goargentina.ru");
  });

  it("MarketplaceTourCard v2 has 4/3 aspect and partner badge", () => {
    const source = readFileSync(join(root, "components/marketplace/MarketplaceTourCard.tsx"), "utf8");
    expect(source).toContain('aspect="4/3"');
    expect(source).toContain("resolvePartnerTourBadge");
    expect(source).toContain("ContentCard");
  });

  it("TourDetailGallery has mobile carousel and desktop mosaic", () => {
    const gallery = readFileSync(join(root, "components/tour-detail/TourDetailGallery.tsx"), "utf8");
    const mosaic = readFileSync(join(root, "components/shared/GalleryMosaicDesktop.tsx"), "utf8");
    expect(gallery).toContain("useGalleryKeyboard");
    expect(gallery).toContain("GalleryMosaicDesktop");
    expect(gallery).toContain("md:hidden");
    expect(mosaic).toContain("tourDetailGalleryGridClass");
  });

  it("catalog has sticky filter bar and removable chips", () => {
    const catalog = readFileSync(join(root, "components/marketplace/ToursCatalog.tsx"), "utf8");
    expect(catalog).toContain("CatalogStickyBar");
    expect(catalog).toContain("CatalogActiveFilterChips");
  });

  it("ItinerarySection lazy-loads per-day mini map", () => {
    const source = readFileSync(join(root, "components/tour-detail/ItinerarySection.tsx"), "utf8");
    expect(source).toContain("ItineraryDayMiniMap");
    expect(source).toContain("getRoutePointsForDay");
    const dayOnePoints = getRoutePointsForDay(tourRoutesMap["patagonia-glaciers"], 1);
    expect(dayOnePoints.length).toBeGreaterThan(0);
  });

  it("MobileBookingBar uses compact Заявка CTA", () => {
    const source = readFileSync(join(root, "components/tour-detail/MobileBookingBar.tsx"), "utf8");
    expect(source).toContain('"Заявка"');
    expect(source).toContain("FormattedPrice");
  });

  it("tour page metadata resolves cover from gallery", () => {
    const source = readFileSync(join(root, "app/tours/[slug]/page.tsx"), "utf8");
    expect(source).toContain("resolveTourCoverImage");
    expect(getMarketplaceListings().length).toBeGreaterThan(0);
  });
});
