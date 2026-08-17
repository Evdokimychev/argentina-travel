/**
 * SSOT for /blog/itinerary-за-10-дней.
 * Body previously lived as legacyManualReplacementSections + officialSources in blog.ts.
 */
import type { BlogPost, BlogPostSection } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { BLOG_EDITORIAL } from "@/data/blog-author";

export const ITINERARY_ZA_10_DNEY_SLUG = "itinerary-за-10-дней";

export const ITINERARY_ZA_10_DNEY_EXCERPT =
  "Пример маршрута на десять дней через Буэнос-Айрес, Игуасу и Эль-Калафате с обязательной проверкой логистики.";

export const ITINERARY_ZA_10_DNEY_SEO_DESCRIPTION =
  "Аргентина за 10 дней: пример маршрута через Буэнос-Айрес, Игуасу и Эль-Калафате с проверкой перелётов.";

export const ITINERARY_ZA_10_DNEY_SOURCES_BODY =
  "Проверено 17.07.2026. Маршрут нужно пересобрать под фактические рейсы и режим парков на даты поездки.\n\n* [Национальный парк Игуасу — часы работы](https://www.argentina.gob.ar/parquesnacionales/nea/parque-nacional-iguazu/horarios-como-llegar)\n* [Национальный парк Лос-Гласьярес — планирование визита](https://www.argentina.gob.ar/parquesnacionales/patagonia-austral/parque-nacional-los-glaciares/planea-tu-visita)\n* [Aeropuertos Argentina — текущие рейсы](https://www.aeropuertosargentina.com.ar/es)";

const READ_TIME_MINUTES = 11;

export const ITINERARY_ZA_10_DNEY_SECTIONS: BlogPostSection[] = [
  {
    title: "Рабочая последовательность",
    body:
      "Для первого знакомства можно совместить Буэнос-Айрес, Игуасу и Эль-Калафате. Это интенсивная поездка с несколькими перелётами, поэтому сначала найдите совместимые рейсы, а уже затем закрепляйте дни за городами. Если логистика получается хрупкой, уберите один регион.",
  },
  {
    title: "Как распределить время",
    body:
      "Оставьте несколько дней столице, полный день аргентинской стороне Игуасу и несколько дней Эль-Калафате с резервом. Не назначайте посещение парка на день прилёта и не ставьте международный вылет сразу после отдельного внутреннего билета.",
  },
  {
    title: "Как посчитать поездку",
    body:
      "Сложите полную цену перелётов с багажом, наземные переезды, проживание, входы, экскурсии, питание и резерв. Проверяйте часы и тарифы парков на официальных страницах. Этот маршрут — пример, а не подтверждение доступности на выбранные даты.",
  },
  {
    title: "Источники и дата проверки",
    body: ITINERARY_ZA_10_DNEY_SOURCES_BODY,
  },
];

export const ITINERARY_ZA_10_DNEY_POST: Omit<BlogPost, "content" | "image"> & {
  content?: string;
  image?: string;
} = {
  id: "blog-itinerary-10-days",
  slug: ITINERARY_ZA_10_DNEY_SLUG,
  title: "Аргентина за 10 дней: готовый маршрут по дням",
  seoTitle: "Аргентина за 10 дней: маршрут BA, Игуасу, Патагония",
  seoDescription: ITINERARY_ZA_10_DNEY_SEO_DESCRIPTION,
  excerpt: ITINERARY_ZA_10_DNEY_EXCERPT,
  sections: ITINERARY_ZA_10_DNEY_SECTIONS,
  author: BLOG_EDITORIAL.name,
  authorBio: BLOG_EDITORIAL.bio,
  date: "2026-06-21",
  dateModified: "2026-07-17",
  category: "Путешествия",
  readTimeMinutes: READ_TIME_MINUTES,
  readTime: formatBlogReadTime(READ_TIME_MINUTES),
  tags: ["Аргентина", "маршрут", "10 дней", "Буэнос-Айрес", "Игуасу", "Патагония"],
  featured: true,
  cardVariant: "featured",
  editorialReviewed: true,
  tourEmbeds: [
    {
      id: "argentina-10day-featured",
      variant: "featured",
      title: "Туры по Аргентине на 10 дней",
      subtitle: "BA, Игуасу и Патагония — логистика под ключ",
      limit: 3,
      source: { kind: "query", query: "Argentina Patagonia Iguazu" },
      catalogHref: "/tours?query=Argentina",
      catalogLabel: "Туры в Аргентину",
      tone: "inline",
    },
  ],
  relatedResources: [
    { label: "10 типичных ошибок", href: "/blog/itinerary-ошибки", type: "blog" },
    { label: "Районы Буэнос-Айреса", href: "/blog/buenos-aires-rajony", type: "blog" },
    { label: "Игуасу за 3 дня", href: "/blog/iguazu-за-3-дня", type: "blog" },
    { label: "Los Glaciares", href: "/blog/natsionalnyy-park-los-glasiares", type: "guide" },
    { label: "Синий доллар", href: "/blog/blue-dollar-argentina-2026", type: "blog" },
    { label: "Когда ехать", href: "/blog/best-time-to-visit-argentina", type: "blog" },
    { label: "Аргентина за 14 дней", href: "/blog/itinerary-за-14-дней", type: "blog" },
    { label: "Чек-лист перед поездкой", href: "/blog/itinerary-чек-лист", type: "blog" },
  ],
};
