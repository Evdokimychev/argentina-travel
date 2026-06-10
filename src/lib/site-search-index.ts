import { blogPosts } from "@/data/blog";
import { FAQ_ITEMS } from "@/data/faq";
import { SEARCH_DESTINATIONS } from "@/data/filters";
import { LEGAL_DOCUMENTS } from "@/data/legal-content";
import {
  SITE_FOOTER_CONTACTS,
  SITE_FOOTER_NAV,
  SITE_LEGAL_LINKS,
} from "@/data/site-links";
import type { TourListing } from "@/types";

export type SearchResultType =
  | "tour"
  | "blog"
  | "faq"
  | "page"
  | "legal"
  | "destination";

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
];

function uniqueByHref(items: SearchIndexItem[]): SearchIndexItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.href)) return false;
    seen.add(item.href);
    return true;
  });
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
  const navItems: SearchIndexItem[] = SITE_FOOTER_NAV.map((link) => ({
    id: `nav-${link.href}`,
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
    keywords: [post.category, post.author],
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

  const destinationItems: SearchIndexItem[] = SEARCH_DESTINATIONS.map((dest) => ({
    id: `dest-${dest.label}`,
    type: "destination" as const,
    title: dest.label,
    description: `${dest.type === "city" ? "Город" : dest.type === "region" ? "Регион" : dest.type === "park" ? "Парк" : "Достопримечательность"} · ${dest.region}`,
    href: `/tours?query=${encodeURIComponent(dest.label)}`,
    keywords: [dest.region, dest.type],
  }));

  return uniqueByHref([
    ...STATIC_PAGES,
    ...navItems,
    ...contactItems,
    ...blogItems,
    ...faqItems,
    ...legalItems,
    ...destinationItems,
  ]);
}

export function buildFullSearchIndex(tours: TourListing[]): SearchIndexItem[] {
  return [...buildTourSearchItems(tours), ...buildStaticSearchIndex()];
}
