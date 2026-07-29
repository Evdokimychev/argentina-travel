import { describe, expect, it, vi } from "vitest";
import { BEZOPASNOST_PILLAR } from "@/data/guide-pillar-bezopasnost";
import { EKONOMIKA_PILLAR } from "@/data/guide-pillar-ekonomika";
import { POGODA_PILLAR } from "@/data/guide-pillars/regions-sights";
import {
  guidePillarNeedsMarketplaceTours,
  loadGuidePillarInitialTours,
} from "@/lib/guide-pillar-tour-data";
import type { TourListing } from "@/types";

describe("guide pillar marketplace dependency", () => {
  it("keeps editorial-only pillars off the marketplace critical path", async () => {
    const fetchMarketplaceTours = vi.fn<() => Promise<TourListing[]>>();
    const filterToursWithResolvedPublicDetail = vi.fn<
      (tours: TourListing[]) => Promise<TourListing[]>
    >();

    expect(guidePillarNeedsMarketplaceTours(BEZOPASNOST_PILLAR)).toBe(false);
    expect(guidePillarNeedsMarketplaceTours(EKONOMIKA_PILLAR)).toBe(false);

    await expect(
      loadGuidePillarInitialTours(BEZOPASNOST_PILLAR, {
        fetchMarketplaceTours,
        filterToursWithResolvedPublicDetail,
      }),
    ).resolves.toEqual([]);
    expect(fetchMarketplaceTours).not.toHaveBeenCalled();
    expect(filterToursWithResolvedPublicDetail).not.toHaveBeenCalled();
  });

  it("loads and validates listings when a section renders a tour embed", async () => {
    const marketplaceTours = [{ id: "marketplace-tour" }] as unknown as TourListing[];
    const resolvedTours = [{ id: "resolved-tour" }] as unknown as TourListing[];
    const fetchMarketplaceTours = vi.fn(async () => marketplaceTours);
    const filterToursWithResolvedPublicDetail = vi.fn(async () => resolvedTours);

    expect(guidePillarNeedsMarketplaceTours(POGODA_PILLAR)).toBe(true);
    await expect(
      loadGuidePillarInitialTours(POGODA_PILLAR, {
        fetchMarketplaceTours,
        filterToursWithResolvedPublicDetail,
      }),
    ).resolves.toBe(resolvedTours);
    expect(fetchMarketplaceTours).toHaveBeenCalledTimes(1);
    expect(filterToursWithResolvedPublicDetail).toHaveBeenCalledWith(marketplaceTours);
  });
});
