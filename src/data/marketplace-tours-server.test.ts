import { describe, expect, it, vi } from "vitest";
import {
  observeMarketplaceCatalogInBackground,
  resolveMarketplaceCatalogWithinDeadline,
  resolveMarketplaceSourceResults,
} from "@/data/marketplace-tours-server";
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

  it("propagates a missing fallback after the deadline", async () => {
    vi.useFakeTimers();
    const pending = new Promise<TourListing[]>(() => undefined);
    const resultPromise = resolveMarketplaceCatalogWithinDeadline(
      pending,
      () => {
        throw new Error("marketplace_catalog_deadline_exceeded_without_lkg");
      },
      2_500,
    );
    const rejection = expect(resultPromise).rejects.toThrow(
      "marketplace_catalog_deadline_exceeded_without_lkg",
    );

    await vi.advanceTimersByTimeAsync(2_500);
    await rejection;
    vi.useRealTimers();
  });

  it("observes a late source rejection before a deadline fallback can reject", async () => {
    let rejectCatalog!: (reason: Error) => void;
    const catalogPromise = new Promise<TourListing[]>((_, reject) => {
      rejectCatalog = reject;
    });
    const report = vi.fn();

    observeMarketplaceCatalogInBackground(catalogPromise, report);
    rejectCatalog(new Error("late_catalog_failure"));
    await catalogPromise.catch(() => undefined);

    expect(report).toHaveBeenCalledWith("catalog", expect.objectContaining({
      message: "late_catalog_failure",
    }));
  });
});

describe("marketplace catalog source failures", () => {
  it("does not cache an empty catalog while a source is unavailable", () => {
    expect(() => resolveMarketplaceSourceResults([], [], [], 1, null)).toThrow(
      "marketplace_catalog_sources_unavailable",
    );
  });

  it("preserves the last-known-good catalog during a partial outage", () => {
    const stale = [listing("stale")];

    expect(resolveMarketplaceSourceResults([], [], [], 1, stale)).toBe(stale);
  });

  it("allows a confirmed empty catalog when every source responds", () => {
    expect(resolveMarketplaceSourceResults([], [], [], 0, null)).toEqual([]);
  });
});
