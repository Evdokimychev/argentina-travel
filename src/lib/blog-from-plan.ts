import { BLOG_EDITORIAL } from "@/data/blog-author";
import { getEditorialOverride } from "@/data/blog-editorial";
import { estimateReadMinutesFromSections, sectionsToContent as editorialSectionsToContent } from "@/data/blog-editorial/helpers";
import {
  buildArticleSections,
  sectionsToBlogPostSections,
  sectionsToContent,
} from "@/data/blog-content/article-content";
import {
  BLOG_PUBLISH_ALL_PLAN,
  BLOG_PUBLISHED_SLUGS,
} from "@/data/blog-published-slugs";
import {
  BLOG_CONTENT_PLAN,
  getBlogPlanCategoryLabel,
  type BlogContentCategory,
  type BlogContentPlanItem,
} from "@/data/blog-content-plan";
import { getTopicLabel } from "@/data/blog-content/topic-labels";
import { formatBlogReadTime } from "@/lib/blog-utils";
import { getBlogCategoryImage } from "@/lib/media-resolver";
import type { BlogPost, BlogRelatedResource } from "@/types";

function categoryImage(category: BlogContentCategory): string {
  return getBlogCategoryImage(category);
}

const PLACE_LABELS: Record<string, string> = {
  "buenos-aires": "Буэнос-Айрес",
  ushuaia: "Ушуайя",
  "el-calafate": "Эль-Калафате",
  "perito-moreno-glacier": "Ледник Перито-Морено (Perito Moreno)",
  "el-chalten": "Эль-Чалтен",
  mendoza: "Мендоса",
  salta: "Сальта",
  purmamarca: "Пурмамарка (Purmamarca)",
  "iguazu-falls": "Водопады Игуасу",
  "fitz-roy": "Fitz Roy",
  "los-glaciares-national-park": "Нацпарк Los Glaciares",
  "nahuel-huapi-national-park": "Нацпарк Nahuel Huapi",
  "valdes-peninsula": "Полуостров Valdés",
  "cerro-de-los-7-colores": "Cerro de los 7 Colores",
};

const GUIDE_LABELS: Record<string, string> = {
  "patagoniya-s-chego-nachat": "Патагония: с чего начать",
  "pogoda-i-sezonnost": "Погода и сезонность",
  kultura: "Культура",
  kukhnya: "Кухня Аргентины",
  "turistskie-regiony": "Туристические регионы",
  dostoprimechatelnosti: "Достопримечательности",
  "kak-dobratsya": "Как добраться",
  transport: "Транспорт",
  "ekonomika-i-dengi": "Экономика и деньги",
  bezopasnost: "Безопасность",
  svyaz: "Связь и интернет",
  "gde-zhit": "Где жить",
};

const COLLECTION_LABELS: Record<string, string> = {
  "best-patagonia": "Лучшее в Патагонии",
  "week-in-argentina": "Неделя в Аргентине",
  "two-weeks-argentina": "Две недели в Аргентине",
  "northwest-colors": "Северо-запад: цвета",
  "best-national-parks": "Лучшие нацпарки",
  "best-trekking": "Лучшие треки",
  "wine-mendoza": "Вино Мендосы",
  "best-waterfalls": "Лучшие водопады",
};

const PLAN_BY_SLUG = new Map(BLOG_CONTENT_PLAN.map((item) => [item.slug, item]));

function extractTopicSlug(item: BlogContentPlanItem): string {
  const prefixes = [
    "patagonia-",
    "buenos-aires-",
    "northwest-",
    "national-park-",
    "trekking-",
    "wine-",
    "wildlife-",
    "food-",
    "transport-",
    "money-",
    "safety-",
    "internet-",
    "ba-district-",
    "relocation-",
    "iguazu-",
    "itinerary-",
  ];
  for (const prefix of prefixes) {
    if (item.slug.startsWith(prefix)) return item.slug.slice(prefix.length);
  }
  return item.slug;
}

function buildRelatedResources(item: BlogContentPlanItem): BlogRelatedResource[] {
  const resources: BlogRelatedResource[] = [];

  for (const slug of item.internalLinks.places) {
    resources.push({
      label: PLACE_LABELS[slug] ?? slug,
      href: `/places/${slug}`,
      type: "guide",
    });
  }
  for (const slug of item.internalLinks.guides) {
    resources.push({
      label: GUIDE_LABELS[slug] ?? slug,
      href: `/guide/${slug}`,
      type: "guide",
    });
  }
  for (const slug of item.internalLinks.collections) {
    resources.push({
      label: COLLECTION_LABELS[slug] ?? slug,
      href: `/collections/${slug}`,
      type: "blog",
    });
  }

  return resources.slice(0, 6);
}

function buildTags(item: BlogContentPlanItem, topic: string): string[] {
  const topicLabel = getTopicLabel(topic);
  const placeTags = item.internalLinks.places
    .slice(0, 2)
    .map((s) => PLACE_LABELS[s] ?? s);
  return [getBlogPlanCategoryLabel(item.category), topicLabel, ...placeTags].slice(0, 6);
}

function staggerDate(index: number): string {
  const start = new Date("2025-06-01T12:00:00Z");
  const d = new Date(start);
  d.setUTCDate(d.getUTCDate() + index * 4);
  return d.toISOString().slice(0, 10);
}

function estimateViews(index: number): number {
  return 3200 + ((index * 7919) % 18500);
}

function estimateReadMinutes(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.min(18, Math.max(8, Math.round(words / 160)));
}

export function generateBlogPostFromPlan(
  item: BlogContentPlanItem,
  index: number,
): BlogPost {
  const topic = extractTopicSlug(item);
  const override = getEditorialOverride(item.slug);
  const author = BLOG_EDITORIAL;

  if (override) {
    const sections = override.sections;
    const content = editorialSectionsToContent(sections);
    const readTimeMinutes = estimateReadMinutesFromSections(sections);

    return {
      id: `plan-${item.slug}`,
      slug: item.slug,
      title: override.title ?? item.title,
      seoTitle: override.seoTitle ?? item.seoTitle,
      excerpt: override.excerpt ?? item.metaDescription,
      content,
      sections,
      author: author.name,
      authorBio: author.bio,
      date: staggerDate(index),
      image: categoryImage(item.category),
      category: getBlogPlanCategoryLabel(item.category),
      readTimeMinutes,
      readTime: formatBlogReadTime(readTimeMinutes),
      views: estimateViews(index),
      tags: buildTags(item, topic),
      relatedResources: buildRelatedResources(item),
      editorialReviewed: true,
      noIndex: false,
    };
  }

  const richSections = buildArticleSections(item.category, topic);
  const sections = sectionsToBlogPostSections(richSections);
  const content = sectionsToContent(richSections);
  const readTimeMinutes = estimateReadMinutes(content);

  return {
    id: `plan-${item.slug}`,
    slug: item.slug,
    title: item.title,
    seoTitle: item.seoTitle,
    excerpt: item.metaDescription,
    content,
    sections,
    author: author.name,
    authorBio: author.bio,
    date: staggerDate(index),
    image: categoryImage(item.category),
    category: getBlogPlanCategoryLabel(item.category),
    readTimeMinutes,
    readTime: formatBlogReadTime(readTimeMinutes),
    views: estimateViews(index),
    tags: buildTags(item, topic),
    relatedResources: buildRelatedResources(item),
    noIndex: true,
  };
}

export function getPublishedPlanPosts(
  excludeSlugs?: ReadonlySet<string>,
): BlogPost[] {
  if (BLOG_PUBLISH_ALL_PLAN) {
    const items = excludeSlugs
      ? BLOG_CONTENT_PLAN.filter((item) => !excludeSlugs.has(item.slug))
      : BLOG_CONTENT_PLAN;
    return items.map((item, index) => generateBlogPostFromPlan(item, index));
  }

  return BLOG_PUBLISHED_SLUGS.map((slug, index) => {
    const item = PLAN_BY_SLUG.get(slug);
    if (!item) {
      throw new Error(`Blog plan item not found for slug: ${slug}`);
    }
    return generateBlogPostFromPlan(item, index);
  });
}

export type AutoGeneratedBlogInventoryItem = {
  slug: string;
  title: string;
  category: BlogContentCategory;
  date: string;
  hasCyrillicSlug: boolean;
};

/** Класс B: slug'и шаблонных статей без editorial override (для выгрузки/уникализации). */
export function listAutoGeneratedBlogInventory(
  excludeSlugs?: ReadonlySet<string>,
): AutoGeneratedBlogInventoryItem[] {
  const items = excludeSlugs
    ? BLOG_CONTENT_PLAN.filter((item) => !excludeSlugs.has(item.slug))
    : BLOG_CONTENT_PLAN;

  return items
    .filter((item) => !getEditorialOverride(item.slug))
    .map((item, index) => {
      const post = generateBlogPostFromPlan(item, index);
      return {
        slug: item.slug,
        title: item.title,
        category: item.category,
        date: post.date,
        hasCyrillicSlug: /[а-яё]/i.test(item.slug),
      };
    });
}
