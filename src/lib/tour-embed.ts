import { getDestinationBySlug } from "@/lib/destinations";
import { matchToursForDestination } from "@/lib/destinations";
import { resolveListingOwnerUserId } from "@/lib/organizer-public";
import { getRecommendedListings } from "@/lib/tour-recommendations";
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
  id: string;
  kind: "geography" | "topic";
  keys: string[];
  signals: string[];
  reason: string;
  broad?: boolean;
};

const QUERY_CONCEPTS: QueryConcept[] = [
  {
    id: "buenos-aires",
    kind: "geography",
    keys: ["buenos", "буэнос"],
    signals: ["buenos", "буэнос", "palermo", "палермо", "san telmo", "сан-тельмо", "recoleta", "реколета"],
    reason: "Маршрут проходит по Буэнос-Айресу",
  },
  {
    id: "iguazu",
    kind: "geography",
    keys: ["iguazu", "iguassu", "игуасу"],
    signals: ["iguaz", "iguassu", "игуас", "garganta", "misiones", "мисьонес"],
    reason: "Маршрут включает водопады Игуасу",
  },
  {
    id: "mendoza",
    kind: "geography",
    keys: ["mendoza", "мендоса", "uco"],
    signals: ["mendoza", "мендос", "uco", "maipu", "майпу", "lujan de cuyo", "лухан-де-куйо"],
    reason: "Маршрут проходит по винному региону Мендосы",
  },
  {
    id: "bariloche",
    kind: "geography",
    keys: ["bariloche", "барилоче", "nahuel huapi", "науэль-уапи"],
    signals: ["bariloch", "барилоч", "nahuel", "науэль", "campanario", "кампанарио"],
    reason: "Маршрут включает Барилоче и Озёрный край",
  },
  {
    id: "calafate",
    kind: "geography",
    keys: ["el calafate", "эль-калафате", "perito moreno", "перито-морено"],
    signals: ["calafate", "калафат", "perito", "перито", "los glaciares", "лос-гласьярес"],
    reason: "Маршрут включает Эль-Калафате и ледники",
  },
  {
    id: "chalten",
    kind: "geography",
    keys: ["el chalten", "эль-чальтен", "fitz roy", "фицрой"],
    signals: ["chalten", "чальтен", "fitz", "фицрой", "laguna de los tres"],
    reason: "Маршрут включает Эль-Чальтен и район Фицроя",
  },
  {
    id: "ushuaia",
    kind: "geography",
    keys: ["ushuaia", "ушуайя", "tierra del fuego", "огненная земля"],
    signals: ["ushuaia", "ушуай", "tierra del fuego", "огнен", "beagle", "бигль"],
    reason: "Маршрут включает Ушуайю и Огненную Землю",
  },
  {
    id: "salta",
    kind: "geography",
    keys: ["salta", "сальта", "northwest", "северо-запад"],
    signals: ["salta", "сальт", "jujuy", "жужуй", "cafayate", "кафаяте", "purmamarca", "пурмамарка"],
    reason: "Маршрут проходит по северо-западу Аргентины",
  },
  {
    id: "valdes-wildlife",
    kind: "geography",
    keys: ["valdes", "вальдес", "puerto madryn", "пуэрто-мадрин", "whale", "кит"],
    signals: ["valdes", "вальдес", "madryn", "мадрин", "whale", "кит"],
    reason: "Маршрут связан с полуостровом Вальдес и наблюдением за китами",
  },
  {
    id: "patagonia",
    kind: "geography",
    keys: ["patagonia", "patagon", "патagonia", "патагон"],
    signals: ["patagon", "патагон", "calafate", "калафат", "bariloch", "барилоч", "ushuaia", "ушуай", "chalten", "чальтен"],
    reason: "Маршрут проходит по Патагонии",
    broad: true,
  },
  {
    id: "wine",
    kind: "topic",
    keys: ["wine", "wine tour", "винн", "вино", "винодель"],
    signals: ["wine", "вино", "винн", "винодель", "malbec", "мальбек", "bodega", "бодега", "дегустац"],
    reason: "В программе есть винодельни или дегустации",
  },
  {
    id: "tango",
    kind: "topic",
    keys: ["tango", "танго"],
    signals: ["tango", "танго", "milonga", "милонга"],
    reason: "В программе есть знакомство с танго",
  },
  {
    id: "penguins",
    kind: "topic",
    keys: ["penguin", "пингвин"],
    signals: ["penguin", "пингвин", "punta tombo", "пунта-томбо", "martillo", "мартильо"],
    reason: "Маршрут связан с колониями пингвинов",
  },
  {
    id: "wildlife",
    kind: "topic",
    keys: ["wildlife", "дикая природа", "fauna", "фауна"],
    signals: ["wildlife", "дикая природа", "fauna", "фауна", "сафари", "кит", "пингвин", "ибера", "ibera"],
    reason: "В центре программы — наблюдение за дикой природой",
  },
  {
    id: "national-parks",
    kind: "topic",
    keys: ["national park", "национальн парк", "нацпарк"],
    signals: ["national park", "национальн парк", "нацпарк", "parque nacional", "los glaciares", "игуасу", "iguazu"],
    reason: "Маршрут включает национальный парк",
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
  const normalizedSignal = normalizeSearchText(signal);
  if (!normalizedSignal) return false;
  if (normalizedSignal.includes(" ") || normalizedSignal.length > 4) {
    return haystack.includes(normalizedSignal);
  }
  const escaped = normalizedSignal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)${escaped}[a-zа-я]{0,5}(?:\\s|$)`, "i").test(haystack);
}

function queryConcepts(query: string): QueryConcept[] {
  const normalized = normalizeSearchText(query);
  const concepts = QUERY_CONCEPTS.filter((concept) =>
    concept.keys.some((key) => normalized.includes(normalizeSearchText(key))),
  );
  const hasSpecificPatagoniaGeography = concepts.some((concept) =>
    ["bariloche", "calafate", "chalten", "ushuaia", "valdes-wildlife"].includes(concept.id),
  );
  return concepts.filter(
    (concept) => !(concept.kind === "geography" && concept.broad && hasSpecificPatagoniaGeography),
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
  const matchesConcept = (concept: QueryConcept) =>
    concept.signals.some((signal) => includesSignal(haystack, signal));
  const matchedGeography = geography.filter(matchesConcept);
  const matchedTopics = topics.filter(matchesConcept);

  if (geography.length > 0 && matchedGeography.length === 0) return null;
  if (topics.length > 0 && matchedTopics.length !== topics.length) return null;

  const durationMatch = normalizedQuery.match(/(?:^|\s)(\d{1,2})\s*(?:days?|дн(?:я|ей)?)(?:\s|$)/);

  if (concepts.length === 0) {
    const tokens = normalizedQuery
      .split(/\s+/)
      .filter((token) => token.length >= 4 && !["argentina", "аргентина", "tour", "туры"].includes(token));
    if (tokens.length > 0 && !tokens.every((token) => haystack.includes(token))) return null;
  }

  const reasons = [...matchedGeography, ...matchedTopics].map((concept) => concept.reason);
  if (durationMatch && Math.abs(tour.durationDays - Number(durationMatch[1])) <= 2) {
    reasons.push(`Длительность близка к ${durationMatch[1]} дням`);
  }
  if (reasons.length === 0 && /argentina|аргентина/.test(normalizedQuery)) {
    reasons.push("Маршрут относится к аргентинскому каталогу");
  }
  return { tour, reasons: [...new Set(reasons)].slice(0, 2) };
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
  switch (source.kind) {
    case "query":
      return tours
        .map((tour) => matchQuery(tour, source.query))
        .filter((match): match is TourEmbedMatch => Boolean(match));
    case "destination": {
      const destination = getDestinationBySlug(source.destinationSlug);
      if (!destination) return [];
      return matchToursForDestination(tours, destination).map((tour) => ({
        tour,
        reasons: [`Маршрут связан с направлением «${destination.name}»`],
      }));
    }
    case "region":
      return tours
        .filter(
          (tour) =>
            isDefaultCatalogTour(tour) &&
            normalizeSearchText(tour.region) === normalizeSearchText(source.region),
        )
        .map((tour) => ({
          tour,
          reasons: [`Маршрут проходит по региону «${source.region}»`],
        }));
    case "slugs":
      return resolveTourEmbedListings(tours, source).map((tour) => ({
        tour,
        reasons: ["Выбран редакцией для этого материала"],
      }));
    case "preset":
      return resolveTourEmbedListings(tours, source).map((tour) => ({
        tour,
        reasons: [presetReason(tour)].filter((reason): reason is string => Boolean(reason)),
      }));
    case "organizer":
      return resolveTourEmbedListings(tours, source).map((tour) => ({
        tour,
        reasons: ["Предложение этого организатора"],
      }));
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

function parseDurationRange(title: string): { min: number; max: number } | null {
  const durationText = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const range = durationText.match(/(?:^|\s)(\d{1,2})\s*[-–—]\s*(\d{1,2})\s*(?:д[а-я]*|days?)/);
  if (range) {
    const first = Number(range[1]);
    const second = Number(range[2]);
    return { min: Math.min(first, second), max: Math.max(first, second) };
  }
  const exact = durationText.match(/(?:^|\s)(\d{1,2})\s*(?:д[а-я]*|days?)(?:\s|$)/);
  if (!exact) return null;
  const days = Number(exact[1]);
  return { min: days, max: days };
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
