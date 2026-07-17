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
    id: "blog-iguazu-советы-новичкам",
    label: "Водопады Игуасу: полный гид для новичков — с чего начать",
    href: "/blog/iguazu-советы-новичкам",
    description: "Водопады Игуасу",
  },
  {
    id: "blog-money-90-дней",
    label: "Финансы при поездке до 90 дней: как планировать расходы",
    href: "/blog/money-90-дней",
    description: "Деньги и обмен валют",
  },
  {
    id: "blog-money-карты",
    label: "Деньги в Аргентине: оплата картой — практический гид",
    href: "/blog/money-карты",
    description: "Деньги и обмен валют",
  },
  {
    id: "blog-money-наличные",
    label: "Наличные в Аргентине: доллары, евро и где менять безопасно",
    href: "/blog/money-наличные",
    description: "Деньги и обмен валют",
  },
  {
    id: "blog-money-бюджет",
    label: "Деньги в Аргентине: сколько стоит поездка и как сэкономить",
    href: "/blog/money-бюджет",
    description: "Деньги и обмен валют",
  },
  {
    id: "blog-money-советы-новичкам",
    label: "Деньги в Аргентине: полный гид для новичков — с чего начать",
    href: "/blog/money-советы-новичкам",
    description: "Деньги и обмен валют",
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
