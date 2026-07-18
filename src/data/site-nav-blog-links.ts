import type { SiteNavLink } from "@/types/site-nav";

/**
 * Compact publication snapshot for the root navigation.
 *
 * Keep this DTO independent from `data/blog` and media resolvers: importing the
 * full editorial catalog from the client header also ships every article and
 * the media manifest on every public route.
 */
export const SITE_NAV_RECENT_BLOG_LINKS: SiteNavLink[] = [
  {
    id: "blog-best-time-to-visit-argentina",
    label: "Когда лучше ехать в Аргентину: сезоны и регионы",
    href: "/blog/best-time-to-visit-argentina",
    description: "Путеводитель",
  },
  {
    id: "blog-argentina-tourist-visa-2026",
    label: "Въезд туриста: виза, сроки и документы",
    href: "/blog/argentina-tourist-visa-2026",
    description: "Документы для поездки",
  },
  {
    id: "blog-iguazu-за-3-дня",
    label: "Водопады Игуасу за 3 дня: гибкий маршрут",
    href: "/blog/iguazu-за-3-дня",
    description: "Водопады Игуасу",
  },
  {
    id: "blog-patagonia-авиабилеты",
    label: "Патагония: как выбрать аэропорт и внутренний рейс",
    href: "/blog/patagonia-авиабилеты",
    description: "Патагония",
  },
  {
    id: "blog-money-бюджет",
    label: "Деньги в Аргентине: сколько стоит поездка и как сэкономить",
    href: "/blog/money-бюджет",
    description: "Деньги и обмен валют",
  },
  {
    id: "blog-itinerary-чек-лист",
    label: "Аргентина: чек-лист перед поездкой",
    href: "/blog/itinerary-чек-лист",
    description: "Подготовка к поездке",
  },
  {
    id: "blog-salta-i-severo-zapad-marshrut",
    label: "Сальта и северо-запад: маршрут на 5–7 дней",
    href: "/blog/salta-i-severo-zapad-marshrut",
    description: "Север Аргентины",
  },
  {
    id: "blog-uco-valley-vino-i-gory",
    label: "Долина Уко: вино, Аконкагуа и дегустации",
    href: "/blog/uco-valley-vino-i-gory",
    description: "Винодельни",
  },
  {
    id: "blog-el-chalten-i-fitts-roy",
    label: "Эль-Чалтен и Фицрой: треккинг для первого раза",
    href: "/blog/el-chalten-i-fitts-roy",
    description: "Горы и треккинг",
  },
  {
    id: "blog-patagoniya-marshrut-14-dney",
    label: "Патагония за 14 дней: ледники, Фицрой и Ушуая",
    href: "/blog/patagoniya-marshrut-14-dney",
    description: "Патагония",
  },
  {
    id: "blog-itinerary-ошибки",
    label: "Аргентина: 10 типичных ошибок туристов",
    href: "/blog/itinerary-ошибки",
    description: "Путеводитель",
  },
  {
    id: "blog-itinerary-за-10-дней",
    label: "Аргентина за 10 дней: готовый маршрут по дням",
    href: "/blog/itinerary-за-10-дней",
    description: "Путешествия",
  },
];
