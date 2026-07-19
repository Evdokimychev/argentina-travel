import { describe, expect, it, vi } from "vitest";
import { resolveMarketplaceCatalogWithinDeadline } from "@/data/marketplace-tours-server";
import type { TourListing } from "@/types";

const listing = (slug: string) => ({ slug }) as TourListing;

describe("marketplace catalog deadline", () => {
  it("returns the exact catalog when it resolves before the deadline", async () => {
    const catalog = [listing("ready")];

    await expect(
      resolveMarketplaceCatalogWithinDeadline(
        Promise.resolve(catalog),
        () => [listing("stale")],
        50,
      ),
    ).resolves.toBe(catalog);
  });

  it("returns the last successful fallback without cancelling the catalog load", async () => {
    vi.useFakeTimers();
    const stale = [listing("stale")];
    let resolveCatalog!: (value: TourListing[]) => void;
    const catalogPromise = new Promise<TourListing[]>((resolve) => {
      resolveCatalog = resolve;
    });
    const resultPromise = resolveMarketplaceCatalogWithinDeadline(
      catalogPromise,
      () => stale,
      2_500,
    );

    await vi.advanceTimersByTimeAsync(2_500);
    await expect(resultPromise).resolves.toBe(stale);

    const fresh = [listing("fresh")];
    resolveCatalog(fresh);
    await expect(catalogPromise).resolves.toBe(fresh);
    vi.useRealTimers();
  });
});
