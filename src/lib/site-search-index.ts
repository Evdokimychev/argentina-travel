import { blogPosts } from "@/data/blog";
import { FAQ_ITEMS } from "@/data/faq";
import { SEARCH_DESTINATIONS } from "@/data/filters";
import { LEGAL_DOCUMENTS } from "@/data/legal-content";
import {
  SITE_FOOTER_CONTACTS,
  SITE_FOOTER_NAV,
  SITE_LEGAL_LINKS,
} from "@/data/site-links";
import { DESTINATION_PAGES } from "@/data/destination-pages";
import { SHOP_PRODUCTS } from "@/data/shop-products";
import { SERVICE_CATEGORIES } from "@/data/services-hub";
import { buildContentSearchItems } from "@/lib/content-pages";
import { buildGuideTopicSearchItems } from "@/lib/guide-topics";
import { flattenSiteNavSections } from "@/lib/site-nav";
import { SITE_NAV_SECTIONS } from "@/data/site-nav";
import type { TourListing } from "@/types";

export type SearchResultType =
  | "tour"
  | "blog"
  | "faq"
  | "page"
  | "legal"
  | "destination"
  | "guide"
  | "immigration";

export type SearchIndexItem = {
  id: string;
  type: SearchResultType;
  title: string;
  description?: string;
  href: string;
  keywords?: string[];
};

export const SEARCH_TYPE_LABELS: Record<SearchResultType, string> = {
  tour: "Туры",
  blog: "Блог",
  faq: "FAQ",
  page: "Страницы",
  legal: "Документы",
  destination: "Направления",
  guide: "Путеводитель",
  immigration: "Иммиграция",
};

const STATIC_PAGES: SearchIndexItem[] = [
  {
    id: "page-about",
    type: "page",
    title: "О проекте",
    description: "Миссия, ценности и визуальный язык платформы Argentina Travel.",
    href: "/about",
    keywords: ["о нас", "миссия", "команда"],
  },
  {
    id: "page-join",
    type: "page",
    title: "Для организаторов",
    description: "Подключите роль организатора и публикуйте авторские туры.",
    href: "/join",
    keywords: ["организатор", "партнёр", "автор туров"],
  },
  {
    id: "page-contacts",
    type: "page",
    title: "Контакты",
    description: "Свяжитесь с командой платформы по вопросам туров и сотрудничества.",
    href: "/contacts",
    keywords: ["написать", "телефон", "email", "поддержка"],
  },
  {
    id: "page-booking-find",
    type: "page",
    title: "Найти заявку",
    description: "Поиск бронирования по email без входа в аккаунт.",
    href: "/booking/find",
    keywords: ["бронирование", "заявка", "email"],
  },
  {
    id: "page-tours",
    type: "page",
    title: "Каталог туров",
    description: "Все авторские туры по Аргентине с фильтрами и картой.",
    href: "/tours",
    keywords: ["каталог", "маркетплейс", "поиск туров"],
  },
  {
    id: "page-blog",
    type: "page",
    title: "Блог",
    description: "Статьи о путешествиях, культуре и гастрономии Аргентины.",
    href: "/blog",
    keywords: ["статьи", "советы", "гид"],
  },
  {
    id: "page-faq",
    type: "page",
    title: "Частые вопросы",
    description: "Ответы о бронировании, оплате и работе с организаторами.",
    href: "/faq",
    keywords: ["вопросы", "помощь", "поддержка"],
  },
  {
    id: "page-destinations",
    type: "page",
    title: "Направления",
    description: "Регионы и города Аргентины с подборкой туров.",
    href: "/destinations",
    keywords: ["регионы", "города", "патагония"],
  },
  {
    id: "page-guide",
    type: "page",
    title: "Путеводитель",
    description: "Статьи и советы для планирования поездки в Аргентину.",
    href: "/guide",
    keywords: ["гид", "советы", "планирование"],
  },
  {
    id: "page-immigration",
    type: "page",
    title: "Иммиграция и въезд",
    description: "Визы, документы для въезда и обзор видов ВНЖ в Аргентине.",
    href: "/immigration",
    keywords: ["виза", "внж", "миграция", "документы"],
  },
  {
    id: "page-gallery",
    type: "page",
    title: "Галерея",
    description: "Фотографии из авторских туров по регионам Аргентины.",
    href: "/gallery",
    keywords: ["фото", "галерея", "патагония", "снимки"],
  },
  {
    id: "page-shop",
    type: "page",
    title: "Магазин гидов",
    description: "PDF-путеводители и чеклисты для подготовки к поездке.",
    href: "/shop",
    keywords: ["гид", "pdf", "чеклист", "путеводитель"],
  },
  {
    id: "page-services",
    type: "page",
    title: "Сервисы для поездки",
    description: "Перелёты, трансферы, страхование и визовая поддержка.",
    href: "/services",
    keywords: ["авиабилеты", "трансфер", "страховка", "виза"],
  },
];

const SEARCH_TYPE_PRIORITY: Record<SearchResultType, number> = {
  tour: 10,
  blog: 9,
  guide: 8,
  immigration: 7,
  destination: 6,
  faq: 5,
  legal: 4,
  page: 1,
};

function dedupeSearchIndex(items: SearchIndexItem[]): SearchIndexItem[] {
  const byHref = new Map<string, SearchIndexItem>();
  const faqItems: SearchIndexItem[] = [];

  for (const item of items) {
    if (item.type === "faq") {
      faqItems.push(item);
      continue;
    }

    const existing = byHref.get(item.href);
    if (!existing) {
      byHref.set(item.href, item);
      continue;
    }

    const itemPriority = SEARCH_TYPE_PRIORITY[item.type];
    const existingPriority = SEARCH_TYPE_PRIORITY[existing.type];

    if (itemPriority > existingPriority) {
      byHref.set(item.href, item);
      continue;
    }

    if (itemPriority === existingPriority) {
      const itemRichness = (item.keywords?.length ?? 0) + (item.description ? 1 : 0);
      const existingRichness =
        (existing.keywords?.length ?? 0) + (existing.description ? 1 : 0);
      if (itemRichness > existingRichness) {
        byHref.set(item.href, item);
      }
    }
  }

  return [...byHref.values(), ...faqItems];
}

export function buildTourSearchItems(tours: TourListing[]): SearchIndexItem[] {
  return tours.map((tour) => ({
    id: `tour-${tour.slug}`,
    type: "tour" as const,
    title: tour.title,
    description: tour.shortDescription,
    href: `/tours/${tour.slug}`,
    keywords: [tour.destination, tour.region, tour.activityType],
  }));
}

export function buildStaticSearchIndex(): SearchIndexItem[] {
  const flatNav = flattenSiteNavSections(SITE_NAV_SECTIONS);
  const seenNav = new Set<string>();
  const navItems: SearchIndexItem[] = flatNav
    .filter((link) => {
      if (seenNav.has(link.href)) return false;
      seenNav.add(link.href);
      return true;
    })
    .map((link) => ({
      id: `nav-${link.id}`,
      type: "page" as const,
      title: link.label,
      description: link.description ?? link.columnTitle,
      href: link.href,
      keywords: [link.sectionLabel, link.columnTitle].filter(Boolean) as string[],
    }));

  const footerNavItems: SearchIndexItem[] = SITE_FOOTER_NAV.map((link) => ({
    id: `footer-${link.href}`,
    type: "page" as const,
    title: link.label,
    href: link.href,
  }));

  const contactItems: SearchIndexItem[] = SITE_FOOTER_CONTACTS.map((link) => ({
    id: `contact-${link.href}`,
    type: "page" as const,
    title: link.label,
    href: link.href,
  }));

  const blogItems: SearchIndexItem[] = blogPosts.map((post) => ({
    id: `blog-${post.slug}`,
    type: "blog" as const,
    title: post.title,
    description: post.excerpt,
    href: `/blog/${post.slug}`,
    keywords: [post.category, post.author, post.slug.replace(/-/g, " ")],
  }));

  const faqItems: SearchIndexItem[] = FAQ_ITEMS.map((item, index) => ({
    id: `faq-${index}`,
    type: "faq" as const,
    title: item.question,
    description: item.answer,
    href: "/faq",
    keywords: ["вопрос", "ответ", "помощь"],
  }));

  const legalItems: SearchIndexItem[] = [
    ...SITE_LEGAL_LINKS.map((link) => ({
      id: `legal-link-${link.href}`,
      type: "legal" as const,
      title: link.label,
      href: link.href,
    })),
    ...Object.values(LEGAL_DOCUMENTS).map((doc) => ({
      id: `legal-${doc.slug}`,
      type: "legal" as const,
      title: doc.title,
      description: doc.description,
      href: `/legal/${doc.slug}`,
      keywords: doc.sections
        .flatMap((section) => [section.heading, ...(section.paragraphs ?? []), ...(section.list ?? [])])
        .filter(Boolean) as string[],
    })),
  ];

  const destinationPageItems: SearchIndexItem[] = [
    {
      id: "destinations-index",
      type: "destination",
      title: "Все направления",
      description: "Регионы и города Аргентины с турами",
      href: "/destinations",
      keywords: ["направления", "регионы", "города"],
    },
    ...DESTINATION_PAGES.map((page) => ({
      id: `destination-page-${page.id}`,
      type: "destination" as const,
      title: page.name,
      description: page.intro,
      href: `/destinations/${page.id}`,
      keywords: [page.region, ...page.keywords],
    })),
  ];

  const destinationItems: SearchIndexItem[] = SEARCH_DESTINATIONS.map((dest) => ({
    id: `dest-${dest.label}`,
    type: "destination" as const,
    title: dest.label,
    description: `${dest.type === "city" ? "Город" : dest.type === "region" ? "Регион" : dest.type === "park" ? "Парк" : "Достопримечательность"} · ${dest.region}`,
    href: `/tours?query=${encodeURIComponent(dest.label)}`,
    keywords: [dest.region, dest.type],
  }));

  const contentItems = buildContentSearchItems();
  const guideTopicItems = buildGuideTopicSearchItems();

  const shopItems: SearchIndexItem[] = SHOP_PRODUCTS.map((product) => ({
    id: `shop-${product.slug}`,
    type: "page" as const,
    title: product.title,
    description: product.description,
    href: `/contacts?product=${product.slug}`,
    keywords: ["магазин", "pdf", product.format],
  }));

  const serviceItems: SearchIndexItem[] = SERVICE_CATEGORIES.flatMap((category) =>
    category.items
      .filter((item) => !item.external)
      .map((item) => ({
        id: `service-${item.id}`,
        type: "page" as const,
        title: item.title,
        description: item.description,
        href: item.href,
        keywords: ["сервисы", category.title, item.slug],
      }))
  );

  return dedupeSearchIndex([
    ...STATIC_PAGES,
    ...navItems,
    ...footerNavItems,
    ...contactItems,
    ...blogItems,
    ...faqItems,
    ...legalItems,
    ...destinationPageItems,
    ...destinationItems,
    ...contentItems,
    ...guideTopicItems,
    ...shopItems,
    ...serviceItems,
  ]);
}

export function buildFullSearchIndex(tours: TourListing[]): SearchIndexItem[] {
  return [...buildTourSearchItems(tours), ...buildStaticSearchIndex()];
}

/** Alias for static/content index without tours. */
export const buildSiteSearchIndex = buildStaticSearchIndex;
