import type { SiteNavLink } from "@/types/site-nav";

export const IMMIGRATION_NAV_PROMO_TITLE = "Иммиграция в Аргентину";

export const IMMIGRATION_NAV_PROMO_INTRO =
  "ВНЖ, гражданство, RADEX и правила въезда — справочные материалы для туристов и тех, кто планирует переезд.";

/** Карточки в блоке «Популярное». */
export const IMMIGRATION_NAV_FEATURED: SiteNavLink[] = [
  {
    id: "immigration-all",
    label: "Полный справочник",
    href: "/immigration",
    description: "ВНЖ, RADEX, гражданство и практические шаги",
  },
  {
    id: "immigration-visas",
    label: "Визы для туристов",
    href: "/immigration/vizy-dlya-turistov",
    description: "Безвиз, AVE и прохождение границы",
  },
  {
    id: "immigration-residency",
    label: "Обзор видов ВНЖ",
    href: "/immigration/obzor-vnzh",
    description: "Rentista, работа, учёба и цифровые кочевники",
  },
];

export function buildImmigrationFeaturedLinks(): SiteNavLink[] {
  return IMMIGRATION_NAV_FEATURED;
}
