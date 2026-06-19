import { getPlaceEnrichment } from "@/data/places-enrichment";
import {
  COLLECTIONS_SEED,
  getAllPlaceListings,
  getPlaceBySlug,
  getPlacesBySlugs,
  ITINERARIES_SEED,
  PLACES_SEED,
  toPlaceListing,
  type CollectionSeed,
  type ItinerarySeed,
} from "@/data/places-seed";
import { buildPlaceRelations } from "@/lib/places-relations";
import { isPlacesDbEnabled, prisma } from "@/lib/prisma";
import { mapPrismaPlace } from "@/lib/places-mapper";
import type {
  PlaceCollection,
  PlaceDetail,
  PlaceItinerary,
  PlaceListing,
} from "@/types/place";

export function placeHref(slug: string): string {
  return `/places/${slug}`;
}

export function collectionHref(slug: string): string {
  return `/collections/${slug}`;
}

export function itineraryHref(slug: string): string {
  return `/itineraries/${slug}`;
}

function buildCollectionFromSeed(seed: CollectionSeed): PlaceCollection {
  return {
    id: seed.id,
    slug: seed.slug,
    title: seed.title,
    subtitle: seed.subtitle,
    description: seed.description,
    coverImage: seed.coverImage,
    tags: seed.tags,
    places: getPlacesBySlugs(seed.placeSlugs),
  };
}

function buildItineraryFromSeed(seed: ItinerarySeed): PlaceItinerary {
  return {
    id: seed.id,
    slug: seed.slug,
    title: seed.title,
    subtitle: seed.subtitle,
    description: seed.description,
    coverImage: seed.coverImage,
    durationDays: seed.durationDays,
    season: seed.season,
    difficulty: seed.difficulty,
    tags: seed.tags,
    stops: seed.stops.map((stop, index) => {
      const placeSeed = stop.placeSlug ? getPlaceBySlug(stop.placeSlug) : undefined;
      return {
        id: `${seed.id}-stop-${index}`,
        dayNumber: stop.dayNumber,
        sortOrder: stop.sortOrder,
        title: stop.title,
        description: stop.description,
        place: placeSeed ? toPlaceListing(placeSeed) : undefined,
      };
    }),
  };
}

function enrichPlaceDetail(seed: (typeof PLACES_SEED)[number]): PlaceDetail {
  const listing = toPlaceListing(seed);
  const allListings = getAllPlaceListings();
  const relatedPlaces = buildPlaceRelations(listing, allListings).map((r) => r.place);

  const collections = COLLECTIONS_SEED.filter((c) => c.placeSlugs.includes(seed.slug)).map(
    (c) => ({
      slug: c.slug,
      title: c.title,
      coverImage: c.coverImage,
    }),
  );

  const itineraryReferences = ITINERARIES_SEED.filter((it) =>
    it.stops.some((s) => s.placeSlug === seed.slug),
  ).map((it) => ({
    slug: it.slug,
    title: it.title,
    durationDays: it.durationDays,
    coverImage: it.coverImage,
  }));

  return {
    ...listing,
    fullDescription: seed.fullDescription,
    gallery: seed.gallery,
    website: seed.website,
    source: seed.source,
    relatedPlaces,
    collections,
    itineraryReferences,
    ...getPlaceEnrichment(seed.slug),
  };
}

/** List all places — Prisma when PLACES_USE_DB=true, else curated seed. */
export async function fetchPlacesServer(): Promise<PlaceListing[]> {
  if (isPlacesDbEnabled()) {
    try {
      const rows = await prisma.place.findMany({ orderBy: { popularity: "desc" } });
      return rows.map(mapPrismaPlace);
    } catch {
      // fall through to seed
    }
  }
  return getAllPlaceListings();
}

export async function fetchPlaceBySlugServer(slug: string): Promise<PlaceDetail | null> {
  if (isPlacesDbEnabled()) {
    try {
      const row = await prisma.place.findUnique({ where: { slug } });
      if (row) {
        const mapped = mapPrismaPlace(row);
        const all = await fetchPlacesServer();
        return {
          ...mapped,
          relatedPlaces: buildPlaceRelations(mapped, all).map((r) => r.place),
          collections: [],
          itineraryReferences: [],
        };
      }
    } catch {
      // fall through
    }
  }

  const seed = getPlaceBySlug(slug);
  if (!seed) return null;
  return enrichPlaceDetail(seed);
}

export async function fetchPlaceSlugsServer(): Promise<string[]> {
  if (isPlacesDbEnabled()) {
    try {
      const rows = await prisma.place.findMany({ select: { slug: true } });
      return rows.map((r) => r.slug);
    } catch {
      // fall through
    }
  }
  return PLACES_SEED.map((p) => p.slug);
}

export async function fetchCollectionsServer(): Promise<PlaceCollection[]> {
  if (isPlacesDbEnabled()) {
    try {
      const rows = await prisma.collection.findMany({
        include: {
          places: {
            include: { place: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      });
      return rows.map((col) => ({
        id: col.id,
        slug: col.slug,
        title: col.title,
        subtitle: col.subtitle ?? undefined,
        description: col.description,
        coverImage: col.coverImage ?? undefined,
        tags: col.tags,
        places: col.places.map((cp) => mapPrismaPlace(cp.place)),
      }));
    } catch {
      // fall through
    }
  }
  return COLLECTIONS_SEED.map(buildCollectionFromSeed);
}

export async function fetchCollectionBySlugServer(slug: string): Promise<PlaceCollection | null> {
  const all = await fetchCollectionsServer();
  return all.find((c) => c.slug === slug) ?? null;
}

export async function fetchItinerariesServer(): Promise<PlaceItinerary[]> {
  if (isPlacesDbEnabled()) {
    try {
      const rows = await prisma.itinerary.findMany({
        include: {
          stops: {
            include: { place: true },
            orderBy: [{ dayNumber: "asc" }, { sortOrder: "asc" }],
          },
        },
      });
      return rows.map((it) => ({
        id: it.id,
        slug: it.slug,
        title: it.title,
        subtitle: it.subtitle ?? undefined,
        description: it.description,
        coverImage: it.coverImage ?? undefined,
        durationDays: it.durationDays,
        season: it.season ?? undefined,
        difficulty: it.difficulty ?? undefined,
        tags: it.tags,
        stops: it.stops.map((stop) => ({
          id: stop.id,
          dayNumber: stop.dayNumber,
          sortOrder: stop.sortOrder,
          title: stop.title,
          description: stop.description ?? undefined,
          note: stop.note ?? undefined,
          place: stop.place ? mapPrismaPlace(stop.place) : undefined,
        })),
      }));
    } catch {
      // fall through
    }
  }
  return ITINERARIES_SEED.map(buildItineraryFromSeed);
}

export async function fetchItineraryBySlugServer(slug: string): Promise<PlaceItinerary | null> {
  const all = await fetchItinerariesServer();
  return all.find((i) => i.slug === slug) ?? null;
}
