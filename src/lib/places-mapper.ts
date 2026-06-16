import type { PlaceCategory, PlaceSource } from "@/types/place";
import type { PlaceCategory as PrismaPlaceCategory, PlaceSource as PrismaPlaceSource } from "@prisma/client";

const CATEGORY_TO_PRISMA: Record<PlaceCategory, PrismaPlaceCategory> = {
  national_park: "NATIONAL_PARK",
  waterfall: "WATERFALL",
  glacier: "GLACIER",
  lake: "LAKE",
  mountain: "MOUNTAIN",
  trekking: "TREKKING",
  city: "CITY",
  town: "TOWN",
  beach: "BEACH",
  winery: "WINERY",
  museum: "MUSEUM",
  historic: "HISTORIC",
  viewpoint: "VIEWPOINT",
  reserve: "RESERVE",
  wildlife: "WILDLIFE",
};

const CATEGORY_FROM_PRISMA = Object.fromEntries(
  Object.entries(CATEGORY_TO_PRISMA).map(([k, v]) => [v, k]),
) as Record<PrismaPlaceCategory, PlaceCategory>;

const SOURCE_TO_PRISMA: Record<PlaceSource, PrismaPlaceSource> = {
  manual: "MANUAL",
  openstreetmap: "OPENSTREETMAP",
  overpass: "OVERPASS",
  wikimedia: "WIKIMEDIA",
  wikipedia: "WIKIPEDIA",
  wikidata: "WIKIDATA",
  geonames: "GEONAMES",
};

const SOURCE_FROM_PRISMA = Object.fromEntries(
  Object.entries(SOURCE_TO_PRISMA).map(([k, v]) => [v, k]),
) as Record<PrismaPlaceSource, PlaceSource>;

export function placeCategoryToPrisma(category: PlaceCategory): PrismaPlaceCategory {
  return CATEGORY_TO_PRISMA[category];
}

export function placeCategoryFromPrisma(category: PrismaPlaceCategory): PlaceCategory {
  return CATEGORY_FROM_PRISMA[category];
}

export function placeSourceToPrisma(source: PlaceSource): PrismaPlaceSource {
  return SOURCE_TO_PRISMA[source];
}

export function placeSourceFromPrisma(source: PrismaPlaceSource): PlaceSource {
  return SOURCE_FROM_PRISMA[source];
}

export function mapPrismaPlace(row: {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  category: PrismaPlaceCategory;
  region: string;
  province: string | null;
  city: string | null;
  latitude: number;
  longitude: number;
  gallery: string[];
  coverImage: string | null;
  tags: string[];
  rating: number | null;
  visitDuration: string | null;
  season: string | null;
  ticketPrice: string | null;
  website: string | null;
  source: PrismaPlaceSource;
  popularity: number;
}) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.shortDescription,
    fullDescription: row.fullDescription,
    category: placeCategoryFromPrisma(row.category),
    region: row.region,
    province: row.province ?? undefined,
    city: row.city ?? undefined,
    latitude: row.latitude,
    longitude: row.longitude,
    gallery: row.gallery,
    coverImage: row.coverImage ?? undefined,
    tags: row.tags,
    rating: row.rating ?? undefined,
    visitDuration: row.visitDuration ?? undefined,
    season: row.season ?? undefined,
    ticketPrice: row.ticketPrice ?? undefined,
    website: row.website ?? undefined,
    source: placeSourceFromPrisma(row.source),
    popularity: row.popularity,
  };
}
