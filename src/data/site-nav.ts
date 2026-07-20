import { EXCURSION_CITY_LINKS, excursionCityHref } from "@/data/excursion-city-links";
import { SERVICE_CATEGORIES } from "@/data/services-hub";
import { SITE_NAV_RECENT_BLOG_LINKS } from "@/data/site-nav-blog-links";
import {
  SITE_NAV_PLANNING_SEARCH_LINKS,
  SITE_NAV_POPULAR_DESTINATIONS,
  SITE_NAV_POPULAR_PLACE_LINKS,
} from "@/data/site-nav-geography";
import { SITE_LEGAL_LINKS } from "@/data/site-links";
import { TOUR_COLLECTION_OPTIONS } from "@/data/tour-collections";
import { buildGuideNavColumns } from "@/lib/guide-nav";
import { buildImmigrationNavColumns } from "@/lib/immigration-nav";
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
  { id: "region-patagonia", label: "Патагония", href: "/destinations/patagonia" },
  { id: "region-ba", label: "Буэнос-Айрес", href: "/destinations/ba" },
  { id: "region-misiones", label: "Игуасу и Misiones", href: "/destinations/iguazu" },
  { id: "region-salta", label: "Сальта и северо-запад", href: "/destinations/salta" },
  { id: "region-mendoza", label: "Мендоса и винодельни", href: "/destinations/mendoza" },
  { id: "region-tierra", label: "Огненная Земля", href: "/destinations/ushuaia" },
];

/** Compact service links — footer strip in every mega-menu dropdown. */
export const NAV_FOOTER_SERVICE_LINKS: SiteNavLink[] = [
  {
    id: "footer-flights",
    label: "Авиабилеты",
    labelKey: "nav.flights",
    href: "/flights",
  },
  {
    id: "footer-transfers",
    label: "Трансферы",
    labelKey: "nav.transfers",
    href: "/transfers",
  },
  {
    id: "footer-esim",
    label: "eSIM",
    labelKey: "nav.esim",
    href: "/esim",
  },
  {
    id: "footer-insurance",
    label: "Страховка",
    labelKey: "nav.insurance",
    href: "/insurance",
  },
  {
    id: "footer-car-rental",
    label: "Аренда авто",
    labelKey: "nav.carRental",
    href: "/car-rental",
  },
  {
    id: "footer-audio-guides",
    label: "Аудиогиды",
    labelKey: "nav.audioGuides",
    href: "/audio-guides",
  },
];

const EXCURSION_BROWSE_LINKS: SiteNavLink[] = [
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
];

const TOURS_BROWSE_LINKS: SiteNavLink[] = [
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
    id: "travel-booking",
    label: "Найти заявку",
    href: "/booking/find",
    description: "По email без входа",
  },
];

const ABOUT_LINKS: SiteNavLink[] = [
  { id: "about-project", label: "О проекте", href: "/about", description: "Миссия и команда платформы" },
  { id: "about-faq", label: "Частые вопросы", href: "/faq", description: "Ответы перед поездкой и бронированием" },
  { id: "about-experts", label: "Локальные эксперты", href: "/experts", description: "Гиды и консультанты в Аргентине" },
  { id: "about-contacts", label: "Контакты", href: "/contacts", description: "Связаться с командой" },
  { id: "about-join", label: "Для организаторов", href: "/join", description: "Публикация туров на платформе" },
  ...SITE_LEGAL_LINKS.map((link) => ({
    id: `legal-${link.href}`,
    label: link.label,
    href: link.href,
    description: "Юридический документ",
  })),
];

/** База знаний — самостоятельный раздел (единый источник знаний об Аргентине). */
const KNOWLEDGE_BASE_SECTION_LINKS: SiteNavLink[] = [
  {
    id: "kb-home",
    label: "Главная базы знаний",
    href: "/baza-znaniy",
    description: "260+ материалов, поиск и навигация",
  },
  {
    id: "kb-puteshestviya",
    label: "Путешествия",
    href: "/baza-znaniy/razdel/puteshestviya",
    description: "Маршруты, сезоны, бюджет, подготовка",
  },
  {
    id: "kb-goroda-regiony",
    label: "Города и регионы",
    href: "/baza-znaniy/razdel/goroda-i-regiony",
    description: "Города, провинции, парки, места",
  },
  {
    id: "kb-zhizn",
    label: "Жизнь в стране",
    href: "/baza-znaniy/razdel/zhizn-v-strane",
    description: "Быт, культура, медицина, безопасность",
  },
  {
    id: "kb-pereezd",
    label: "Переезд в Аргентину",
    href: "/baza-znaniy/razdel/pereezd",
    description: "Весь путь релоканта",
  },
  {
    id: "kb-dokumenty",
    label: "Документы и легализация",
    href: "/baza-znaniy/razdel/dokumenty",
    description: "Виза, ВНЖ, DNI, гражданство",
  },
  {
    id: "kb-finansy",
    label: "Финансы и экономика",
    href: "/baza-znaniy/razdel/finansy",
    description: "Деньги, налоги, инфляция, накопления",
  },
  {
    id: "kb-opyt",
    label: "Личный опыт",
    href: "/baza-znaniy/razdel/lichnyy-opyt",
    description: "Живые истории из первых рук",
  },
];

const KNOWLEDGE_BASE_ENTRY_LINKS: SiteNavLink[] = [
  {
    id: "kb-hub-traveler",
    label: "Гид путешественника",
    href: "/baza-znaniy/gid-puteshestvennika",
    description: "Подготовка и маршруты по стране",
  },
  {
    id: "kb-hub-relocant",
    label: "Гид релоканта",
    href: "/baza-znaniy/razdel/pereezd",
    description: "Путь переезда: 6 этапов",
  },
  {
    id: "kb-search",
    label: "Поиск по базе знаний",
    href: "/baza-znaniy/poisk",
    description: "Быстрый поиск по всем материалам",
  },
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
    id: "geography",
    label: "Регионы и места",
    labelKey: "nav.geography",
    href: "/destinations",
    description: "Направления для планирования, справочник мест и готовые маршруты",
    activePathPrefixes: [
      "/destinations",
      "/places",
      "/collections",
      "/itineraries",
      "/mapa-argentina",
    ],
    columns: [
      {
        id: "geo-regions",
        title: "Регионы для поездки",
        titleKey: "nav.columns.regions",
        links: [
          {
            id: "geo-all-regions",
            label: "Обзор всех регионов",
            href: "/destinations",
            description: "8 направлений с гидами, сезонами и турами",
          },
          ...SITE_NAV_POPULAR_DESTINATIONS.map((dest) => ({
            id: `dest-${dest.id}`,
            label: dest.name,
            href: `/destinations/${dest.id}`,
            description: dest.description,
          })),
        ],
      },
      {
        id: "geo-places",
        title: "Места и достопримечательности",
        titleKey: "nav.columns.places",
        links: [
          {
            id: "places-map",
            label: "Карта Аргентины",
            href: "/mapa-argentina",
            description: "Города, парки, экскурсии на одной карте",
          },
          {
            id: "places-catalog",
            label: "Справочник мест",
            labelKey: "nav.placesCatalog",
            href: "/places",
            description: "Парки, города, ледники — карта и фильтры",
          },
          ...SITE_NAV_POPULAR_PLACE_LINKS,
        ],
      },
      {
        id: "geo-planning",
        title: "Планирование",
        titleKey: "nav.columns.planning",
        links: [
          {
            id: "places-collections",
            label: "Подборки",
            href: "/collections",
            description: "Тематические коллекции мест",
          },
          {
            id: "places-itineraries",
            label: "Маршруты",
            href: "/itineraries",
            description: "Готовые планы поездок",
          },
          ...REGION_LINKS.slice(0, 4),
          ...SITE_NAV_PLANNING_SEARCH_LINKS,
        ],
      },
    ],
  },
  {
    id: "tours",
    label: "Туры",
    labelKey: "nav.tours",
    href: "/tours",
    columns: [
      {
        id: "tours-browse",
        title: "Планирование",
        links: TOURS_BROWSE_LINKS,
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
        title: "Каталог",
        links: EXCURSION_BROWSE_LINKS,
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
          ...SITE_NAV_POPULAR_DESTINATIONS.slice(0, 5).map((dest) => ({
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
    id: "knowledgeBase",
    label: "База знаний",
    labelKey: "nav.knowledgeBase",
    href: "/baza-znaniy",
    activePathPrefixes: ["/baza-znaniy"],
    description:
      "Единый источник знаний об Аргентине: путешествия, переезд, документы, деньги и жизнь в стране",
    columns: [
      {
        id: "kb-sections",
        title: "Разделы",
        links: KNOWLEDGE_BASE_SECTION_LINKS,
      },
      {
        id: "kb-entries",
        title: "Точки входа",
        links: KNOWLEDGE_BASE_ENTRY_LINKS,
      },
    ],
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
    activePathPrefixes: ["/blog"],
    description: "Статьи о путешествиях, жизни и иммиграции",
    columns: [
      {
        id: "journal-recent",
        title: "Последние публикации",
        titleKey: "nav.columns.recentPosts",
        links: SITE_NAV_RECENT_BLOG_LINKS,
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
    id: "community",
    label: "Форум",
    href: "/forum",
    activePathPrefixes: ["/forum"],
    description: "Обсуждения путешествий, переезда и жизни в Аргентине",
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
        links: ABOUT_LINKS.slice(0, 5),
      },
      {
        id: "about-legal",
        title: "Документы",
        titleKey: "nav.columns.legal",
        links: ABOUT_LINKS.slice(5),
      },
    ],
  },
];

/** Core conversion sections — visible in the desktop pill bar at xl+. */
export const SITE_NAV_PRIMARY_IDS = ["geography", "tours", "excursions", "guide", "immigration"] as const;

/** Shorter desktop bar at lg–xl to avoid overlap with logo and actions. */
export const SITE_NAV_COMPACT_PRIMARY_IDS = ["geography", "tours", "excursions", "guide"] as const;

/** Priority order for adaptive desktop bar (left → right). */
export const SITE_NAV_DESKTOP_PRIORITY_IDS = SITE_NAV_PRIMARY_IDS;

export type SiteNavBarLayout = "wide" | "compact";

export function getSiteNavBarSectionsByCount(visiblePrimaryCount: number): {
  primarySections: SiteNavSection[];
  overflowSections: SiteNavSection[];
} {
  const clamped = Math.max(
    2,
    Math.min(visiblePrimaryCount, SITE_NAV_DESKTOP_PRIORITY_IDS.length),
  );
  const primaryIdSet = new Set<string>(
    SITE_NAV_DESKTOP_PRIORITY_IDS.slice(0, clamped),
  );

  const primarySections = SITE_NAV_DESKTOP_PRIORITY_IDS.slice(0, clamped)
    .map((id) => getSiteNavSection(id))
    .filter((section): section is SiteNavSection => Boolean(section));

  const overflowSections = SITE_NAV_SECTIONS.filter(
    (section) => section.id !== "home" && !primaryIdSet.has(section.id),
  );

  return { primarySections, overflowSections };
}

export function getSiteNavBarSections(layout: SiteNavBarLayout): {
  primarySections: SiteNavSection[];
  overflowSections: SiteNavSection[];
} {
  const primaryIds =
    layout === "wide" ? SITE_NAV_PRIMARY_IDS : SITE_NAV_COMPACT_PRIMARY_IDS;

  return getSiteNavBarSectionsByCount(primaryIds.length);
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
