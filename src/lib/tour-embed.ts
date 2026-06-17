import { getDestinationBySlug } from "@/lib/destinations";
import { matchToursForDestination } from "@/lib/destinations";
import { getRecommendedListings } from "@/lib/tour-recommendations";
import type { TourListing } from "@/types";
import type {
  TourEmbedConfig,
  TourEmbedPreset,
  TourEmbedSource,
  TourEmbedVariant,
} from "@/types/tour-embed";

export function matchesTourEmbedQuery(tour: TourListing, query: string): boolean {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  const haystack = [
    tour.title,
    tour.destination,
    tour.region,
    tour.shortDescription,
    tour.activityType,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(q);
}

function resolvePresetListings(
  tours: TourListing[],
  preset: TourEmbedPreset
): TourListing[] {
  switch (preset) {
    case "recommended":
      return getRecommendedListings(tours);
    case "hot":
      return tours.filter((tour) => tour.isHot);
    case "new":
      return tours.filter((tour) => tour.isNew);
    case "best-of-month":
      return tours.filter((tour) => tour.isBestOfMonth);
    default:
      return getRecommendedListings(tours);
  }
}

export function resolveTourEmbedListings(
  tours: TourListing[],
  source: TourEmbedSource
): TourListing[] {
  switch (source.kind) {
    case "slugs":
      return source.slugs
        .map((slug) => tours.find((tour) => tour.slug === slug))
        .filter((tour): tour is TourListing => Boolean(tour));
    case "destination": {
      const destination = getDestinationBySlug(source.destinationSlug);
      if (!destination) return [];
      return matchToursForDestination(tours, destination);
    }
    case "region":
      return tours.filter(
        (tour) => tour.region.toLowerCase() === source.region.toLowerCase()
      );
    case "query":
      return tours.filter((tour) => matchesTourEmbedQuery(tour, source.query));
    case "preset":
      return resolvePresetListings(tours, source.preset);
    default:
      return [];
  }
}

export function resolveTourEmbedWidget(
  tours: TourListing[],
  config: TourEmbedConfig
): TourListing[] {
  const limit = config.limit ?? defaultLimitForVariant(config.variant);
  return resolveTourEmbedListings(tours, config.source).slice(0, limit);
}

function defaultLimitForVariant(variant: TourEmbedVariant): number {
  switch (variant) {
    case "spotlight":
      return 1;
    case "featured":
      return 3;
    case "compact-list":
      return 4;
    case "strip":
      return 8;
    case "grid":
    default:
      return 6;
  }
}

export function parseTourEmbedSearchParams(
  params: Record<string, string | string[] | undefined>
): TourEmbedConfig | null {
  const variant = (readParam(params, "variant") ?? "grid") as TourEmbedVariant;
  const title = readParam(params, "title") ?? "Туры по Аргентине";
  const subtitle = readParam(params, "subtitle");
  const limitRaw = readParam(params, "limit");
  const limit = limitRaw ? Number.parseInt(limitRaw, 10) : undefined;

  const slugs = readParam(params, "slugs");
  const destination = readParam(params, "destination");
  const region = readParam(params, "region");
  const query = readParam(params, "query");
  const preset = readParam(params, "preset") as TourEmbedPreset | undefined;

  let source: TourEmbedSource | null = null;
  if (slugs) {
    source = { kind: "slugs", slugs: slugs.split(",").map((s) => s.trim()).filter(Boolean) };
  } else if (destination) {
    source = { kind: "destination", destinationSlug: destination };
  } else if (region) {
    source = { kind: "region", region };
  } else if (query) {
    source = { kind: "query", query };
  } else if (preset) {
    source = { kind: "preset", preset };
  } else {
    source = { kind: "preset", preset: "recommended" };
  }

  return {
    variant,
    title,
    subtitle,
    limit: Number.isFinite(limit) ? limit : undefined,
    source,
    catalogHref: readParam(params, "catalog") ?? "/tours",
    catalogLabel: readParam(params, "catalogLabel") ?? "Все туры",
    tone: (readParam(params, "tone") as TourEmbedConfig["tone"]) ?? "inline",
  };
}

function readParam(
  params: Record<string, string | string[] | undefined>,
  key: string
): string | undefined {
  const value = params[key];
  if (Array.isArray(value)) return value[0];
  return value;
}
