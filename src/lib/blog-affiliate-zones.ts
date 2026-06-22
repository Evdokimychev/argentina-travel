import type { BlogPost } from "@/types";

export type BlogAffiliateService = "car-rental" | "insurance" | "esim";

export type BlogAffiliateCard = {
  service: BlogAffiliateService;
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
};

const AFFILIATE_CARDS: Record<BlogAffiliateService, BlogAffiliateCard> = {
  "car-rental": {
    service: "car-rental",
    title: "Аренда авто в Аргентине",
    description: "Сравните предложения для Патагонии, северо-запада и маршрутов между городами",
    href: "/car-rental",
    ctaLabel: "Подобрать авто",
  },
  insurance: {
    service: "insurance",
    title: "Медстраховка для поездки",
    description: "Полис для туристов и длительного пребывания — оформление онлайн",
    href: "/insurance",
    ctaLabel: "Выбрать полис",
  },
  esim: {
    service: "esim",
    title: "eSIM и связь в Аргентине",
    description: "Интернет с первого дня — без поиска местной SIM в аэропорту",
    href: "/esim",
    ctaLabel: "Смотреть тарифы",
  },
};

const CATEGORY_SERVICES: Record<string, BlogAffiliateService[]> = {
  Патагония: ["car-rental", "insurance"],
  "Север Аргентины": ["car-rental", "insurance"],
  "Горы и треккинг": ["insurance", "car-rental"],
  Путеводитель: ["insurance", "esim"],
  "Деньги и обмен валют": ["esim", "insurance"],
  Транспорт: ["car-rental", "esim"],
  Практика: ["esim", "insurance"],
};

const TAG_SERVICES: Record<string, BlogAffiliateService> = {
  связь: "esim",
  esim: "esim",
  sim: "esim",
  страховка: "insurance",
  медицина: "insurance",
  авто: "car-rental",
  аренда: "car-rental",
  логистика: "car-rental",
};

/** Контекстные партнёрские карточки по категории и тегам статьи (макс. 2). */
export function resolveBlogAffiliateCards(post: BlogPost, limit = 2): BlogAffiliateCard[] {
  const ordered: BlogAffiliateService[] = [];

  for (const service of CATEGORY_SERVICES[post.category] ?? ["insurance", "esim"]) {
    if (!ordered.includes(service)) ordered.push(service);
  }

  for (const tag of post.tags) {
    const service = TAG_SERVICES[tag.toLowerCase()];
    if (service && !ordered.includes(service)) ordered.push(service);
  }

  if (ordered.length === 0) {
    ordered.push("insurance", "esim");
  }

  return ordered.slice(0, limit).map((service) => AFFILIATE_CARDS[service]);
}
