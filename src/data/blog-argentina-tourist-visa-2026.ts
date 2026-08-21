/**
 * SSOT for /blog/argentina-tourist-visa-2026.
 * Body previously lived as legacyManualReplacementSections + officialSources in blog.ts.
 */
import type { BlogPost, BlogPostSection } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { BLOG_EDITORIAL } from "@/data/blog-author";

export const ARGENTINA_TOURIST_VISA_2026_SLUG = "argentina-tourist-visa-2026";

export const ARGENTINA_TOURIST_VISA_2026_EXCERPT =
  "Как проверить правила въезда туриста, разрешённый срок и документы перед поездкой в Аргентину.";

export const ARGENTINA_TOURIST_VISA_2026_SEO_DESCRIPTION =
  "Въезд туриста в Аргентину: проверка правил для своего паспорта, срок пребывания и документы перед вылетом.";

export const ARGENTINA_TOURIST_VISA_2026_SOURCES_BODY =
  "Проверено 21.08.2026. Правила зависят от гражданства и могут меняться; перед вылетом сверяйте их с Migraciones и консульством.\n\n* [Migraciones — статус туриста и продление пребывания](https://www.argentina.gob.ar/migraciones/turistas)\n* [МИД Аргентины — туристическая виза](https://www.cancilleria.gob.ar/es/servicios/visas/visa-para-turismo)\n* [МИД Аргентины — соглашение о безвизовых поездках с Россией](https://www.cancilleria.gob.ar/es/actualidad/comunicados/argentina-rusia-hoy-entra-en-vigencia-la-supresion-de-visas)";

const READ_TIME_MINUTES = 12;

export const ARGENTINA_TOURIST_VISA_2026_SECTIONS: BlogPostSection[] = [
  {
    title: "Проверьте правило для своего паспорта",
    body:
      "Для краткой туристической поездки граждан России действует соглашение о безвизовых поездках. Это не универсальное правило для всех паспортов и целей визита. Если вы едете работать, учиться, лечиться или оставаться дольше разрешённого срока, заранее уточните подходящую категорию у Migraciones или консульства.",
  },
  {
    title: "Срок определяет пограничная служба",
    body:
      "Migraciones описывает туристический статус как пребывание до трёх месяцев с возможностью запросить одно продление на сходный период. Это не правило «90 дней в каждом полугодии» и не автоматическое продление: ориентируйтесь на срок, разрешённый при въезде, и подавайте запрос до его окончания.",
  },
  {
    title: "Что подготовить",
    body:
      "Возьмите действующий паспорт и документы, которые объясняют туристическую цель: маршрут, адрес проживания и билет для выезда из страны. Конкретный набор может зависеть от гражданства и обстоятельств поездки. Не опирайтесь на случайный список из блога — перед вылетом откройте актуальные страницы Migraciones и консульства.",
  },
  {
    title: "Источники и дата проверки",
    body: ARGENTINA_TOURIST_VISA_2026_SOURCES_BODY,
  },
];

export const ARGENTINA_TOURIST_VISA_2026_POST: Omit<BlogPost, "content" | "image"> & {
  content?: string;
  image?: string;
} = {
  id: "6",
  slug: ARGENTINA_TOURIST_VISA_2026_SLUG,
  title: "Въезд туриста в Аргентину: виза, сроки и документы",
  seoTitle: "Въезд туриста в Аргентину: виза, сроки и документы",
  seoDescription: ARGENTINA_TOURIST_VISA_2026_SEO_DESCRIPTION,
  excerpt: ARGENTINA_TOURIST_VISA_2026_EXCERPT,
  sections: ARGENTINA_TOURIST_VISA_2026_SECTIONS,
  author: BLOG_EDITORIAL.name,
  authorBio: BLOG_EDITORIAL.bio,
  date: "2026-05-28",
  dateModified: "2026-07-17",
  category: "Путеводитель",
  readTimeMinutes: READ_TIME_MINUTES,
  readTime: formatBlogReadTime(READ_TIME_MINUTES),
  tags: ["виза", "въезд", "паспорт", "миграция", "турист", "безвиз", "страховка"],
  editorialReviewed: true,
  relatedResources: [
    { label: "Чек-лист перед поездкой", href: "/blog/itinerary-чек-лист", type: "blog" },
    { label: "Туристическая страховка", href: "/insurance", type: "guide" },
    { label: "Иммиграция", href: "/immigration", type: "immigration" },
    { label: "Синий доллар", href: "/blog/blue-dollar-argentina-2026", type: "blog" },
  ],
};
