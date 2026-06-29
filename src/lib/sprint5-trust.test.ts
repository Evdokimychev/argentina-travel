import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { computeBlogStats, filterIndexableBlogPosts } from "@/lib/blog-utils";
import { blogPosts } from "@/data/blog";
import { getPlatformStatsFromRepository } from "@/lib/organizer-public";
import { filterArgentinaHomepageTours } from "@/lib/homepage-tours";
import { getMarketplaceListings } from "@/lib/tour-repository";
import {
  deriveTourReviewStats,
  stripStaticSeedReviews,
} from "@/lib/tour-review-stats";
import { resolveTourRatingLabel } from "@/lib/tour-public-display";
import {
  PARTNER_TRIPSTER_BADGE_LABEL,
  isPartnerTourListing,
} from "@/lib/tripster/partner-tour-utils";
import { getTourDetailBySlug as getPatagoniaTourDetail } from "@/data/tour-details/patagonia";
import { tourExtra } from "@/data/tour-extra";

const root = join(process.cwd(), "src");

describe("Sprint 5 — trust gate", () => {
  it("platform stats match Argentina catalog counts", () => {
    const stats = getPlatformStatsFromRepository();
    const argentinaCount = filterArgentinaHomepageTours(getMarketplaceListings()).length;
    expect(stats.tourCount).toBe(argentinaCount);
    expect(stats.partnerTourCount).toBe(0);
    expect(stats.totalTourCount).toBe(argentinaCount);
  });

  it("seed tour extras have zero fake review counts", () => {
    for (const extra of Object.values(tourExtra)) {
      expect(extra.reviewCount).toBe(0);
      expect(extra.rating).toBe(0);
    }
  });

  it("patagonia detail shows Новый without fake rating when no reviews", () => {
    const tour = getPatagoniaTourDetail("patagonia-glaciers");
    expect(tour).toBeDefined();
    const stats = deriveTourReviewStats(stripStaticSeedReviews(tour!.reviews));
    expect(stats.reviewCount).toBe(0);
    const label = resolveTourRatingLabel(stats);
    expect(label.hasReviews).toBe(false);
    expect(label.badgeLabel).toBe("Новый тур");
  });

  it("native marketplace listings use real organizer without fake demo names", () => {
    const natives = getMarketplaceListings();
    for (const tour of natives) {
      expect(tour.rating).toBe(0);
      expect(tour.reviewCount).toBe(0);
      expect(tour.organizer.avatar).toBe("");
      expect(tour.organizer.name).toBe("Иван Евдокимычев");
      expect(tour.organizerOwnerId).toBe("ivan-evdokimychev");
      expect(tour.organizer.name).not.toMatch(/^(Мария|Карлос|Ана|Пабло|София|Диего|Лусия)/);
    }
  });

  it("blog indexable count is consistent with filterIndexableBlogPosts", () => {
    const stats = computeBlogStats(blogPosts);
    expect(stats.indexablePosts).toBe(filterIndexableBlogPosts(blogPosts).length);
    expect(stats.totalPosts).toBe(blogPosts.length);
    expect(stats.indexablePosts + stats.draftPosts).toBe(stats.totalPosts);
  });

  it("partner Tripster badge label is localized", () => {
    expect(PARTNER_TRIPSTER_BADGE_LABEL).toBe("Партнёр Tripster");
    const partner = getMarketplaceListings().find(isPartnerTourListing);
    if (partner) {
      expect(partner.partnerSource === "tripster" || partner.id.startsWith("tripster-")).toBe(true);
    }
  });

  it("MarketplaceTourCard uses partner badge constants", () => {
    const cardSource = readFileSync(join(root, "components/marketplace/MarketplaceTourCard.tsx"), "utf8");
    const badgeSource = readFileSync(join(root, "lib/partner-tours/badge.ts"), "utf8");
    expect(cardSource).toContain("resolvePartnerTourBadge");
    expect(badgeSource).toContain("PARTNER_TRIPSTER_BADGE_LABEL");
    expect(badgeSource).toContain("PARTNER_TRIPSTER_BADGE_HINT");
  });

  it("podbor iguazu uses ~275 waterfalls copy", () => {
    const source = readFileSync(join(root, "data/podbor/regions.ts"), "utf8");
    expect(source).toMatch(/275 водопад/);
    expect(source).not.toMatch(/280 водопад/);
  });

  it("no Unsplash hotlinks in public seed data files", () => {
    const files = [
      "data/marketplace-tours.ts",
      "data/tour-details/patagonia.ts",
      "data/tour-extra.ts",
      "components/tour-detail/checkout/checkout-addons.ts",
      "data/tour-guides-defaults.ts",
      "lib/bookings-store.ts",
      "lib/waitlist-store.ts",
    ];
    for (const rel of files) {
      const source = readFileSync(join(root, rel), "utf8");
      expect(source, rel).not.toMatch(/images\.unsplash\.com/);
    }
  });
});
