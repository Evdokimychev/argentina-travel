/**
 * SSOT for /blog/itinerary-чек-лист.
 * Body previously lived as legacyManualReplacementSections + officialSources in blog.ts.
 */
import type { BlogPost, BlogPostSection } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { BLOG_EDITORIAL } from "@/data/blog-author";

export const ITINERARY_CHEK_LIST_SLUG = "itinerary-чек-лист";

export const ITINERARY_CHEK_LIST_EXCERPT =
  "Короткая проверка документов, бронирований, связи, здоровья и багажа перед поездкой в Аргентину.";

export const ITINERARY_CHEK_LIST_SEO_DESCRIPTION =
  "Чек-лист перед поездкой в Аргентину: документы, бронирования, страховка, связь, деньги и багаж.";

export const ITINERARY_CHEK_LIST_SOURCES_BODY =
  "Проверено 17.07.2026. Требования к въезду и перевозке багажа сверяйте непосредственно перед вылетом.\n\n* [Migraciones — информация для туристов](https://www.argentina.gob.ar/migraciones/turistas)\n* [МИД Аргентины — туристическая виза](https://www.cancilleria.gob.ar/es/servicios/visas/visa-para-turismo)\n* [Aeropuertos Argentina — советы пассажирам и текущие рейсы](https://www.aeropuertosargentina.com.ar/es)";

const READ_TIME_MINUTES = 9;

export const ITINERARY_CHEK_LIST_SECTIONS: BlogPostSection[] = [
  {
    title: "Документы и въезд",
    body:
      "Проверьте срок действия паспорта и правило въезда именно для своего гражданства и цели поездки. Сохраните бронирование жилья, маршрут и билет для выезда. Сделайте защищённые электронные копии документов, но не храните их в открытом общем доступе.",
  },
  {
    title: "Бронирования и здоровье",
    body:
      "Сверьте имена, даты, аэропорты и нормы багажа во всех билетах. Уточните условия отмены жилья и экскурсий. Подберите страховку под длительность, активности и имеющиеся заболевания; сохраните полис и номер помощи офлайн.",
  },
  {
    title: "Связь, деньги и багаж",
    body:
      "Подготовьте основной и резервный легальный способ оплаты, не полагаясь на один банк или одну карту. Проверьте роуминг либо местную связь. Соберите одежду по регионам маршрута, а не по погоде только в Буэнос-Айресе.",
  },
  {
    title: "За сутки до вылета",
    body:
      "Проверьте статус рейса, аэропорт и время регистрации, свежие правила въезда, прогноз и предупреждения по маршруту. Скачайте билеты, адрес первого жилья и контакты страховой. Если официальные условия расходятся со старой памяткой, следуйте официальным условиям.",
  },
  {
    title: "Источники и дата проверки",
    body: ITINERARY_CHEK_LIST_SOURCES_BODY,
  },
];

export const ITINERARY_CHEK_LIST_POST: Omit<BlogPost, "content" | "image"> & {
  content?: string;
  image?: string;
} = {
  id: "blog-itinerary-checklist",
  slug: ITINERARY_CHEK_LIST_SLUG,
  title: "Аргентина: чек-лист перед поездкой",
  seoTitle: "Аргентина: чек-лист перед поездкой",
  seoDescription: ITINERARY_CHEK_LIST_SEO_DESCRIPTION,
  excerpt: ITINERARY_CHEK_LIST_EXCERPT,
  sections: ITINERARY_CHEK_LIST_SECTIONS,
  author: BLOG_EDITORIAL.name,
  authorBio: BLOG_EDITORIAL.bio,
  date: "2026-06-21",
  dateModified: "2026-07-17",
  category: "Путеводитель",
  readTimeMinutes: READ_TIME_MINUTES,
  readTime: formatBlogReadTime(READ_TIME_MINUTES),
  tags: ["чек-лист", "подготовка", "документы", "Аргентина", "советы"],
  featured: true,
  cardVariant: "featured",
  editorialReviewed: true,
  tourEmbeds: [
    {
      id: "argentina-prep-featured",
      variant: "featured",
      title: "Туры по Аргентине",
      subtitle: "Готовые маршруты с логистикой и поддержкой организатора",
      limit: 3,
      source: { kind: "query", query: "Argentina" },
      catalogHref: "/podbor",
      catalogLabel: "Подбор маршрута",
      tone: "inline",
    },
  ],
  relatedResources: [
    { label: "10 типичных ошибок", href: "/blog/itinerary-ошибки", type: "blog" },
    { label: "Аргентина за 10 дней", href: "/blog/itinerary-за-10-дней", type: "blog" },
    { label: "Аргентина за 14 дней", href: "/blog/itinerary-за-14-дней", type: "blog" },
    { label: "Въезд и виза", href: "/blog/argentina-tourist-visa-2026", type: "blog" },
    { label: "Синий доллар", href: "/blog/blue-dollar-argentina-2026", type: "blog" },
    { label: "Сборы в Патагонию", href: "/blog/patagonia-packing-list", type: "guide" },
    { label: "Когда ехать", href: "/blog/best-time-to-visit-argentina", type: "blog" },
    { label: "Туристическая страховка", href: "/insurance", type: "guide" },
    { label: "eSIM для поездки", href: "/esim?country=argentina", type: "guide" },
  ],
};
