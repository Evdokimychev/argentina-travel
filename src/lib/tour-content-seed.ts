import { marketplaceTours } from "@/data/marketplace-tours";
import { buildSeedTourFromSlug } from "@/lib/tour-mapper";
import { resolveListingOwnerUserId } from "@/lib/organizer-public";
import type { Tour } from "@/types/tour";

export function buildMarketplaceSeedTours(): Tour[] {
  return marketplaceTours
    .map((listing) => {
      const tour = buildSeedTourFromSlug(listing.slug, listing);
      if (!tour) return null;
      return tour;
    })
    .filter((tour): tour is Tour => tour != null);
}

export function buildMarketplaceSeedRows(): Array<{ tour: Tour; ownerUserId: string }> {
  return marketplaceTours
    .map((listing) => {
      const tour = buildSeedTourFromSlug(listing.slug, listing);
      if (!tour) return null;
      return {
        tour,
        ownerUserId: resolveListingOwnerUserId(listing),
      };
    })
    .filter((row): row is { tour: Tour; ownerUserId: string } => row != null);
}
