import type { ImageQuery, ImageRole, ResolvedImage } from "./types";
import type { ManifestBinding } from "./local-fallback";

export interface PageRegistryEntry {
  pageId: string;
  route: string;
  label: string;
  binding: ManifestBinding;
  hero?: ImageQuery;
  gallery?: ImageQuery[];
  sections?: Record<string, ImageQuery>;
  card?: ImageQuery;
}

const GUIDE_TOPIC_SLUGS = [
  "kak-dobratsya",
  "gde-zhit",
  "transport",
  "turistskie-regiony",
  "dostoprimechatelnosti",
  "pogoda-i-sezonnost",
  "yazyk",
  "kultura",
  "istoriya",
  "kukhnya",
  "svyaz",
  "ekonomika-i-dengi",
  "shopping",
  "bezopasnost",
] as const;

const IMMIGRATION_TOPICS = [
  "zhizn-v-strane",
  "protsess-immigratsii",
  "rody-v-argentine",
  "grazhdanstvo",
  "vnzh-i-pmzh",
  "vozmozhnosti",
  "poleznye-ssylki",
] as const;

const SERVICE_PAGES: Array<{ id: string; route: string; label: string }> = [
  { id: "home", route: "/", label: "Главная" },
  { id: "flights", route: "/flights", label: "Авиабилеты" },
  { id: "insurance", route: "/insurance", label: "Страхование" },
  { id: "esim", route: "/esim", label: "eSIM" },
  { id: "car-rental", route: "/car-rental", label: "Аренда авто" },
  { id: "transfers", route: "/transfers", label: "Трансферы" },
  { id: "services", route: "/services", label: "Сервисы" },
  { id: "shop", route: "/shop", label: "Магазин" },
  { id: "audio-guides", route: "/audio-guides", label: "Аудиогиды" },
  { id: "blog-index", route: "/blog", label: "Блог" },
  { id: "contacts", route: "/contacts", label: "Контакты" },
  { id: "gallery", route: "/gallery", label: "Галерея" },
  { id: "guide-hub", route: "/guide", label: "Путеводитель" },
];

const PODBOR_REGIONS = [
  "patagonia",
  "bariloche",
  "iguazu",
  "mendoza",
  "salta",
  "buenos-aires",
  "ushuaia",
] as const;

const PODBOR_THEMES = [
  "nature",
  "city",
  "wine",
  "glacier",
  "falls",
  "tango",
  "penguins",
  "mountains",
  "relax",
  "family",
  "relocation",
  "business",
  "expedition",
  "honeymoon",
  "photo",
] as const;

const BLOG_POSTS = [
  "best-time-to-visit-argentina",
  "argentinian-steak-guide",
  "blue-dollar-argentina-2026",
  "money-карты",
  "argentina-tourist-visa-2026",
  "buenos-aires-neighborhoods",
  "patagonia-packing-list",
  "patagonia-автобусы",
  "patagonia-аренда-авто",
  "patagonia-авиабилеты",
  "patagonia-отели",
  "mendoza-wine-route",
  "tango-beginners-guide",
  "salta-i-severo-zapad-marshrut",
  "uco-valley-vino-i-gory",
  "el-chalten-i-fitts-roy",
  "patagoniya-marshrut-14-dney",
  "itinerary-чек-лист",
  "itinerary-ошибки",
  "itinerary-за-10-дней",
  "itinerary-за-14-дней",
  "wildlife-с-гидом",
  "natsionalnyy-park-tierra-del-fuego",
  "natsionalnyy-park-nauel-uapi",
  "natsionalnyy-park-los-glasiares",
  "natsionalnyy-park-iguasu",
  "natsionalnyy-park-poluostrov-valdes",
  "natsionalnye-parki-argentiny",
  "natsionalnyy-park-ibera",
  "natsionalnyy-park-lanin",
  "natsionalnyy-park-los-alerses",
  "natsionalnyy-park-los-cardones",
  "natsionalnyy-park-patagonia",
  "natsionalnyy-park-talampaya",
  "banado-la-estrella",
] as const;

const RICH_ARTICLE_SECTION_SLOT_IDS = [
  "section-landmark",
  "section-trails",
  "section-wildlife",
  "section-overview",
  "section-seasons",
  "section-logistics",
] as const;

const RICH_ARTICLES = [
  "all-argentina-national-parks",
  "banado-la-estrella",
  "iguazu-national-park",
  "ibera-national-park",
  "lanin-national-park",
  "los-alerces-national-park",
  "nahuel-huapi-national-park",
  "los-glaciares-national-park",
  "los-cardones-national-park",
  "patagonia-national-park",
  "talampaya-national-park",
  "tierra-del-fuego-national-park",
  "valdes-peninsula-national-park",
] as const;

const SHOP_PRODUCTS = [
  { id: "shop-patagonia-guide", label: "PDF Патагония" },
  { id: "shop-ba-guide", label: "Гид Буэнос-Айрес" },
  { id: "shop-immigration-checklist", label: "Чек-лист иммиграции" },
  { id: "shop-wine-guide", label: "Винный гид" },
  { id: "shop-northwest-guide", label: "Северо-запад" },
  { id: "shop-family-checklist", label: "Семейный чек-лист" },
] as const;

const DESTINATION_IDS = [
  "ba",
  "bariloche",
  "calafate",
  "ushuaia",
  "iguazu",
  "mendoza",
  "salta",
  "patagonia",
] as const;

function entry(
  pageId: string,
  route: string,
  label: string,
  binding: ManifestBinding,
  hero?: ImageQuery,
): PageRegistryEntry {
  return { pageId, route, label, binding, hero };
}

const STATIC_ENTRIES: PageRegistryEntry[] = [
  entry("immigration:hub", "/immigration", "Иммиграция — хаб", {
    servicePageId: "immigration-hub",
    assetId: "immigration-hub-hero",
  }),
  ...IMMIGRATION_TOPICS.map((slug) =>
    entry(`immigration:${slug}`, `/immigration/${slug}`, `Иммиграция — ${slug}`, {
      immigrationTopicId: slug,
    }),
  ),
  ...SERVICE_PAGES.map((s) =>
    entry(`service:${s.id}`, s.route, s.label, { servicePageId: s.id }),
  ),
  ...PODBOR_REGIONS.map((id) =>
    entry(`podbor:region:${id}`, "/podbor", `Подбор — ${id}`, { podborRegionId: id }),
  ),
  ...PODBOR_THEMES.map((id) =>
    entry(`podbor:theme:${id}`, "/podbor", `Подбор — тема ${id}`, { podborThemeId: id }),
  ),
  ...BLOG_POSTS.map((slug) =>
    entry(`blog:${slug}`, `/blog/${slug}`, `Блог — ${slug}`, { blogPostSlug: slug }),
  ),
  ...RICH_ARTICLES.map((id) => ({
    ...entry(`rich:${id}`, `/blog/${id}`, `Rich — ${id}`, { articleId: id }),
    sections: Object.fromEntries(
      RICH_ARTICLE_SECTION_SLOT_IDS.map((slotId) => [
        slotId,
        {
          query: `${id.replace(/-/g, " ")} ${slotId.replace("section-", "")} Argentina`,
          role: "section" as const,
          alt: `Национальный парк — ${slotId.replace("section-", "")}`,
        },
      ]),
    ),
  })),
  ...SHOP_PRODUCTS.map((p) =>
    entry(`shop:${p.id}`, `/shop`, p.label, { shopProductId: p.id }),
  ),
  ...GUIDE_TOPIC_SLUGS.map((slug) =>
    entry(`guide:${slug}`, `/guide/${slug}`, `Путеводитель — ${slug}`, { guideTopicId: slug }),
  ),
  ...DESTINATION_IDS.map((id) =>
    entry(`destination:${id}`, `/destinations/${id}`, `Направление — ${id}`, {
      destinationId: id,
    }),
  ),
  entry("tours:index", "/tours", "Каталог туров", { placeId: "perito-moreno-glacier" }),
  entry("excursions:index", "/excursions", "Экскурсии", { placeId: "buenos-aires" }),
  entry("destinations:hub", "/destinations", "География", { placeId: "el-chalten" }),
  entry("guide:ob-argentine", "/guide/ob-argentine", "Об Аргентине", {
    guidePageSlug: "ob-argentine",
    placeId: "buenos-aires",
  }),
];

const PAGE_REGISTRY: Record<string, PageRegistryEntry> = Object.fromEntries(
  STATIC_ENTRIES.map((e) => [e.pageId, e]),
);

export function getPageEntry(pageId: string): PageRegistryEntry | undefined {
  return PAGE_REGISTRY[pageId];
}

export function getAllPageEntries(): PageRegistryEntry[] {
  return STATIC_ENTRIES;
}

export function resolvePageIdFromRoute(route: string): string | undefined {
  const normalized = route.replace(/\/$/, "") || "/";
  const exact = STATIC_ENTRIES.find((e) => e.route === normalized);
  if (exact) return exact.pageId;

  const blogMatch = normalized.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) return `blog:${blogMatch[1]}`;

  const guideMatch = normalized.match(/^\/guide\/([^/]+)$/);
  if (guideMatch) return `guide:${guideMatch[1]}`;

  const immigrationMatch = normalized.match(/^\/immigration\/([^/]+)$/);
  if (immigrationMatch) return `immigration:${immigrationMatch[1]}`;

  const destinationMatch = normalized.match(/^\/destinations\/([^/]+)$/);
  if (destinationMatch) return `destination:${destinationMatch[1]}`;

  const tourMatch = normalized.match(/^\/tours\/([^/]+)$/);
  if (tourMatch) return `tour:${tourMatch[1]}`;

  return undefined;
}

export function resolveRoleQuery(
  entry: PageRegistryEntry,
  role: ImageRole,
  sectionId?: string,
): ImageQuery | undefined {
  if (role === "hero") return entry.hero;
  if (role === "gallery") return entry.gallery?.[0];
  if ((role === "section" || role === "content") && sectionId) return entry.sections?.[sectionId];
  if (role === "card") return entry.card;
  if (role === "background") return entry.hero;
  return undefined;
}
