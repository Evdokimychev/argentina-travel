import type { BreadcrumbJsonLdItem } from "@/lib/breadcrumb-json-ld";
import type { I18nLocale } from "@/lib/i18n/config";
import { contentPageHref } from "@/lib/content-pages";
import { resolveLocaleBreadcrumbItems, type LocaleBreadcrumbSpec } from "@/lib/locale-breadcrumbs";
import type { ContentPage } from "@/types/content-page";

export const BREADCRUMB_HOME: LocaleBreadcrumbSpec = {
  labelKey: "nav.home",
  path: "/",
  fallback: "Главная",
};

/** Section hubs aligned with catalog pages (Yandex: up to 3 items incl. current). */
export const BREADCRUMB_SECTIONS = {
  tours: {
    labelKey: "tours.catalog.title",
    path: "/tours",
    fallback: "Каталог туров по Аргентине",
  },
  excursions: {
    labelKey: "excursions.catalog.title",
    path: "/excursions",
    fallback: "Экскурсии по Аргентине",
  },
  destinations: {
    labelKey: "nav.geography",
    path: "/destinations",
    fallback: "Регионы и места",
  },
  places: {
    labelKey: "places.title",
    path: "/places",
    fallback: "Места Аргентины",
  },
  guide: {
    labelKey: "nav.guide",
    path: "/guide",
    fallback: "Путеводитель",
  },
  immigration: {
    labelKey: "nav.immigration",
    path: "/immigration",
    fallback: "Иммиграция",
  },
  flights: {
    labelKey: "flights.route.breadcrumb.flights",
    path: "/flights",
    fallback: "Авиабилеты",
  },
  blog: {
    labelKey: "nav.blog",
    path: "/blog",
    fallback: "Блог",
  },
  faq: {
    labelKey: "nav.faq",
    path: "/faq",
    fallback: "Частые вопросы",
  },
  forum: {
    labelKey: "nav.forum",
    path: "/forum",
    fallback: "Форум",
  },
  knowledgeBase: {
    labelKey: "nav.knowledgeBase",
    path: "/baza-znaniy",
    fallback: "База знаний",
  },
} as const satisfies Record<string, LocaleBreadcrumbSpec>;

export type BreadcrumbSectionKey = keyof typeof BREADCRUMB_SECTIONS;

/** Home → section hub → current page (Yandex navigation chain, max 3 items). */
export function buildDetailBreadcrumbItems(
  locale: I18nLocale | undefined,
  sectionKey: BreadcrumbSectionKey,
  current: { name: string; path: string },
): BreadcrumbJsonLdItem[] {
  const resolved = resolveLocaleBreadcrumbItems(locale, [
    BREADCRUMB_HOME,
    BREADCRUMB_SECTIONS[sectionKey],
  ]);
  return [...resolved, current];
}

/** Home → current page (catalog-style pages without a parent section). */
export function buildTwoLevelBreadcrumbItems(
  locale: I18nLocale | undefined,
  current: LocaleBreadcrumbSpec,
): BreadcrumbJsonLdItem[] {
  return resolveLocaleBreadcrumbItems(locale, [BREADCRUMB_HOME, current]);
}

export function buildContentPageBreadcrumbItems(
  locale: I18nLocale | undefined,
  page: ContentPage,
): BreadcrumbJsonLdItem[] {
  const sectionKey = page.section === "guide" ? "guide" : "immigration";
  return buildDetailBreadcrumbItems(locale, sectionKey, {
    name: page.title,
    path: contentPageHref(page),
  });
}

/** Home → forum category → thread (Yandex: max 3 items). */
export function buildForumThreadBreadcrumbItems(
  locale: I18nLocale | undefined,
  category: { title: string; slug: string },
  thread: { title: string; path: string },
): BreadcrumbJsonLdItem[] {
  const resolved = resolveLocaleBreadcrumbItems(locale, [BREADCRUMB_HOME]);
  return [
    ...resolved,
    { name: category.title, path: `/forum/${category.slug}` },
    { name: thread.title, path: thread.path },
  ];
}
