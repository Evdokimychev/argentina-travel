/**
 * SSOT for /blog/iguazu-за-3-дня.
 * Body previously lived as legacyManualReplacementSections + officialSources in blog.ts.
 */
import type { BlogPost, BlogPostSection } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { BLOG_EDITORIAL } from "@/data/blog-author";

export const IGUAZU_ZA_3_DNYA_SLUG = "iguazu-за-3-дня";

export const IGUAZU_ZA_3_DNYA_EXCERPT =
  "Спокойный трёхдневный план Игуасу с запасом на погоду и изменения в работе маршрутов.";

export const IGUAZU_ZA_3_DNYA_SEO_DESCRIPTION =
  "Игуасу за 3 дня: как распределить парк, резерв на погоду и что проверить перед визитом.";

export const IGUAZU_ZA_3_DNYA_SOURCES_BODY =
  "Проверено 17.07.2026. Часы работы, доступность контуров, тарифы и водные прогулки могут меняться.\n\n* [Национальный парк Игуасу — часы работы и дорога](https://www.argentina.gob.ar/parquesnacionales/nea/parque-nacional-iguazu/horarios-como-llegar)\n* [Национальный парк Игуасу — маршруты и активности](https://www.argentina.gob.ar/parquesnacionales/nea/parque-nacional-iguazu/actividades)\n* [Национальный парк Игуасу — действующие тарифы](https://www.argentina.gob.ar/parquesnacionales/nea/parque-nacional-iguazu/tarifas)";

const READ_TIME_MINUTES = 10;

export const IGUAZU_ZA_3_DNYA_SECTIONS: BlogPostSection[] = [
  {
    title: "Как распределить три дня",
    body:
      "Оставьте один полный день аргентинской стороне. Второй день можно отдать другой стороне водопадов, если документы позволяют пересечь границу, либо дополнительным маршрутам в Пуэрто-Игуасу. Третий день держите гибким: он пригодится при погодных ограничениях, закрытии контура или позднем прибытии.",
  },
  {
    title: "День в аргентинском парке",
    body:
      "Приезжайте рано и в информационном центре уточните, какие контуры открыты. Не считайте Глотку Дьявола, поезд или водную прогулку гарантированной частью дня: доступ меняется из-за уровня воды, погоды и технических работ. Соберите порядок прогулок после проверки на месте.",
  },
  {
    title: "Что взять",
    body:
      "Нужны нескользкая обувь, вода, защита от солнца и дождя, средство от насекомых и герметичный чехол для техники. Бюджет считайте по официальному тарифу парка, проживанию и транспорту на свои даты; старые суммы в песо и долларах для этого не подходят.",
  },
  {
    title: "Источники и дата проверки",
    body: IGUAZU_ZA_3_DNYA_SOURCES_BODY,
  },
];

export const IGUAZU_ZA_3_DNYA_POST: Omit<BlogPost, "content" | "image"> & {
  content?: string;
  image?: string;
} = {
  id: "blog-iguazu-za-3-dnya",
  slug: IGUAZU_ZA_3_DNYA_SLUG,
  title: "Водопады Игуасу за 3 дня: готовый маршрут по дням",
  seoTitle: "Водопады Игуасу за 3 дня: готовый маршрут по дням",
  seoDescription: IGUAZU_ZA_3_DNYA_SEO_DESCRIPTION,
  excerpt: IGUAZU_ZA_3_DNYA_EXCERPT,
  sections: IGUAZU_ZA_3_DNYA_SECTIONS,
  author: BLOG_EDITORIAL.name,
  authorBio: BLOG_EDITORIAL.bio,
  date: "2025-08-31",
  dateModified: "2026-07-17",
  category: "Водопады Игуасу",
  readTimeMinutes: READ_TIME_MINUTES,
  readTime: formatBlogReadTime(READ_TIME_MINUTES),
  tags: ["Игуасу", "Puerto Iguazú", "водопады", "маршрут", "Garganta del Diablo"],
  editorialReviewed: true,
  relatedResources: [
    { label: "Национальный парк Игуасу", href: "/blog/natsionalnyy-park-iguasu", type: "guide" },
    { label: "Garganta del Diablo", href: "/blog/iguazu-garganta-del-diablo", type: "blog" },
    { label: "Советы новичкам", href: "/blog/iguazu-советы-новичкам", type: "blog" },
    { label: "Когда ехать", href: "/blog/best-time-to-visit-argentina", type: "blog" },
    { label: "Аргентина за 10 дней", href: "/blog/itinerary-за-10-дней", type: "blog" },
  ],
};
