import { blogPosts } from "@/data/blog";
import { contentPageListItem, getPagesBySection } from "@/lib/content-pages";
import type { BlogPost } from "@/types";

export type GuideHubLink = {
  id: string;
  label: string;
  href: string;
  description?: string;
};

export type GuideHubCategory = {
  id: string;
  title: string;
  description: string;
  links: GuideHubLink[];
};

export const GUIDE_HUB_INTRO =
  "Практические материалы для планирования поездки: сезоны, культура, гастрономия, иммиграция и ответы на частые вопросы. Всё ведёт к турам и бронированию на платформе.";

function blogLink(post: BlogPost): GuideHubLink {
  return {
    id: `blog-${post.slug}`,
    label: post.title,
    href: `/blog/${post.slug}`,
    description: `${post.category} · ${post.readTime}`,
  };
}

function guideLink(slug: string): GuideHubLink {
  const page = getPagesBySection("guide").find((item) => item.slug === slug);
  if (!page) throw new Error(`Missing guide page: ${slug}`);
  return contentPageListItem(page);
}

const immigrationArticles = getPagesBySection("immigration").map(contentPageListItem);

export const GUIDE_HUB_CATEGORIES: GuideHubCategory[] = [
  {
    id: "planning",
    title: "Планирование поездки",
    description: "Сезоны, климат и подготовка к маршруту",
    links: [
      guideLink("sezony-i-klimat"),
      guideLink("patagoniya-s-chego-nachat"),
      {
        id: "guide-destinations",
        label: "Все направления",
        href: "/destinations",
        description: "Лендинги регионов и туры",
      },
    ],
  },
  {
    id: "culture",
    title: "Культура и гастрономия",
    description: "Местные традиции, еда и городской опыт",
    links: [guideLink("gastronomiya-i-asado"), guideLink("tango-i-kultura-ba")],
  },
  {
    id: "immigration",
    title: "Визы и иммиграция",
    description: "Въезд, документы и обзор видов ВНЖ",
    links: [
      {
        id: "immigration-hub",
        label: "Полный справочник по иммиграции",
        href: "/immigration",
        description: "ВНЖ, RADEX, гражданство и практические шаги",
      },
      ...immigrationArticles,
    ],
  },
  {
    id: "platform",
    title: "Платформа и поддержка",
    description: "Бронирование, организаторы и документы",
    links: [
      guideLink("bronirovanie-i-oplata"),
      {
        id: "guide-hub-faq",
        label: "Частые вопросы",
        href: "/faq",
        description: "Оплата, отмена, связь с гидом",
      },
      {
        id: "guide-hub-about",
        label: "О проекте",
        href: "/about",
      },
      {
        id: "guide-hub-contacts",
        label: "Контакты",
        href: "/contacts",
      },
      {
        id: "guide-hub-join",
        label: "Для организаторов",
        href: "/join",
      },
    ],
  },
  {
    id: "journal",
    title: "Журнал",
    description: "Все статьи блога и свежие публикации",
    links: [
      {
        id: "guide-hub-blog",
        label: "Все статьи блога",
        href: "/blog",
      },
      ...blogPosts.map(blogLink),
    ],
  },
];
