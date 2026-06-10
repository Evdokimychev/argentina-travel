import type { SiteNavColumn, SiteNavLink } from "@/types/site-nav";

export const IMMIGRATION_NAV_PROMO_TITLE = "Иммиграция в Аргентину";

export const IMMIGRATION_NAV_PROMO_INTRO =
  "ВНЖ, ПМЖ, гражданство, роды и правила въезда — справочные материалы для туристов и тех, кто планирует переезд.";

const HUB_ANCHOR_LINKS: SiteNavLink[] = [
  {
    id: "immigration-all",
    label: "Полный справочник",
    href: "/immigration",
    description: "Все блоки: от въезда до гражданства",
  },
  {
    id: "immigration-life",
    label: "Жизнь в стране",
    href: "/immigration#life-in-country",
    description: "Климат, медицина, жильё, сообщество",
  },
  {
    id: "immigration-process",
    label: "Процесс иммиграции",
    href: "/immigration#immigration-process",
    description: "Въезд, RADEX, DNU 366/2025, документы",
  },
  {
    id: "immigration-birth",
    label: "Роды в Аргентине",
    href: "/immigration#birth",
    description: "Jus soli и residencia для родителей",
  },
  {
    id: "immigration-citizenship",
    label: "Гражданство",
    href: "/immigration#citizenship",
    description: "Паспорт, экзамены, сроки",
  },
  {
    id: "immigration-residency",
    label: "ВНЖ и ПМЖ",
    href: "/immigration#residency",
    description: "14 оснований, temporaria и permanente",
  },
  {
    id: "immigration-opportunities",
    label: "Возможности",
    href: "/immigration#opportunities",
    description: "Rentista, nomad, DIY и сопровождение",
  },
  {
    id: "immigration-links",
    label: "Полезные ссылки",
    href: "/immigration#useful-links",
    description: "Migraciones, статьи, смежные разделы",
  },
];

const ARTICLE_LINKS: SiteNavLink[] = [
  {
    id: "immigration-visas",
    label: "Визы для туристов",
    href: "/immigration/vizy-dlya-turistov",
    description: "Безвиз, AVE и граница",
  },
  {
    id: "immigration-residency-overview",
    label: "Обзор видов ВНЖ",
    href: "/immigration/obzor-vnzh",
    description: "Rentista, работа, учёба",
  },
  {
    id: "immigration-documents",
    label: "Документы для въезда",
    href: "/immigration/dokumenty-dlya-vyezda",
    description: "Чеклист перед поездкой",
  },
  {
    id: "immigration-extension",
    label: "Продление пребывания",
    href: "/immigration/prodlenie-turisticheskogo-vizita",
    description: "Migraciones и лимиты",
  },
];

/** Карточки в блоке «Популярное» mega-menu. */
export const IMMIGRATION_NAV_FEATURED: SiteNavLink[] = [
  HUB_ANCHOR_LINKS[0],
  HUB_ANCHOR_LINKS[5],
  ARTICLE_LINKS[0],
];

export function buildImmigrationNavColumns(): SiteNavColumn[] {
  return [
    {
      id: "immigration-handbook",
      title: "Справочник",
      titleKey: "nav.columns.immigrationHandbook",
      links: HUB_ANCHOR_LINKS,
    },
    {
      id: "immigration-articles",
      title: "Статьи",
      titleKey: "nav.columns.immigrationArticles",
      links: ARTICLE_LINKS,
    },
  ];
}

export function buildImmigrationFeaturedLinks(): SiteNavLink[] {
  return IMMIGRATION_NAV_FEATURED;
}
