import { EXCURSION_CITY_LINKS, excursionCityHref } from "@/data/excursion-city-links";
import { blogPosts } from "@/data/blog";
import { POPULAR_DESTINATIONS, SEARCH_DESTINATIONS } from "@/data/filters";
import { SERVICE_CATEGORIES } from "@/data/services-hub";
import { SITE_LEGAL_LINKS } from "@/data/site-links";
import { TOUR_COLLECTION_OPTIONS } from "@/data/tour-collections";
import { destinationHref } from "@/lib/destinations";
import { buildGuideNavColumns } from "@/lib/guide-nav";
import { buildImmigrationNavColumns } from "@/lib/immigration-nav";
import { buildPopularPlaceNavLinks } from "@/lib/places-nav";
import { destinationCatalogHref } from "@/lib/site-nav";
import type { SiteNavLink, SiteNavSection } from "@/types/site-nav";

/** Utility links in the header top bar. */
export const SITE_NAV_UTILITY_LINKS: SiteNavLink[] = [
  {
    id: "utility-tours",
    label: "Бронируйте лучшие туры",
    labelKey: "nav.utility.tours",
    href: "/tours",
  },
  {
    id: "utility-join",
    label: "Авторам туров",
    labelKey: "nav.utility.join",
    href: "/join",
  },
  {
    id: "utility-contacts",
    label: "Свяжитесь с нами",
    labelKey: "nav.utility.contacts",
    href: "/contacts",
  },
];

const REGION_LINKS: SiteNavLink[] = [
  { id: "region-patagonia", label: "Патагония", href: destinationHref("patagonia") },
  { id: "region-ba", label: "Буэнос-Айрес", href: destinationHref("ba") },
  { id: "region-misiones", label: "Игуасу и Misiones", href: destinationHref("iguazu") },
  { id: "region-salta", label: "Сальта и северо-запад", href: destinationHref("salta") },
  { id: "region-mendoza", label: "Мендоса и винодельни", href: destinationHref("mendoza") },
  { id: "region-tierra", label: "Огненная Земля", href: destinationHref("ushuaia") },
];

const EXCURSION_SERVICE_LINKS: SiteNavLink[] = [
  {
    id: "excursions-catalog",
    label: "Каталог экскурсий",
    labelKey: "nav.excursions",
    href: "/excursions",
    description: "Городские маршруты и активности",
  },
  {
    id: "excursions-ba",
    label: EXCURSION_CITY_LINKS.buenosAires.label,
    href: excursionCityHref(EXCURSION_CITY_LINKS.buenosAires.slug),
    description: "Пешие маршруты и гастротуры",
  },
  {
    id: "excursions-ushuaia",
    label: EXCURSION_CITY_LINKS.ushuaia.label,
    href: excursionCityHref(EXCURSION_CITY_LINKS.ushuaia.slug),
    description: "Огненная Земля",
  },
  {
    id: "excursions-mendoza",
    label: EXCURSION_CITY_LINKS.mendoza.label,
    href: excursionCityHref(EXCURSION_CITY_LINKS.mendoza.slug),
    description: "Винодельни и горы",
  },
  {
    id: "excursions-iguazu",
    label: EXCURSION_CITY_LINKS.iguazu.label,
    href: excursionCityHref(EXCURSION_CITY_LINKS.iguazu.slug),
    description: "Водопады Игуасу",
  },
  {
    id: "excursions-tours",
    label: "Авторские туры",
    href: "/tours",
    description: "Многодневные маршруты на платформе",
  },
];

const TRAVEL_SERVICE_LINKS: SiteNavLink[] = [
  {
    id: "travel-catalog",
    label: "Каталог туров",
    labelKey: "nav.tours",
    href: "/tours",
    description: "Все авторские маршруты",
  },
  {
    id: "travel-podbor",
    label: "Подбор маршрута",
    href: "/podbor",
    description: "Персональный подбор за 2 минуты",
  },
  {
    id: "travel-map",
    label: "Туры на карте",
    href: "/tours",
    description: "Каталог с режимом карты",
  },
  {
    id: "travel-booking",
    label: "Найти заявку",
    href: "/booking/find",
    description: "По email без входа",
  },
  {
    id: "travel-flights",
    label: "Авиабилеты",
    labelKey: "nav.flights",
    href: "/flights",
    description: "Поиск перелётов в Аргентину",
  },
  {
    id: "travel-transfers",
    label: "Трансферы",
    labelKey: "nav.transfers",
    href: "/transfers",
    description: "Аэропорт и между городами",
  },
  {
    id: "travel-insurance",
    label: "Страховка",
    labelKey: "nav.insurance",
    href: "/insurance",
    description: "Медицинская страховка для поездки",
  },
  {
    id: "travel-esim",
    label: "eSIM",
    labelKey: "nav.esim",
    href: "/esim",
    description: "Мобильный интернет в поездке",
  },
  {
    id: "travel-car-rental",
    label: "Аренда авто",
    labelKey: "nav.carRental",
    href: "/car-rental",
    description: "Прокат для поездок по регионам",
  },
  {
    id: "travel-audio-guides",
    label: "Аудиогиды",
    labelKey: "nav.audioGuides",
    href: "/audio-guides",
    description: "Аудиоэкскурсии WeGoTrip",
  },
  {
    id: "travel-join",
    label: "Стать организатором",
    href: "/join",
    description: "Публикация туров",
  },
];

const ABOUT_LINKS: SiteNavLink[] = [
  { id: "about-project", label: "О проекте", href: "/about", description: "Миссия и команда платформы" },
  { id: "about-faq", label: "Частые вопросы", href: "/faq", description: "Ответы перед поездкой и бронированием" },
  { id: "about-contacts", label: "Контакты", href: "/contacts", description: "Связаться с командой" },
  { id: "about-join", label: "Для организаторов", href: "/join", description: "Публикация туров на платформе" },
  ...SITE_LEGAL_LINKS.map((link) => ({
    id: `legal-${link.href}`,
    label: link.label,
    href: link.href,
    description: "Юридический документ",
  })),
];

/**
 * Public site navigation — single source of truth for header mega-menu and mobile drawer.
 * Every href must resolve to an existing route (or catalog/blog deep link).
 */
export const SITE_NAV_SECTIONS: SiteNavSection[] = [
  {
    id: "home",
    label: "Главная",
    labelKey: "nav.home",
    href: "/",
  },
  {
    id: "destinations",
    label: "Направления",
    labelKey: "nav.destinations",
    columns: [
      {
        id: "dest-popular",
        title: "Популярное",
        titleKey: "nav.columns.popular",
        links: [
          {
            id: "dest-all",
            label: "Все направления",
            href: "/destinations",
            description: "8 регионов и городов",
          },
          ...POPULAR_DESTINATIONS.map((dest) => ({
            id: `dest-${dest.id}`,
            label: dest.name,
            href: destinationHref(dest.id),
            description: dest.description,
          })),
        ],
      },
      {
        id: "dest-more",
        title: "Регионы и города",
        titleKey: "nav.columns.regions",
        links: [
          ...REGION_LINKS,
          ...SEARCH_DESTINATIONS.filter(
            (item) =>
              !POPULAR_DESTINATIONS.some((pop) => pop.name === item.label) &&
              !REGION_LINKS.some((region) => region.label.includes(item.label))
          )
            .slice(0, 4)
            .map((item) => ({
              id: `dest-search-${item.label}`,
              label: item.label,
              href: destinationCatalogHref(item.label),
              description: item.region,
            })),
        ],
      },
    ],
  },
  {
    id: "places",
    label: "Места",
    labelKey: "nav.places",
    href: "/places",
    description: "Парки, города, ледники и водопады Аргентины",
    columns: [
      {
        id: "places-browse",
        title: "Справочник",
        titleKey: "nav.columns.search",
        links: [
          {
            id: "places-catalog",
            label: "Все места",
            labelKey: "nav.places",
            href: "/places",
            description: "Парки, города, ледники и водопады",
          },
          {
            id: "places-collections",
            label: "Подборки",
            href: "/collections",
            description: "Тематические коллекции",
          },
          {
            id: "places-itineraries",
            label: "Маршруты",
            href: "/itineraries",
            description: "Готовые планы поездок",
          },
        ],
      },
      {
        id: "places-popular",
        title: "Популярное",
        titleKey: "nav.columns.popular",
        links: buildPopularPlaceNavLinks(),
      },
    ],
  },
  {
    id: "tours",
    label: "Туры",
    labelKey: "nav.tours",
    columns: [
      {
        id: "tours-browse",
        title: "Поиск",
        titleKey: "nav.columns.search",
        links: TRAVEL_SERVICE_LINKS,
      },
      {
        id: "tours-collections",
        title: "Подборки",
        titleKey: "nav.columns.collections",
        links: TOUR_COLLECTION_OPTIONS.map((option) => ({
          id: `collection-${option.label}`,
          label: option.label,
          href: destinationCatalogHref(option.label),
        })),
      },
    ],
  },
  {
    id: "excursions",
    label: "Экскурсии",
    labelKey: "nav.excursions",
    href: "/excursions",
    columns: [
      {
        id: "excursions-browse",
        title: "Поиск",
        titleKey: "nav.columns.search",
        links: EXCURSION_SERVICE_LINKS,
      },
      {
        id: "excursions-regions",
        title: "По городам",
        titleKey: "nav.columns.regions",
        links: [
          {
            id: "excursions-all-cities",
            label: "Все города",
            href: "/excursions",
            description: "Полный каталог экскурсий",
          },
          ...POPULAR_DESTINATIONS.slice(0, 5).map((dest) => ({
            id: `excursions-${dest.id}`,
            label: dest.name,
            href: `/excursions?query=${encodeURIComponent(dest.name)}`,
            description: dest.description,
          })),
        ],
      },
    ],
  },
  {
    id: "guide",
    label: "Путеводитель",
    labelKey: "nav.guide",
    href: "/guide",
    columns: buildGuideNavColumns(),
  },
  {
    id: "gallery",
    label: "Галерея",
    labelKey: "nav.gallery",
    href: "/gallery",
    description: "Фотографии природы, городов и культуры Аргентины",
  },
  {
    id: "immigration",
    label: "Иммиграция",
    labelKey: "nav.immigration",
    href: "/immigration",
    columns: buildImmigrationNavColumns(),
  },
  {
    id: "shop",
    label: "Магазин",
    labelKey: "nav.shop",
    href: "/shop",
    description: "Сувениры, гиды и полезные материалы для поездки",
  },
  {
    id: "services",
    label: "Сервисы",
    labelKey: "nav.services",
    href: "/services",
    description: "Полезные сервисы для путешествия и переезда",
    columns: SERVICE_CATEGORIES.map((category) => ({
      id: `services-${category.id}`,
      title: category.title,
      links: category.items.map((item) => ({
        id: item.id,
        label: item.title,
        href: item.href,
        description: item.description,
        external: item.external,
      })),
    })),
  },
  {
    id: "journal",
    label: "Блог",
    labelKey: "nav.blog",
    href: "/blog",
    description: "Статьи о путешествиях, жизни и иммиграции",
    columns: [
      {
        id: "journal-recent",
        title: "Последние публикации",
        titleKey: "nav.columns.recentPosts",
        links: blogPosts.map((post) => ({
          id: `blog-${post.slug}`,
          label: post.title,
          href: `/blog/${post.slug}`,
          description: post.category,
        })),
      },
      {
        id: "journal-more",
        title: "Разделы",
        titleKey: "nav.columns.journalSections",
        links: [
          { id: "journal-index", label: "Все статьи", href: "/blog", description: "Полный архив публикаций" },
          { id: "journal-tours", label: "Туры по теме", href: "/tours", description: "Маршруты, связанные с материалами блога" },
        ],
      },
    ],
  },
  {
    id: "about",
    label: "О нас",
    labelKey: "nav.about",
    href: "/about",
    description: "О платформе, документы и контакты",
    columns: [
      {
        id: "about-company",
        title: "Платформа",
        titleKey: "nav.columns.platform",
        links: ABOUT_LINKS.slice(0, 4),
      },
      {
        id: "about-legal",
        title: "Документы",
        titleKey: "nav.columns.legal",
        links: ABOUT_LINKS.slice(4),
      },
    ],
  },
];

/** Core conversion sections — visible in the desktop pill bar at xl+. */
export const SITE_NAV_PRIMARY_IDS = ["destinations", "places", "tours", "excursions", "guide", "immigration"] as const;

/** Shorter desktop bar at lg–xl to avoid overlap with logo and actions. */
export const SITE_NAV_COMPACT_PRIMARY_IDS = ["destinations", "tours", "guide", "immigration"] as const;

export type SiteNavBarLayout = "wide" | "compact";

export function getSiteNavBarSections(layout: SiteNavBarLayout): {
  primarySections: SiteNavSection[];
  overflowSections: SiteNavSection[];
} {
  const primaryIds =
    layout === "wide" ? SITE_NAV_PRIMARY_IDS : SITE_NAV_COMPACT_PRIMARY_IDS;

  const primarySections = SITE_NAV_SECTIONS.filter((section) =>
    (primaryIds as readonly string[]).includes(section.id)
  );
  const overflowSections = SITE_NAV_SECTIONS.filter(
    (section) =>
      section.id !== "home" && !(primaryIds as readonly string[]).includes(section.id)
  );

  return { primarySections, overflowSections };
}

export function getSiteNavSection(id: string): SiteNavSection | undefined {
  return SITE_NAV_SECTIONS.find((section) => section.id === id);
}

export const IMMIGRATION_SITE_NAV = getSiteNavSection("immigration")!;

export const SITE_NAV_PRIMARY_SECTIONS = SITE_NAV_SECTIONS.filter((section) =>
  (SITE_NAV_PRIMARY_IDS as readonly string[]).includes(section.id)
);

/** Overflow sections — desktop burger menu; also part of mobile full menu. */
export const SITE_NAV_OVERFLOW_SECTIONS = SITE_NAV_SECTIONS.filter(
  (section) =>
    section.id !== "home" &&
    !(SITE_NAV_PRIMARY_IDS as readonly string[]).includes(section.id)
);

/** All sections for mobile drawer (home is covered by the logo). */
export const SITE_NAV_MOBILE_SECTIONS = SITE_NAV_SECTIONS.filter(
  (section) => section.id !== "home"
);

/** @deprecated Use SITE_NAV_PRIMARY_SECTIONS */
export const SITE_NAV_PILL_SECTIONS = SITE_NAV_PRIMARY_SECTIONS;

/** Reserved for verticals not yet in SITE_NAV_SECTIONS (Phase 4+). */
export const SITE_NAV_FUTURE_SECTIONS: SiteNavSection[] = [];
