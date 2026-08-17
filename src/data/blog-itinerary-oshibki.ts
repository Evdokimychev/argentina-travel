/**
 * SSOT for /blog/itinerary-ошибки.
 * Body previously lived as legacyManualReplacementSections + officialSources in blog.ts.
 */
import type { BlogPost, BlogPostSection } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { BLOG_EDITORIAL } from "@/data/blog-author";

export const ITINERARY_OSHIBKI_SLUG = "itinerary-ошибки";

export const ITINERARY_OSHIBKI_EXCERPT =
  "Как избежать перегруженного маршрута, непродуманных пересадок и неподходящей экипировки в первой поездке.";

export const ITINERARY_OSHIBKI_SEO_DESCRIPTION =
  "Типичные ошибки туристов в Аргентине: перегруженный маршрут, логистика, климат и устаревшие цены.";

export const ITINERARY_OSHIBKI_SOURCES_BODY =
  "Проверено 17.07.2026. Условия дорог, парков и рейсов перепроверяйте на свои даты.\n\n* [Национальные парки — общие рекомендации посетителям](https://www.argentina.gob.ar/parquesnacionales/recomendaciones-para-tu-visita)\n* [Aeropuertos Argentina — текущие рейсы](https://www.aeropuertosargentina.com.ar/es)\n* [Безопасное путешествие по стране](https://www.argentina.gob.ar/seguridad/recomendaciones-para-viajar-por-el-pais-de-manera-segura)";

const READ_TIME_MINUTES = 8;

export const ITINERARY_OSHIBKI_SECTIONS: BlogPostSection[] = [
  {
    title: "Перегружать маршрут",
    body:
      "Аргентина велика, а перелёт не равен одному пункту в расписании: к нему добавляются дорога в аэропорт, ожидание и получение багажа. Для короткой поездки лучше выбрать две-три базы и оставить резерв, чем собирать коллекцию пересадок.",
  },
  {
    title: "Бронировать без проверки логистики",
    body:
      "Перед оплатой свяжите жильё, аэропорты, наземный транспорт и часы работы территории в один календарь. Проверьте коды AEP и EZE, условия багажа и возможную смену аэропорта. Не соединяйте отдельные билеты короткой стыковкой.",
  },
  {
    title: "Полагаться на старые цены и общие советы",
    body:
      "Цены, правила въезда и режим парков меняются. Считайте бюджет по предложениям на свои даты и пользуйтесь легальными способами оплаты. Для природных маршрутов проверяйте погоду, состояние троп и требования конкретной территории, а не только общий прогноз по городу.",
  },
  {
    title: "Источники и дата проверки",
    body: ITINERARY_OSHIBKI_SOURCES_BODY,
  },
];

export const ITINERARY_OSHIBKI_POST: Omit<BlogPost, "content" | "image"> & {
  content?: string;
  image?: string;
} = {
  id: "blog-itinerary-mistakes",
  slug: ITINERARY_OSHIBKI_SLUG,
  title: "Аргентина: 10 типичных ошибок туристов",
  seoTitle: "Аргентина: 10 типичных ошибок туристов",
  seoDescription: ITINERARY_OSHIBKI_SEO_DESCRIPTION,
  excerpt: ITINERARY_OSHIBKI_EXCERPT,
  sections: ITINERARY_OSHIBKI_SECTIONS,
  author: BLOG_EDITORIAL.name,
  authorBio: BLOG_EDITORIAL.bio,
  date: "2026-06-21",
  dateModified: "2026-07-17",
  category: "Путеводитель",
  readTimeMinutes: READ_TIME_MINUTES,
  readTime: formatBlogReadTime(READ_TIME_MINUTES),
  tags: ["Аргентина", "ошибки", "планирование", "туристы", "Буэнос-Айрес", "Патагония"],
  featured: true,
  cardVariant: "featured",
  editorialReviewed: true,
  tourEmbeds: [
    {
      id: "argentina-mistakes-featured",
      variant: "featured",
      title: "Туры по Аргентине с логистикой",
      subtitle: "Готовые маршруты без типичных ошибок планирования",
      limit: 3,
      source: { kind: "query", query: "Argentina" },
      catalogHref: "/podbor",
      catalogLabel: "Подбор маршрута",
      tone: "inline",
    },
  ],
  relatedResources: [
    { label: "Аргентина за 10 дней", href: "/blog/itinerary-за-10-дней", type: "blog" },
    { label: "Аргентина за 14 дней", href: "/blog/itinerary-за-14-дней", type: "blog" },
    { label: "Сборы в Патагонию", href: "/blog/patagonia-packing-list", type: "blog" },
    { label: "Синий доллар", href: "/blog/blue-dollar-argentina-2026", type: "blog" },
    { label: "Районы Буэнос-Айреса", href: "/blog/buenos-aires-rajony", type: "blog" },
    { label: "Когда ехать", href: "/blog/best-time-to-visit-argentina", type: "blog" },
    { label: "Как добраться", href: "/guide/kak-dobratsya", type: "guide" },
    { label: "Безопасность", href: "/guide/bezopasnost", type: "guide" },
  ],
};
