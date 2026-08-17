/**
 * SSOT for /blog/uco-valley-vino-i-gory.
 * Body previously lived as legacyManualSectionOverrides + officialSources in blog.ts.
 */
import type { BlogPost, BlogPostSection } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { BLOG_EDITORIAL } from "@/data/blog-author";

export const UCO_VALLEY_VINO_I_GORY_SLUG = "uco-valley-vino-i-gory";

export const UCO_VALLEY_VINO_I_GORY_EXCERPT =
  "Uco Valley за пределами классического Maipú: высокогорные винодельни, malbec с характером, лучшие виды на Аконкагуа и как спланировать день.";

export const UCO_VALLEY_VINO_I_GORY_SEO_DESCRIPTION =
  "Долина Уко: винодельни, маршрут на день, дегустации и что подтвердить перед бронированием.";

export const UCO_VALLEY_VINO_I_GORY_SOURCES_BODY =
  "Проверено 17.07.2026. Бронирование, состав дегустации и транспорт подтверждайте у выбранной винодельни.\n\n* [Правительство Мендосы — туристические предложения долины Уко](https://www.mendoza.gov.ar/prensa/valle-de-uco-cientos-de-propuestas-para-el-disfrute/)\n* [Правительство Мендосы — обзор винного туризма](https://www.mendoza.gov.ar/prensa/todo-lo-que-hay-que-saber-sobre-el-turismo-del-vino-y-su-importancia-en-mendoza/)";

const READ_TIME_MINUTES = 10;

export const UCO_VALLEY_VINO_I_GORY_SECTIONS: BlogPostSection[] = [
  {
    title: "Кратко",
    body: "Долина Уко объединяет Тупунгато, Тунуян и Сан-Карлос и известна винным туризмом, горными пейзажами и гастрономическими программами. Для первого знакомства обычно выделяют отдельный день и заранее бронируют конкретные винодельни.",
  },
  {
    title: "Маршрут и практика",
    body: "Сначала выберите две совместимые по времени винодельни и запросите у каждой подтверждение бронирования. Если планируется дегустация, заранее организуйте трансфер или поездку с водителем. Не полагайтесь на случайное такси между удалёнными хозяйствами.",
  },
  {
    title: "Бюджет",
    body: "Стоимость зависит от программы, обеда, трансфера и даты. Сравнивайте итоговую цену напрямую у винодельни и перевозчика; старые фиксированные суммы в песо не дают полезного ориентира.",
  },
  {
    title: "FAQ",
    body: "Одного дня достаточно для первого знакомства, если не перегружать программу. Условия посещения с детьми, языки экскурсии и допустимый возраст для дегустации уточняйте у каждой винодельни до оплаты.",
  },
  {
    title: "Источники и дата проверки",
    body: UCO_VALLEY_VINO_I_GORY_SOURCES_BODY,
  },
];

export const UCO_VALLEY_VINO_I_GORY_POST: Omit<BlogPost, "content" | "image"> & {
  content?: string;
  image?: string;
} = {
  id: "blog-uco-valley",
  slug: UCO_VALLEY_VINO_I_GORY_SLUG,
  title: "Долина Уко: вино, Аконкагуа и дегустации",
  seoTitle: "Долина Уко: вино, Аконкагуа и дегустации у подножия Анд",
  seoDescription: UCO_VALLEY_VINO_I_GORY_SEO_DESCRIPTION,
  excerpt: UCO_VALLEY_VINO_I_GORY_EXCERPT,
  sections: UCO_VALLEY_VINO_I_GORY_SECTIONS,
  author: BLOG_EDITORIAL.name,
  authorBio: BLOG_EDITORIAL.bio,
  date: "2026-06-21",
  dateModified: "2026-07-17",
  category: "Винодельни",
  readTimeMinutes: READ_TIME_MINUTES,
  readTime: formatBlogReadTime(READ_TIME_MINUTES),
  tags: [
    "Uco Valley",
    "Мендоса",
    "malbec",
    "вино",
    "Аконкагуа",
    "bodega",
  ],
  editorialReviewed: true,
  featured: true,
  tourEmbeds: [
    {
      id: "uco-valley-wine-featured",
      variant: "featured",
      title: "Винные туры в долине Уко",
      subtitle: "Высокогорные bodega и дегустации — трансфер включён",
      limit: 3,
      source: {
        kind: "query",
        query: "Mendoza Uco wine",
      },
      catalogHref: "/tours?query=mendoza",
      catalogLabel: "Туры в Мендосу",
      tone: "inline",
    },
  ],
  relatedResources: [
    {
      label: "Винный маршрут Мендосы",
      href: "/blog/mendoza-vinnyj-gid",
      type: "guide",
    },
    {
      label: "Мендоса",
      href: "/places/mendoza",
      type: "guide",
    },
    {
      label: "Долина Уко",
      href: "/places/uco-valley",
      type: "guide",
    },
    {
      label: "Кухня и вино",
      href: "/guide/kukhnya",
      type: "guide",
    },
  ],
};
