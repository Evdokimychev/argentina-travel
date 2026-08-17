/**
 * SSOT for /blog/itinerary-за-14-дней.
 * Body previously lived as legacyManualReplacementSections + officialSources in blog.ts.
 */
import type { BlogPost, BlogPostSection } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { BLOG_EDITORIAL } from "@/data/blog-author";

export const ITINERARY_ZA_14_DNEY_SLUG = "itinerary-за-14-дней";

export const ITINERARY_ZA_14_DNEY_EXCERPT =
  "Пример маршрута на две недели через Буэнос-Айрес, Игуасу, Патагонию и Озёрный край.";

export const ITINERARY_ZA_14_DNEY_SEO_DESCRIPTION =
  "Аргентина за 14 дней: пример маршрута через Буэнос-Айрес, Игуасу, Патагонию и Барилоче с проверкой логистики.";

export const ITINERARY_ZA_14_DNEY_SOURCES_BODY =
  "Проверено 17.07.2026. Маршрут — пример последовательности, а не подтверждённое расписание.\n\n* [Национальный парк Игуасу — часы работы](https://www.argentina.gob.ar/parquesnacionales/nea/parque-nacional-iguazu/horarios-como-llegar)\n* [Национальный парк Лос-Гласьярес — рекомендации](https://www.argentina.gob.ar/parquesnacionales/patagonia-austral/recomendaciones-para-visitar-el-parque-nacional-los-glaciares)\n* [Национальный парк Науэль-Уапи](https://www.argentina.gob.ar/parquesnacionales/regionpatagonia/parque-nacional-nahuel-huapi)\n* [Aeropuertos Argentina — текущие рейсы](https://www.aeropuertosargentina.com.ar/es)";

const READ_TIME_MINUTES = 14;

export const ITINERARY_ZA_14_DNEY_SECTIONS: BlogPostSection[] = [
  {
    title: "Не больше четырёх баз",
    body:
      "Две недели позволяют связать Буэнос-Айрес, Игуасу и одну ветку Патагонии. Добавляйте Барилоче только если расписание не создаёт цепочку коротких стыковок. Эль-Калафате и Эль-Чальтен разумно считать одной региональной связкой с наземным переездом.",
  },
  {
    title: "Собирайте маршрут от рейсов",
    body:
      "Сначала найдите реальные перелёты на свои даты и проверьте аэропорты Буэнос-Айреса. Затем распределите парки и экскурсии, оставив резерв на погоду. Не обещайте себе конкретный контур, навигацию или тропу до проверки официального статуса.",
  },
  {
    title: "Темп и бюджет",
    body:
      "Чередуйте перелёт и насыщенный день, не ставьте подряд несколько длинных прогулок без учёта подготовки. Бюджет считайте по фактическим тарифам и условиям отмены; фиксированная сумма быстро теряет смысл и не показывает риски отдельной стыковки.",
  },
  {
    title: "Источники и дата проверки",
    body: ITINERARY_ZA_14_DNEY_SOURCES_BODY,
  },
];

export const ITINERARY_ZA_14_DNEY_POST: Omit<BlogPost, "content" | "image"> & {
  content?: string;
  image?: string;
} = {
  id: "blog-itinerary-14-days",
  slug: ITINERARY_ZA_14_DNEY_SLUG,
  title: "Аргентина за 14 дней: готовый маршрут по дням",
  seoTitle: "Аргентина за 14 дней: маршрут BA, Игуасу, Патагония, Барилоче",
  seoDescription: ITINERARY_ZA_14_DNEY_SEO_DESCRIPTION,
  excerpt: ITINERARY_ZA_14_DNEY_EXCERPT,
  sections: ITINERARY_ZA_14_DNEY_SECTIONS,
  author: BLOG_EDITORIAL.name,
  authorBio: BLOG_EDITORIAL.bio,
  date: "2026-06-21",
  dateModified: "2026-07-17",
  category: "Путешествия",
  readTimeMinutes: READ_TIME_MINUTES,
  readTime: formatBlogReadTime(READ_TIME_MINUTES),
  tags: ["Аргентина", "маршрут", "14 дней", "Буэнос-Айрес", "Игуасу", "Патагония", "Барилоче"],
  featured: true,
  cardVariant: "featured",
  editorialReviewed: true,
  tourEmbeds: [
    {
      id: "argentina-14day-featured",
      variant: "featured",
      title: "Туры по Аргентине на 14 дней",
      subtitle: "BA, Игуасу, Патагония и Барилоче — логистика под ключ",
      limit: 3,
      source: { kind: "query", query: "Argentina Patagonia Iguazu Bariloche" },
      catalogHref: "/tours?query=Argentina",
      catalogLabel: "Туры в Аргентину",
      tone: "inline",
    },
  ],
  relatedResources: [
    { label: "10 типичных ошибок", href: "/blog/itinerary-ошибки", type: "blog" },
    { label: "Аргентина за 10 дней", href: "/blog/itinerary-за-10-дней", type: "blog" },
    { label: "Районы Буэнос-Айреса", href: "/blog/buenos-aires-rajony", type: "blog" },
    { label: "Игуасу", href: "/blog/natsionalnyy-park-iguasu", type: "guide" },
    { label: "Los Glaciares", href: "/blog/natsionalnyy-park-los-glasiares", type: "guide" },
    { label: "Эль-Чалтен", href: "/blog/el-chalten-i-fitts-roy", type: "guide" },
    { label: "Науэль-Уапи", href: "/blog/natsionalnyy-park-nauel-uapi", type: "guide" },
    { label: "Синий доллар", href: "/blog/blue-dollar-argentina-2026", type: "blog" },
    { label: "Когда ехать", href: "/blog/best-time-to-visit-argentina", type: "blog" },
    { label: "Патагония за 14 дней", href: "/blog/patagoniya-marshrut-14-dney", type: "blog" },
    { label: "Чек-лист перед поездкой", href: "/blog/itinerary-чек-лист", type: "blog" },
  ],
};
