import { marketplaceTours } from "@/data/marketplace-tours";
import type { TourDetail, TourListing } from "@/types";
import type { OrganizerTourDraft } from "@/types/organizer-tour";
import {
  TOURS_REPOSITORY_OVERRIDES_KEY,
  TOURS_REPOSITORY_STORE_KEY,
  TOURS_REPOSITORY_UPDATED_EVENT,
  type Tour,
} from "@/types/tour";
import {
  buildSeedTourFromSlug,
  createMinimalTourFromDraft,
  isTourPubliclyVisible,
  isTourPublishedListing,
  organizerDraftToTour,
  tourToDetail,
  tourToListing,
} from "@/lib/tour-mapper";
import { getCatalogSlug } from "@/lib/tour-slug";

let seedToursCache: Tour[] | null = null;

function buildSeedTours(): Tour[] {
  if (seedToursCache) return seedToursCache;

  seedToursCache = marketplaceTours
    .map((listing) => buildSeedTourFromSlug(listing.slug, listing))
    .filter((tour): tour is Tour => tour != null);

  return seedToursCache;
}

function migrateLegacyOverrides(store: Record<string, Tour>): Record<string, Tour> {
  if (typeof window === "undefined") return store;
  if (Object.keys(store).length > 0) return store;

  try {
    const legacyRaw = window.localStorage.getItem(TOURS_REPOSITORY_OVERRIDES_KEY);
    if (!legacyRaw) return store;
    const legacy = JSON.parse(legacyRaw) as Record<string, Tour>;
    if (legacy && typeof legacy === "object") {
      return { ...store, ...legacy };
    }
  } catch {
    // ignore
  }

  return store;
}

function readTourStore(): Record<string, Tour> {
  if (typeof window === "undefined") {
    return Object.fromEntries(buildSeedTours().map((tour) => [tour.slug, tour]));
  }

  try {
    const raw = window.localStorage.getItem(TOURS_REPOSITORY_STORE_KEY);
    let parsed: Record<string, Tour> = {};

    if (raw) {
      const data = JSON.parse(raw) as Record<string, Tour>;
      if (data && typeof data === "object") parsed = data;
    }

    parsed = migrateLegacyOverrides(parsed);
    return parsed;
  } catch {
    return migrateLegacyOverrides({});
  }
}

function writeTourStore(store: Record<string, Tour>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOURS_REPOSITORY_STORE_KEY, JSON.stringify(store));
}

function ensureSeedToursInStore(store: Record<string, Tour>): Record<string, Tour> {
  const next = { ...store };
  for (const seed of buildSeedTours()) {
    if (!next[seed.slug]) {
      next[seed.slug] = seed;
    }
  }
  return next;
}

function getTourStore(): Record<string, Tour> {
  return ensureSeedToursInStore(readTourStore());
}

function saveTour(tour: Tour) {
  const store = getTourStore();
  store[tour.slug] = tour;
  writeTourStore(store);
}

export function notifyToursRepositoryUpdated() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(TOURS_REPOSITORY_UPDATED_EVENT));
  }
}

function getAllStoredTours(): Tour[] {
  return Object.values(getTourStore());
}

export function getCanonicalTourBySlug(slug: string): Tour | undefined {
  const store = getTourStore();
  return store[slug];
}

export function getAllCanonicalTours(): Tour[] {
  return getAllStoredTours().filter((tour) => tour.status !== "deleted");
}

export function getMarketplaceListings(): TourListing[] {
  return getAllStoredTours()
    .filter(isTourPublishedListing)
    .map(tourToListing);
}

export function getRepositoryTourDetail(slug: string): TourDetail | undefined {
  const tour = getCanonicalTourBySlug(slug);
  if (!tour || !isTourPubliclyVisible(tour)) return undefined;
  return tourToDetail(tour);
}

function resolveBaseTourForDraft(draft: OrganizerTourDraft, catalogSlug: string): Tour {
  const store = getTourStore();
  const existing = store[catalogSlug];
  if (existing && existing.status !== "deleted") {
    return existing;
  }

  const marketplaceListing = marketplaceTours.find((item) => item.slug === catalogSlug);
  if (marketplaceListing) {
    const seed = buildSeedTourFromSlug(catalogSlug, marketplaceListing);
    if (seed) return seed;
  }

  return createMinimalTourFromDraft(draft, catalogSlug);
}

export function upsertTourFromOrganizerDraft(draft: OrganizerTourDraft): Tour {
  const catalogSlug = getCatalogSlug(draft);
  const base = resolveBaseTourForDraft(draft, catalogSlug);

  const canonical = organizerDraftToTour(draft, {
    ...base,
    id: base.id.startsWith("org-") ? draft.id : base.id,
    slug: catalogSlug,
    organizerTourId: draft.id,
  });

  saveTour(canonical);
  notifyToursRepositoryUpdated();

  return canonical;
}

export function markTourDeletedBySlug(slug: string): void {
  const store = getTourStore();
  const tour =
    store[slug] ?? buildSeedTours().find((item) => item.slug === slug);

  if (!tour) return;

  saveTour({ ...tour, status: "deleted" });
  notifyToursRepositoryUpdated();
}

export async function fetchRepositoryMarketplaceTours(): Promise<TourListing[]> {
  return getMarketplaceListings();
}

export function getClientSyncedMarketplaceListings(
  serverListings: TourListing[]
): TourListing[] {
  if (typeof window === "undefined") return serverListings;
  return getMarketplaceListings();
}

export function getClientSyncedTourDetail(
  slug: string,
  serverTour: TourDetail
): TourDetail {
  if (typeof window === "undefined") return serverTour;
  return getRepositoryTourDetail(slug) ?? serverTour;
}

export function resetTourRepositorySeedCache() {
  seedToursCache = null;
}

export function getAllCatalogSlugs(): string[] {
  return getAllStoredTours()
    .filter((tour) => tour.status !== "deleted")
    .map((tour) => tour.slug);
}
