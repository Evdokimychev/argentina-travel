import type { BlogPost } from "@/types";
import type { ExcursionListing } from "@/types/excursion";
import type { KbEntry } from "@/lib/knowledge-base/types";

export type ContentExcursionMatch = {
  excursion: ExcursionListing;
  score: number;
  reasons: string[];
};

type MatchConcept = {
  id: string;
  kind: "geography" | "topic";
  keys: string[];
  signals: string[];
  reason: string;
  broad?: boolean;
};

const CONCEPTS: MatchConcept[] = [
  {
    id: "buenos-aires",
    kind: "geography",
    keys: ["buenos", "буэнос"],
    signals: ["buenos", "буэнос", "palermo", "палермо", "recoleta", "реколета", "san telmo", "сан-тельмо"],
    reason: "проходит в Буэнос-Айресе",
  },
  {
    id: "iguazu",
    kind: "geography",
    keys: ["iguazu", "iguassu", "игуасу"],
    signals: ["iguaz", "iguassu", "игуас", "garganta", "misiones", "мисьонес"],
    reason: "связана с водопадами Игуасу",
  },
  {
    id: "mendoza",
    kind: "geography",
    keys: ["mendoza", "мендоса", "uco", "уко"],
    signals: ["mendoza", "мендос", "uco", "уко", "maipu", "майпу", "lujan de cuyo", "лухан-де-куйо"],
    reason: "проходит в винном регионе Мендосы",
  },
  {
    id: "bariloche",
    kind: "geography",
    keys: ["bariloche", "барилоче", "nahuel huapi", "науэль-уапи"],
    signals: ["bariloch", "барилоч", "nahuel", "науэль", "campanario", "кампанарио"],
    reason: "проходит в Барилоче или Озёрном крае",
  },
  {
    id: "calafate",
    kind: "geography",
    keys: ["calafate", "калафате", "perito moreno", "перито-морено"],
    signals: ["calafate", "калафат", "perito", "перито", "los glaciares", "лос-гласьярес"],
    reason: "связана с Эль-Калафате и ледниками",
  },
  {
    id: "chalten",
    kind: "geography",
    keys: ["chalten", "чальтен", "fitz roy", "фицрой"],
    signals: ["chalten", "чальтен", "fitz", "фицрой", "laguna de los tres"],
    reason: "проходит в районе Эль-Чальтена и Фицроя",
  },
  {
    id: "ushuaia",
    kind: "geography",
    keys: ["ushuaia", "ушуайя", "tierra del fuego", "огненная земля"],
    signals: ["ushuaia", "ушуай", "tierra del fuego", "огнен", "beagle", "бигль"],
    reason: "проходит в Ушуайе или на Огненной Земле",
  },
  {
    id: "salta",
    kind: "geography",
    keys: ["salta", "сальта", "northwest", "северо-запад", "jujuy", "жужуй"],
    signals: ["salta", "сальт", "jujuy", "жужуй", "cafayate", "кафаяте", "purmamarca", "пурмамарка"],
    reason: "проходит на северо-западе Аргентины",
  },
  {
    id: "valdes",
    kind: "geography",
    keys: ["valdes", "вальдес", "puerto madryn", "пуэрто-мадрин"],
    signals: ["valdes", "вальдес", "madryn", "мадрин"],
    reason: "связана с полуостровом Вальдес или Пуэрто-Мадрином",
  },
  {
    id: "patagonia",
    kind: "geography",
    keys: ["patagonia", "patagon", "патагон"],
    signals: ["patagon", "патагон", "calafate", "калафат", "bariloch", "барилоч", "ushuaia", "ушуай", "chalten", "чальтен"],
    reason: "проходит в Патагонии",
    broad: true,
  },
  {
    id: "wine",
    kind: "topic",
    keys: ["wine", "вино", "винн", "винодель"],
    signals: ["wine", "вино", "винн", "винодель", "malbec", "мальбек", "bodega", "бодега", "дегустац"],
    reason: "посвящена винодельням или дегустациям",
  },
  {
    id: "tango",
    kind: "topic",
    keys: ["tango", "танго", "milonga", "милонга"],
    signals: ["tango", "танго", "milonga", "милонга"],
    reason: "знакомит с танго или милонгами",
  },
  {
    id: "food",
    kind: "topic",
    keys: ["кухн", "гастроном", "food", "asado", "асадо", "parrilla", "парриль"],
    signals: ["гастроном", "food", "asado", "асадо", "parrilla", "парриль", "стейк", "кулинар", "рынок", "дегустац"],
    reason: "дополняет материал знакомством с аргентинской кухней",
  },
  {
    id: "penguins",
    kind: "topic",
    keys: ["penguin", "пингвин"],
    signals: ["penguin", "пингвин", "punta tombo", "пунта-томбо", "martillo", "мартильо"],
    reason: "связана с наблюдением за пингвинами",
  },
  {
    id: "whales",
    kind: "topic",
    keys: ["whale", "кит"],
    signals: ["whale", "кит", "ballena", "баллен"],
    reason: "связана с наблюдением за китами",
  },
  {
    id: "wildlife",
    kind: "topic",
    keys: ["wildlife", "дикая природа", "fauna", "фауна"],
    signals: ["wildlife", "дикая природа", "fauna", "фауна", "сафари", "пингвин", "кит", "ибера", "ibera"],
    reason: "посвящена наблюдению за дикой природой",
  },
  {
    id: "national-parks",
    kind: "topic",
    keys: ["national park", "национальн парк", "нацпарк"],
    signals: ["national park", "национальн парк", "нацпарк", "parque nacional", "iguazu", "игуасу", "los glaciares"],
    reason: "связана с посещением национального парка",
  },
  {
    id: "trekking",
    kind: "topic",
    keys: ["trek", "трек", "поход", "hiking", "горы"],
    signals: ["trek", "трек", "поход", "hiking", "восхожд", "гора", "лагун"],
    reason: "подходит к теме треккинга и активных маршрутов",
  },
];

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ё/g, "е")
    .replace(/[^a-z0-9а-я\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesSignal(haystack: string, signal: string): boolean {
  const normalizedSignal = normalize(signal);
  if (!normalizedSignal) return false;
  if (normalizedSignal.includes(" ") || normalizedSignal.length > 4) {
    return haystack.includes(normalizedSignal);
  }
  const escaped = normalizedSignal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|\\s)${escaped}[a-zа-я]{0,5}(?:\\s|$)`, "i").test(haystack);
}

function extractConcepts(text: string): MatchConcept[] {
  const normalized = normalize(text);
  const concepts = CONCEPTS.filter((concept) =>
    concept.keys.some((key) => includesSignal(normalized, key)),
  );
  const hasSpecificPatagoniaLocation = concepts.some((concept) =>
    ["bariloche", "calafate", "chalten", "ushuaia", "valdes"].includes(concept.id),
  );
  return concepts.filter((concept) => !(concept.broad && hasSpecificPatagoniaLocation));
}

function excursionHaystack(excursion: ExcursionListing): string {
  return normalize(
    [
      excursion.title,
      excursion.tagline,
      excursion.cityName,
      excursion.citySlug,
      excursion.format,
    ]
      .filter(Boolean)
      .join(" "),
  );
}

function matchExcursion(
  excursion: ExcursionListing,
  concepts: MatchConcept[],
): ContentExcursionMatch | null {
  if (excursion.partner !== "tripster" && excursion.partner !== "sputnik8") return null;
  if (concepts.length === 0) return null;

  const haystack = excursionHaystack(excursion);
  const geography = concepts.filter((concept) => concept.kind === "geography");
  const topics = concepts.filter((concept) => concept.kind === "topic");
  const matchedGeography = geography.filter((concept) =>
    concept.signals.some((signal) => includesSignal(haystack, signal)),
  );
  const matchedTopics = topics.filter((concept) =>
    concept.signals.some((signal) => includesSignal(haystack, signal)),
  );

  if (geography.length > 0 && matchedGeography.length === 0) return null;
  if (topics.length > 0 && matchedTopics.length === 0) return null;

  const reasons = [...matchedGeography, ...matchedTopics].map((concept) => concept.reason);
  if (reasons.length === 0) return null;
  const score =
    matchedGeography.length * 45 +
    matchedTopics.length * 30 +
    Math.min(excursion.rating ?? 0, 5) * 2 +
    Math.min(excursion.reviewCount, 100) * 0.05;
  return { excursion, score, reasons: [...new Set(reasons)].slice(0, 2) };
}

function rankMatches(
  excursions: ExcursionListing[],
  contexts: string[],
  limit: number,
): ContentExcursionMatch[] {
  const concepts = [...new Map(
    contexts.flatMap(extractConcepts).map((concept) => [concept.id, concept] as const),
  ).values()];
  if (concepts.length === 0) return [];

  return excursions
    .map((excursion) => matchExcursion(excursion, concepts))
    .filter((match): match is ContentExcursionMatch => Boolean(match))
    .sort(
      (a, b) =>
        b.score - a.score ||
        (b.excursion.rating ?? 0) - (a.excursion.rating ?? 0) ||
        b.excursion.reviewCount - a.excursion.reviewCount,
    )
    .slice(0, limit);
}

export function resolveExcursionsForBlogPost(
  post: Pick<BlogPost, "title" | "category" | "tags" | "tourEmbeds">,
  excursions: ExcursionListing[],
  limit = 6,
): ContentExcursionMatch[] {
  const embedQueries = (post.tourEmbeds ?? [])
    .map((embed) => (embed.source.kind === "query" ? embed.source.query : ""))
    .filter(Boolean);
  const fallbackContext = [post.title, post.category, ...post.tags].join(" ");
  return rankMatches(excursions, embedQueries.length > 0 ? embedQueries : [fallbackContext], limit);
}

export function resolveExcursionsForKnowledgeEntry(
  entry: Pick<KbEntry, "type" | "title" | "summary" | "aliases" | "tags" | "topic">,
  excursions: ExcursionListing[],
  limit = 6,
): ContentExcursionMatch[] {
  const eligibleTypes = new Set<KbEntry["type"]>([
    "city",
    "guide",
    "national_park",
    "attraction",
    "region",
    "route",
  ]);
  if (!eligibleTypes.has(entry.type)) return [];
  const context = [
    entry.title,
    entry.summary,
    ...(entry.aliases ?? []),
    ...(entry.tags ?? []),
    entry.topic,
  ]
    .filter(Boolean)
    .join(" ");
  return rankMatches(excursions, [context], limit);
}
