import type { SiteNavColumn, SiteNavLink } from "@/types/site-nav";

export const IMMIGRATION_NAV_PROMO_TITLE = "Иммиграция в Аргентину";

export const IMMIGRATION_NAV_PROMO_INTRO =
  "ВНЖ, ПМЖ, гражданство, роды и правила въезда — справочные материалы для туристов и тех, кто планирует переезд.";

const HUB_TOPIC_LINKS: SiteNavLink[] = [
  {
    id: "immigration-all",
    label: "Полный справочник",
    href: "/immigration",
    description: "Обзор всех тем: от въезда до гражданства",
  },
  {
    id: "immigration-life",
    label: "Жизнь в стране",
    href: "/immigration/zhizn-v-strane",
    description: "Климат, медицина, жильё, сообщество",
  },
  {
    id: "immigration-process",
    label: "Процесс иммиграции",
    href: "/immigration/protsess-immigratsii",
    description: "Въезд, RADEX, DNU 366/2025, документы",
  },
  {
    id: "immigration-birth",
    label: "Роды в Аргентине",
    href: "/immigration/rody-v-argentine",
    description: "Jus soli и residencia для родителей",
  },
  {
    id: "immigration-citizenship",
    label: "Гражданство",
    href: "/immigration/grazhdanstvo",
    description: "Паспорт, экзамены, сроки",
  },
  {
    id: "immigration-residency",
    label: "ВНЖ и ПМЖ",
    href: "/immigration/vnzh-i-pmzh",
    description: "15 оснований temporaria, ПМЖ и precaria",
  },
  {
    id: "immigration-opportunities",
    label: "Возможности",
    href: "/immigration/vozmozhnosti",
    description: "Rentista, nomad, DIY и сопровождение",
  },
  {
    id: "immigration-links",
    label: "Полезные ссылки",
    href: "/immigration/poleznye-ssylki",
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
  HUB_TOPIC_LINKS[0],
  HUB_TOPIC_LINKS[5],
  ARTICLE_LINKS[0],
];

export function buildImmigrationNavColumns(): SiteNavColumn[] {
  return [
    {
      id: "immigration-handbook",
      title: "Справочник",
      titleKey: "nav.columns.immigrationHandbook",
      links: HUB_TOPIC_LINKS,
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
