import { getDestinationBySlug } from "@/lib/destinations";
import { matchToursForDestination } from "@/lib/destinations";
import { resolveListingOwnerUserId } from "@/lib/organizer-public-routing";
import { getRecommendedListings } from "@/lib/tour-listing-ranking";
import { isDefaultCatalogTour } from "@/lib/catalog-country-relevance";
import type { TourListing } from "@/types";
import type {
  TourEmbedConfig,
  TourEmbedPreset,
  TourEmbedSource,
  TourEmbedVariant,
} from "@/types/tour-embed";

export type TourEmbedMatch = {
  tour: TourListing;
  reasons: string[];
};

type QueryConcept = {
  kind: "geography" | "topic";
  keys: string[];
  signals: string[];
  reason: string;
  broad?: boolean;
  patagoniaSpecific?: boolean;
};

const QUERY_CONCEPTS: QueryConcept[] = [
  {
    kind: "geography",
    keys: ["buenos", "буэнос"],
    signals: ["buenos", "буэнос", "palermo", "палермо", "san telmo", "сан-тельмо"],
    reason: "Маршрут проходит по Буэнос-Айресу",
  },
  {
    kind: "geography",
    keys: ["iguazu", "iguassu", "игуасу"],
    signals: ["iguaz", "iguassu", "игуас", "misiones", "мисьонес"],
    reason: "Маршрут включает водопады Игуасу",
  },
  {
    kind: "geography",
    keys: ["mendoza", "мендоса", "uco", "уко"],
    signals: ["mendoza", "мендос", "uco", "уко", "maipu", "майпу"],
    reason: "Маршрут проходит по винному региону Мендосы",
  },
  {
    kind: "geography",
    keys: ["bariloche", "барилоче", "nahuel huapi", "науэль-уапи"],
    signals: ["bariloch", "барилоч", "nahuel", "науэль"],
    reason: "Маршрут включает Барилоче и Озёрный край",
    patagoniaSpecific: true,
  },
  {
    kind: "geography",
    keys: ["valdes", "вальдес", "puerto madryn", "пуэрто-мадрин"],
    signals: ["valdes", "вальдес", "madryn", "мадрин"],
    reason: "Маршрут проходит по полуострову Вальдес",
    patagoniaSpecific: true,
  },
  {
    kind: "geography",
    keys: ["patagonia", "патагон"],
    signals: ["patagonia", "патагон", "bariloch", "барилоч", "calafate", "калафат", "ushuaia", "ушуай"],
    reason: "Маршрут проходит по Патагонии",
    broad: true,
  },
  {
    kind: "topic",
    keys: ["wine", "вино", "винн", "винодель"],
    signals: ["wine", "вино", "винн", "винодель", "malbec", "мальбек", "bodega", "дегустац"],
    reason: "В программе есть винодельни или дегустации",
  },
  {
    kind: "topic",
    keys: ["whale", "кит"],
    signals: ["whale", "кит", "ballena", "вальдес", "valdes"],
    reason: "Маршрут связан с наблюдением за китами",
  },
  {
    kind: "topic",
    keys: ["penguin", "пингвин"],
    signals: ["penguin", "пингвин", "punta tombo", "пунта-томбо", "martillo", "мартильо"],
    reason: "Маршрут связан с колониями пингвинов",
  },
];

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tourSearchHaystack(tour: TourListing): string {
  return normalizeSearchText(
    [
      tour.title,
      tour.destination,
      tour.region,
      tour.shortDescription,
      tour.activityType,
      ...(tour.partnerThematicTags ?? []),
    ].join(" "),
  );
}

function includesSignal(haystack: string, signal: string): boolean {
  const normalized = normalizeSearchText(signal);
  return normalized.length > 0 && haystack.includes(normalized);
}

function queryConcepts(query: string): QueryConcept[] {
  const normalized = normalizeSearchText(query);
  const concepts = QUERY_CONCEPTS.filter((concept) =>
    concept.keys.some((key) => normalized.includes(normalizeSearchText(key))),
  );
  const hasSpecificGeography = concepts.some((concept) => concept.patagoniaSpecific);
  return concepts.filter(
    (concept) => !(concept.kind === "geography" && concept.broad && hasSpecificGeography),
  );
}

function matchQuery(tour: TourListing, query: string): TourEmbedMatch | null {
  if (!isDefaultCatalogTour(tour)) return null;
  const normalizedQuery = normalizeSearchText(query);
  if (!normalizedQuery) return { tour, reasons: [] };

  const haystack = tourSearchHaystack(tour);
  const concepts = queryConcepts(query);
  const geography = concepts.filter((concept) => concept.kind === "geography");
  const topics = concepts.filter((concept) => concept.kind === "topic");
  const matches = (concept: QueryConcept) =>
    concept.signals.some((signal) => includesSignal(haystack, signal));
  const matchedGeography = geography.filter(matches);
  const matchedTopics = topics.filter(matches);

  if (geography.length > 0 && matchedGeography.length === 0) return null;
  if (topics.length > 0 && matchedTopics.length !== topics.length) return null;

  if (concepts.length === 0) {
    const tokens = normalizedQuery
      .split(/\s+/)
      .filter((token) => token.length >= 4 && !["argentina", "аргентина", "tour", "туры"].includes(token));
    if (tokens.length > 0 && !tokens.every((token) => haystack.includes(token))) return null;
  }

  return {
    tour,
    reasons: [...new Set([...matchedGeography, ...matchedTopics].map((concept) => concept.reason))].slice(0, 2),
  };
}

export function matchesTourEmbedQuery(tour: TourListing, query: string): boolean {
  return Boolean(matchQuery(tour, query));
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
    case "organizer":
      return tours.filter(
        (tour) =>
          resolveListingOwnerUserId(tour) === source.organizerSlug ||
          tour.organizer.slug === source.organizerSlug
      );
    default:
      return [];
  }
}

function presetReason(tour: TourListing): string | null {
  if (tour.isBestOfMonth) return "Отмечен как один из лучших маршрутов месяца";
  if (tour.isHot) return "Отмечен в каталоге как актуальное предложение";
  if (tour.isNew) return "Новое предложение в каталоге";
  if (tour.reviewCount > 0) return `Оценка основана на ${tour.reviewCount} отзывах`;
  return null;
}

export function resolveTourEmbedMatches(
  tours: TourListing[],
  source: TourEmbedSource,
): TourEmbedMatch[] {
  if (source.kind === "query") {
    return tours
      .map((tour) => matchQuery(tour, source.query))
      .filter((match): match is TourEmbedMatch => Boolean(match));
  }

  return resolveTourEmbedListings(tours, source).map((tour) => {
    if (source.kind === "destination") {
      const destination = getDestinationBySlug(source.destinationSlug);
      return {
        tour,
        reasons: destination ? [`Маршрут связан с направлением «${destination.name}»`] : [],
      };
    }
    if (source.kind === "region") {
      return { tour, reasons: [`Маршрут проходит по региону «${source.region}»`] };
    }
    if (source.kind === "slugs") {
      return { tour, reasons: ["Выбран редакцией для этого материала"] };
    }
    if (source.kind === "organizer") {
      return { tour, reasons: ["Предложение этого организатора"] };
    }
    const reason = presetReason(tour);
    return { tour, reasons: reason ? [reason] : [] };
  });
}

export function resolveTourEmbedWidget(
  tours: TourListing[],
  config: TourEmbedConfig
): TourListing[] {
  const limit = config.limit ?? defaultLimitForVariant(config.variant);
  return resolveTourEmbedListings(tours, config.source).slice(0, limit);
}

function parseDurationRange(title: string): { min: number; max: number } | null {
  const normalized = normalizeSearchText(title);
  const range = normalized.match(/(?:^|\s)(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*(?:д[а-я]*|days?)/);
  if (range) {
    const first = Number(range[1]);
    const second = Number(range[2]);
    return { min: Math.min(first, second), max: Math.max(first, second) };
  }
  const exact = normalized.match(/(?:^|\s)(\d{1,2})\s*(?:д[а-я]*|days?)(?:\s|$)/);
  if (!exact) return null;
  const days = Number(exact[1]);
  return { min: days, max: days };
}

export function resolveTourEmbedWidgetMatches(
  tours: TourListing[],
  config: TourEmbedConfig,
): TourEmbedMatch[] {
  const limit = config.limit ?? defaultLimitForVariant(config.variant);
  const durationRange = parseDurationRange(config.title);
  return resolveTourEmbedMatches(tours, config.source)
    .filter(
      (match) =>
        !durationRange ||
        (match.tour.durationDays >= durationRange.min && match.tour.durationDays <= durationRange.max),
    )
    .slice(0, limit)
    .map((match) => {
      const configuredReason = config.matchReasons?.[match.tour.slug]?.trim();
      if (configuredReason) return { ...match, reasons: [configuredReason] };
      if (!durationRange) return match;
      const durationReason =
        durationRange.min === durationRange.max
          ? `Длительность — ${match.tour.durationDays} дней`
          : `Длительность входит в диапазон ${durationRange.min}–${durationRange.max} дней`;
      return { ...match, reasons: [...match.reasons, durationReason].slice(0, 2) };
    });
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
  const organizer = readParam(params, "organizer");

  let source: TourEmbedSource | null = null;
  if (slugs) {
    source = { kind: "slugs", slugs: slugs.split(",").map((s) => s.trim()).filter(Boolean) };
  } else if (organizer) {
    source = { kind: "organizer", organizerSlug: organizer };
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

  const themeParam = readParam(params, "theme");
  const theme =
    themeParam === "dark" || themeParam === "light"
      ? themeParam
      : undefined;

  return {
    variant,
    title,
    subtitle,
    limit: Number.isFinite(limit) ? limit : undefined,
    source,
    catalogHref: readParam(params, "catalog") ?? "/tours",
    catalogLabel: readParam(params, "catalogLabel") ?? "Все туры",
    tone: (readParam(params, "tone") as TourEmbedConfig["tone"]) ?? "inline",
    theme,
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
