import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type { TourListing } from "@/types";
import { resolveCatalogOrganizerIdentity } from "@/lib/catalog-filter-chips";

const marketplaceRoot = join(process.cwd(), "src/components/marketplace");

function listing(
  organizerOwnerId: string,
  name: string,
  partnerSource?: TourListing["partnerSource"],
): TourListing {
  return {
    organizerOwnerId,
    partnerSource,
    organizer: { name, avatar: "", slug: organizerOwnerId },
  } as TourListing;
}

describe("catalog mobile performance boundaries", () => {
  it("derives native organizer display data from the catalog payload", () => {
    const tours = [
      listing("native-owner", "Анна П.", undefined),
      listing("youtravel-expert-42", "Партнёр", "youtravel"),
    ];

    expect(resolveCatalogOrganizerIdentity(" native-owner ", tours)).toEqual({
      slug: "native-owner",
      name: "Анна П.",
    });
    expect(resolveCatalogOrganizerIdentity("youtravel-expert-42", tours)).toBeNull();
  });

  it("keeps repository seeds and the full media manifest outside the catalog graph", () => {
    const catalog = readFileSync(join(marketplaceRoot, "ToursCatalog.tsx"), "utf8");
    const chips = readFileSync(
      join(process.cwd(), "src/lib/catalog-filter-chips.ts"),
      "utf8",
    );

    expect(catalog).not.toContain("buildPublicOrganizerProfile");
    expect(chips).not.toContain('from "@/lib/organizer-public"');
    expect(chips).not.toContain("tour-repository");
    expect(chips).not.toContain("media-resolver");
  });

  it("does not eagerly download mobile-hidden media and defers optional UI", () => {
    const home = readFileSync(join(marketplaceRoot, "MarketplaceHome.tsx"), "utf8");
    const catalog = readFileSync(join(marketplaceRoot, "ToursCatalog.tsx"), "utf8");
    const card = readFileSync(join(marketplaceRoot, "MarketplaceTourCard.tsx"), "utf8");
    const calendar = readFileSync(
      join(marketplaceRoot, "CatalogDepartureCalendarButton.tsx"),
      "utf8",
    );

    expect(home).toContain('src={homeDestinationCardImage(dest.image)}');
    expect(home).toContain('src.replace(/\\/section\\.jpg$/, "/section-card.webp")');
    expect(catalog).toContain('src="/media/destinations/patagonia/cover.jpg"');
    expect(catalog).toContain('loading="lazy"');
    expect(catalog).not.toMatch(/patagonia\/cover\.jpg[\s\S]{0,180}\bpriority\b/);
    expect(catalog).toContain('dynamic(\n  () => import("@/components/marketplace/MarketplaceTourListCard")');
    expect(card).toContain('dynamic(() => import("./TourDepartureDatesModal"))');
    expect(card).toContain("datesModalOpen && schedule?.type === \"dates\"");
    expect(calendar).toContain('import("@/components/marketplace/CatalogDepartureCalendarModal")');
    expect(calendar).toContain("{open ? (");
  });
});
