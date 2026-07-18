import type { TourListing } from "@/types";
import { DEFAULT_ORGANIZER_OWNER_ID } from "@/types/user";

export function getOrganizerSlug(ownerUserId: string): string {
  return ownerUserId;
}

export function buildOrganizerPublicHref(slug: string): string {
  return `/organizers/${encodeURIComponent(slug)}`;
}

export function buildOrganizerCatalogHref(slug: string): string {
  return `/tours?${new URLSearchParams({ organizer: slug }).toString()}`;
}

export function resolveListingOwnerUserId(
  listing: Pick<TourListing, "organizerOwnerId">,
): string {
  return listing.organizerOwnerId ?? DEFAULT_ORGANIZER_OWNER_ID;
}
