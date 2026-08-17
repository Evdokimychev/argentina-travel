/**
 * SSOT for /blog/wildlife-с-гидом.
 * Body previously lived as legacyManualReplacementSections + excerpt + officialSources in blog.ts.
 */
import type { BlogPost, BlogPostSection } from "@/types";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { BLOG_EDITORIAL } from "@/data/blog-author";

export const WILDLIFE_S_GIDOM_SLUG = "wildlife-с-гидом";

export const WILDLIFE_S_GIDOM_EXCERPT =
  "Как понять, где допустима самостоятельная прогулка, а где нужен habilitado-гид конкретной территории.";

export const WILDLIFE_S_GIDOM_SEO_DESCRIPTION =
  "Когда в Аргентине можно смотреть дикую природу самостоятельно, а когда нужен habilitado-гид конкретной территории.";

export const WILDLIFE_S_GIDOM_SOURCES_BODY =
  "Проверено 17.07.2026. Необходимость сопровождения определяется правилами конкретной территории и маршрута.\n\n* [Национальные парки — правила и статус habilitado-гидов](https://www.argentina.gob.ar/parquesnacionales/guias-de-parques-nacionales)\n* [Национальные парки — общие рекомендации посетителям](https://www.argentina.gob.ar/parquesnacionales/recomendaciones-para-tu-visita)\n* [Национальный парк Тьерра-дель-Фуэго — самостоятельные и сопровождаемые активности](https://www.argentina.gob.ar/parquesnacionales/patagonia-austral/parque-nacional-tierra-del-fuego/actividades)";

const READ_TIME_MINUTES = 9;

export const WILDLIFE_S_GIDOM_SECTIONS: BlogPostSection[] = [
  {
    title: "Правила задаёт территория",
    body: "В одном национальном парке часть размеченных маршрутов может быть открыта для самостоятельного посещения, а удалённая зона — требовать регистрации или сопровождения. Перед поездкой откройте правила конкретного парка и выбранной активности.",
  },
  {
    title: "Когда гид особенно полезен",
    body: "Выбирайте habilitado-гида, если наблюдение требует знания поведения животных, маршрут проходит вне простой туристической инфраструктуры или группе нужна помощь с темпом и безопасностью. Гид повышает качество наблюдения, но не может гарантировать встречу с диким животным.",
  },
  {
    title: "Как выбрать специалиста",
    body: "Попросите указать действующую habilitación для нужной территории и категории, уточните размер группы, язык, транспорт, страховку и условия отмены. Не приближайтесь к животным, не кормите их и не перекрывайте путь ради фотографии.",
  },
  {
    title: "Источники и дата проверки",
    body: WILDLIFE_S_GIDOM_SOURCES_BODY,
  },
];

export const WILDLIFE_S_GIDOM_POST: Omit<BlogPost, "content" | "image"> & {
  content?: string;
  image?: string;
} = {
  id: "blog-wildlife-guide",
  slug: WILDLIFE_S_GIDOM_SLUG,
  title: "Дикая природа Аргентины: когда нужен гид, а когда можно самому",
  seoTitle: "Дикая природа Аргентины: когда нужен гид, а когда можно самому",
  seoDescription: WILDLIFE_S_GIDOM_SEO_DESCRIPTION,
  excerpt: WILDLIFE_S_GIDOM_EXCERPT,
  sections: WILDLIFE_S_GIDOM_SECTIONS,
  author: BLOG_EDITORIAL.name,
  authorBio: BLOG_EDITORIAL.bio,
  date: "2026-06-21",
  dateModified: "2026-07-17",
  category: "Животные Аргентины",
  readTimeMinutes: READ_TIME_MINUTES,
  readTime: formatBlogReadTime(READ_TIME_MINUTES),
  tags: [
    "дикая природа",
    "гид",
    "нацпарки",
    "Патагония",
    "Игуасу",
    "Ибера",
  ],
  editorialReviewed: true,
  featured: true,
  cardVariant: "featured",
  tourEmbeds: [
    {
      id: "wildlife-guide-featured",
      variant: "featured",
      title: "Экскурсии по дикой природе Аргентины",
      subtitle: "Киты, пингвины, Ибера и Патагония — с гидом и трансфером",
      limit: 3,
      source: {
        kind: "query",
        query: "wildlife Argentina",
      },
      catalogHref: "/tours?query=wildlife",
      catalogLabel: "Туры по природе",
      tone: "inline",
    },
  ],
  relatedResources: [
    {
      label: "Игуасу",
      href: "/blog/natsionalnyy-park-iguasu",
      type: "guide",
    },
    {
      label: "Ибера",
      href: "/blog/natsionalnyy-park-ibera",
      type: "guide",
    },
    {
      label: "Вальдес",
      href: "/blog/natsionalnyy-park-poluostrov-valdes",
      type: "guide",
    },
    {
      label: "Эль-Чалтен",
      href: "/blog/el-chalten-i-fitts-roy",
      type: "guide",
    },
    {
      label: "Сборы в Патагонию",
      href: "/blog/patagonia-packing-list",
      type: "guide",
    },
    {
      label: "Подборка «Дикая природа»",
      href: "/places?collection=wildlife-argentina",
      type: "guide",
    },
    {
      label: "Туры по природе",
      href: "/tours?query=wildlife",
      type: "tour",
    },
  ],
};
