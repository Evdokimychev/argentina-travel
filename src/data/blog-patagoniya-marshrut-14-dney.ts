/**
 * SSOT for /blog/patagoniya-marshrut-14-dney.
 * Body previously lived as legacyManualReplacementSections + officialSources in blog.ts.
 */
import type { BlogPost, BlogPostSection } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { BLOG_EDITORIAL } from "@/data/blog-author";

export const PATAGONIYA_MARSHRUT_14_DNEY_SLUG = "patagoniya-marshrut-14-dney";

export const PATAGONIYA_MARSHRUT_14_DNEY_EXCERPT =
  "Гибкий маршрут на две недели через Эль-Калафате, Эль-Чальтен и Ушуаю без устаревающих цен и расписаний.";

export const PATAGONIYA_MARSHRUT_14_DNEY_SEO_DESCRIPTION =
  "Патагония за 14 дней: каркас маршрута через Эль-Калафате, Эль-Чальтен и Ушуаю с резервом на погоду.";

export const PATAGONIYA_MARSHRUT_14_DNEY_SOURCES_BODY =
  "Проверено 17.07.2026. Это каркас маршрута, а не обещание доступности рейсов, троп или экскурсий.\n\n* [Национальный парк Лос-Гласьярес — планирование визита](https://www.argentina.gob.ar/parquesnacionales/patagonia-austral/parque-nacional-los-glaciares/planea-tu-visita)\n* [Национальный парк Лос-Гласьярес — рекомендации](https://www.argentina.gob.ar/parquesnacionales/patagonia-austral/recomendaciones-para-visitar-el-parque-nacional-los-glaciares)\n* [Национальный парк Тьерра-дель-Фуэго — активности](https://www.argentina.gob.ar/parquesnacionales/patagonia-austral/parque-nacional-tierra-del-fuego/actividades)";

const READ_TIME_MINUTES = 16;

export const PATAGONIYA_MARSHRUT_14_DNEY_SECTIONS: BlogPostSection[] = [
  {
    title: "Каркас на две недели",
    body:
      "Разделите поездку на три базы: Эль-Калафате, Эль-Чальтен и Ушуаю. Между ними оставьте дни на переезд и хотя бы один резерв на погоду. Такой порядок показывает ледники, горные тропы и Огненную Землю, но его нужно подстроить под фактические рейсы и физическую подготовку.",
  },
  {
    title: "Эль-Калафате и Эль-Чальтен",
    body:
      "Для зоны Перито-Морено заранее проверьте режим парка, билет и выбранную экскурсию. В Эль-Чальтене выбирайте тропы после прогноза и официальной сводки. Удалённые и зимние выходы могут требовать регистрации или дополнительного снаряжения; не переносите летний план на другой сезон без проверки.",
  },
  {
    title: "Ушуая и резерв",
    body:
      "В Ушуае сопоставьте парк Тьерра-дель-Фуэго, навигацию и другие активности с погодой. Не ставьте важную экскурсию на последний доступный день. Стоимость считайте по реальным билетам, проживанию, входам и услугам на даты поездки, без усреднённого бюджета в долларах.",
  },
  {
    title: "Источники и дата проверки",
    body: PATAGONIYA_MARSHRUT_14_DNEY_SOURCES_BODY,
  },
];

export const PATAGONIYA_MARSHRUT_14_DNEY_POST: Omit<BlogPost, "content" | "image"> & {
  content?: string;
  image?: string;
} = {
  id: "blog-patagonia-14",
  slug: PATAGONIYA_MARSHRUT_14_DNEY_SLUG,
  title: "Патагония за 14 дней: ледники, Фицрой и Ушуая",
  seoTitle: "Патагония за 14 дней: ледники, Фицрой и Ушуая",
  seoDescription: PATAGONIYA_MARSHRUT_14_DNEY_SEO_DESCRIPTION,
  excerpt: PATAGONIYA_MARSHRUT_14_DNEY_EXCERPT,
  sections: PATAGONIYA_MARSHRUT_14_DNEY_SECTIONS,
  author: BLOG_EDITORIAL.name,
  authorBio: BLOG_EDITORIAL.bio,
  date: "2026-06-21",
  dateModified: "2026-07-17",
  category: "Патагония",
  readTimeMinutes: READ_TIME_MINUTES,
  readTime: formatBlogReadTime(READ_TIME_MINUTES),
  tags: ["Патагония", "маршрут", "14 дней", "Перито-Морено", "Фицрой", "Ушуая", "Эль-Чальтен"],
  featured: true,
  cardVariant: "featured",
  editorialReviewed: true,
  tourEmbeds: [
    {
      id: "patagonia-14-featured",
      variant: "featured",
      title: "Туры в Патагонию на 10–14 дней",
      subtitle: "Ледники, треккинг и Ushuaia — логистика под ключ",
      limit: 3,
      source: { kind: "query", query: "Patagonia 14 days" },
      catalogHref: "/tours?query=patagonia",
      catalogLabel: "Туры в Патагонию",
      tone: "inline",
    },
  ],
  relatedResources: [
    { label: "Эль-Чалтен и Фицрой", href: "/blog/el-chalten-i-fitts-roy", type: "blog" },
    { label: "Сборы в Патагонию", href: "/blog/patagonia-packing-list", type: "blog" },
    { label: "Внутренние рейсы", href: "/blog/patagonia-авиабилеты", type: "blog" },
    { label: "Отели и бронирование", href: "/blog/patagonia-отели", type: "blog" },
    { label: "Пингвины в Патагонии", href: "/blog/patagonia-penguins", type: "blog" },
    { label: "Аргентина за 14 дней", href: "/blog/itinerary-за-14-дней", type: "blog" },
  ],
};
