/** Редакционные маршруты для витрины на индексе блога */
export type BlogPopularRoute = {
  slug: string;
  title: string;
  subtitle: string;
  duration: string;
  href: string;
};

export const BLOG_POPULAR_ROUTES: readonly BlogPopularRoute[] = [
  {
    slug: "itinerary-10",
    title: "Аргентина за 10 дней",
    subtitle: "Буэнос-Айрес, Игуасу и Патагония — классика первой поездки",
    duration: "10 дней",
    href: "/blog/itinerary-за-10-дней",
  },
  {
    slug: "itinerary-14",
    title: "Аргентина за 14 дней",
    subtitle: "Расширенный маршрут с севером или винным регионом",
    duration: "14 дней",
    href: "/blog/itinerary-за-14-дней",
  },
  {
    slug: "patagonia-7",
    title: "Патагония за 7 дней",
    subtitle: "Эль-Калафате, ледники и опционально Ушуайя",
    duration: "7 дней",
    href: "/blog/patagonia-за-7-дней",
  },
  {
    slug: "northwest-5",
    title: "Северо-запад за 5 дней",
    subtitle: "Сальта, Кебрада-де-Умауака и винные долины",
    duration: "5 дней",
    href: "/blog/northwest-за-5-дней",
  },
  {
    slug: "itinerary-checklist",
    title: "Чек-лист перед поездкой",
    subtitle: "Документы, деньги, связь и страховка — что проверить",
    duration: "Справочник",
    href: "/blog/itinerary-чек-лист",
  },
  {
    slug: "itinerary-mistakes",
    title: "10 типичных ошибок",
    subtitle: "Чего избегать при планировании маршрута по Аргентине",
    duration: "Справочник",
    href: "/blog/itinerary-ошибки",
  },
] as const;
