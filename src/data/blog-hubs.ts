import { BLOG_START_HERE_SLUGS } from "@/data/blog-canonical-map";
import { getBlogHubImage } from "@/lib/media-resolver";
import { filterIndexableBlogPosts } from "@/lib/blog-utils";
import type { BlogPost } from "@/types";

export type BlogHubCta = {
  label: string;
  href: string;
};

export type BlogHub = {
  id: string;
  title: string;
  shortTitle: string;
  description: string;
  seoDescription: string;
  image: string;
  categories?: readonly string[];
  slugPrefixes?: readonly string[];
  pinnedSlugs?: readonly string[];
  cta?: BlogHubCta;
  /** Сколько статей показывать в превью на индексе */
  previewLimit: number;
};

export const BLOG_HUBS: readonly BlogHub[] = [
  {
    id: "national-parks",
    title: "Национальные парки",
    shortTitle: "Нацпарки",
    description:
      "Rich-гиды по паркам APN: билеты, тропы, сезоны и практика посещения — от Игуасу до Огненной Земли.",
    seoDescription:
      "Полные гиды по национальным паркам Аргентины: Игуасу, Лос-Гласьярес, Науэль-Уапи, Огненная Земля и другие — тарифы, маршруты, FAQ.",
    image: getBlogHubImage("Национальные парки"),
    categories: ["Национальные парки"],
    pinnedSlugs: [
      "natsionalnyy-park-iguasu",
      "natsionalnyy-park-los-glasiares",
      "natsionalnyy-park-nauel-uapi",
      "natsionalnyy-park-tierra-del-fuego",
      "natsionalnyy-park-talampaya",
      "wildlife-с-гидом",
    ],
    cta: {
      label: "Справочник нацпарков",
      href: "/places?collection=best-national-parks",
    },
    previewLimit: 4,
  },
  {
    id: "putevoditel",
    title: "Путеводитель",
    shortTitle: "Путеводитель",
    description:
      "Въезд, деньги, сезоны и базовая подготовка — восемь pillar-материалов для первой поездки.",
    seoDescription:
      "Путеводитель по Аргентине для туристов: виза, синий доллар, сезоны, районы Буэнос-Айреса, стейк, танго и винный маршрут.",
    image: getBlogHubImage("Путеводитель"),
    pinnedSlugs: [
      ...BLOG_START_HERE_SLUGS,
      "itinerary-ошибки",
      "itinerary-чек-лист",
      "itinerary-за-10-дней",
      "itinerary-за-14-дней",
      "wildlife-с-гидом",
    ],
    categories: ["Путеводитель", "Деньги и обмен валют"],
    slugPrefixes: ["money-"],
    cta: {
      label: "Полный путеводитель",
      href: "/guide",
    },
    previewLimit: 4,
  },
  {
    id: "patagonia",
    title: "Патагония",
    shortTitle: "Патагония",
    description:
      "Ледники, треккинг, логистика и маршруты — от Эль-Калафате до Ушуайи, включая вычитанные материалы по региону.",
    seoDescription:
      "Блог о Патагонии: советы новичкам, бюджет, сезоны, перелёты, треккинг, киты и сборы в поездку.",
    image: getBlogHubImage("Патагония"),
    categories: ["Патагония"],
    slugPrefixes: ["patagonia-"],
    pinnedSlugs: ["patagonia-packing-list", "patagonia-советы-новичкам", "patagonia-за-7-дней"],
    cta: {
      label: "Путеводитель: Патагония",
      href: "/guide/patagoniya-s-chego-nachat",
    },
    previewLimit: 6,
  },
  {
    id: "sever-i-salta",
    title: "Север и Сальта",
    shortTitle: "Север",
    description:
      "Северо-запад Аргентины: маршруты на 5–7 дней, сезон дождей, самостоятельная поездка и Quebrada de Humahuaca.",
    seoDescription:
      "Сальта и северо-запад Аргентины: маршруты, сезоны, бюджет и советы для самостоятельного путешествия.",
    image: getBlogHubImage("Север Аргентины"),
    categories: ["Север Аргентины"],
    slugPrefixes: ["northwest-"],
    pinnedSlugs: [
      "northwest-за-5-дней",
      "northwest-сезон-дождей",
      "northwest-самостоятельно",
    ],
    cta: {
      label: "Регион Сальта",
      href: "/destinations/salta",
    },
    previewLimit: 4,
  },
] as const;

const HUB_BY_ID = new Map(BLOG_HUBS.map((hub) => [hub.id, hub]));

export function getBlogHubById(id: string): BlogHub | undefined {
  return HUB_BY_ID.get(id);
}

export function getAllBlogHubIds(): string[] {
  return BLOG_HUBS.map((hub) => hub.id);
}

export function blogHubPath(hubId: string): string {
  return `/blog/hub/${hubId}`;
}

export function postMatchesBlogHub(post: BlogPost, hub: BlogHub): boolean {
  if (hub.pinnedSlugs?.includes(post.slug)) return true;
  if (hub.categories?.includes(post.category)) return true;
  if (hub.slugPrefixes?.some((prefix) => post.slug.startsWith(prefix))) return true;
  if (hub.id === "national-parks" && post.richArticleId) return true;
  return false;
}

export function getBlogHubsForPost(post: BlogPost): BlogHub[] {
  return BLOG_HUBS.filter((hub) => postMatchesBlogHub(post, hub));
}

/** Основной хаб для хлебных крошек и контекстного discovery */
export function getPrimaryBlogHubForPost(post: BlogPost): BlogHub | undefined {
  const hubs = getBlogHubsForPost(post);
  if (hubs.length === 0) return undefined;
  if (hubs.length === 1) return hubs[0];

  return [...hubs].sort((a, b) => {
    const aPinned = a.pinnedSlugs?.indexOf(post.slug) ?? -1;
    const bPinned = b.pinnedSlugs?.indexOf(post.slug) ?? -1;
    if (aPinned >= 0 && bPinned >= 0) return aPinned - bPinned;
    if (aPinned >= 0) return -1;
    if (bPinned >= 0) return 1;
    return BLOG_HUBS.findIndex((hub) => hub.id === a.id) - BLOG_HUBS.findIndex((hub) => hub.id === b.id);
  })[0];
}

export function getBlogHubPinnedPosts(hub: BlogHub, catalog: BlogPost[]): BlogPost[] {
  const pinned = hub.pinnedSlugs ?? [];
  if (pinned.length === 0) return [];

  const bySlug = new Map(getBlogHubPosts(hub, catalog).map((post) => [post.slug, post]));
  return pinned
    .map((slug) => bySlug.get(slug))
    .filter((post): post is BlogPost => post !== undefined);
}

function hubPostRank(post: BlogPost, hub: BlogHub): number {
  const pinned = hub.pinnedSlugs ?? [];
  const pinnedIndex = pinned.indexOf(post.slug);
  if (pinnedIndex >= 0) return pinnedIndex;

  let score = 100;
  if (post.richArticleId) score -= 40;
  if (post.featured) score -= 20;
  if (post.editorialReviewed) score -= 10;
  if (hub.categories?.includes(post.category)) score -= 5;
  return score;
}

export function getBlogHubPosts(hub: BlogHub, catalog: BlogPost[]): BlogPost[] {
  const indexable = filterIndexableBlogPosts(catalog).filter((post) => postMatchesBlogHub(post, hub));

  return [...indexable].sort((a, b) => {
    const rankDiff = hubPostRank(a, hub) - hubPostRank(b, hub);
    if (rankDiff !== 0) return rankDiff;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}

export function getBlogHubPreviewPosts(hub: BlogHub, catalog: BlogPost[]): BlogPost[] {
  return getBlogHubPosts(hub, catalog).slice(0, hub.previewLimit);
}

export function countBlogHubPosts(hub: BlogHub, catalog: BlogPost[]): number {
  return getBlogHubPosts(hub, catalog).length;
}

export function getBlogHubFreshPosts(
  hub: BlogHub,
  catalog: BlogPost[],
  limit = 4,
  excludeSlug?: string,
): BlogPost[] {
  const posts = getBlogHubPosts(hub, catalog);
  const filtered = excludeSlug ? posts.filter((post) => post.slug !== excludeSlug) : posts;
  return filtered.slice(0, limit);
}

export function getBlogHubCategoriesWithCounts(
  hub: BlogHub,
  catalog: BlogPost[],
): { category: string; count: number }[] {
  const hubPosts = getBlogHubPosts(hub, catalog);
  const map = new Map<string, number>();
  for (const post of hubPosts) {
    map.set(post.category, (map.get(post.category) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count || a.category.localeCompare(b.category, "ru"));
}

export function getBlogHubTopTags(hub: BlogHub, catalog: BlogPost[], limit = 12): string[] {
  const hubPosts = getBlogHubPosts(hub, catalog);
  const counts = new Map<string, number>();
  for (const post of hubPosts) {
    for (const tag of post.tags) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "ru"))
    .slice(0, limit)
    .map(([tag]) => tag);
}
