import { CATEGORY_TOPICS } from "@/data/blog-content/category-topics";
import {
  buildBlogArticleTitle,
  buildBlogMetaDescription,
  buildBlogSeoTitle,
} from "@/data/blog-content/titles";

export type BlogContentCategory =
  | "travel"
  | "buenos-aires"
  | "patagonia"
  | "north"
  | "iguazu"
  | "national-parks"
  | "trekking"
  | "wineries"
  | "wildlife"
  | "food"
  | "transport"
  | "safety"
  | "money"
  | "internet"
  | "ba-neighborhoods"
  | "relocation";

export type BlogContentPlanItem = {
  slug: string;
  title: string;
  category: BlogContentCategory;
  seoTitle: string;
  metaDescription: string;
  outline: {
    h1: string;
    h2: string[];
    h3: Record<string, string[]>;
  };
  internalLinks: {
    places: string[];
    guides: string[];
    collections: string[];
  };
};

export const BLOG_CATEGORY_LABELS: Record<BlogContentCategory, string> = {
  travel: "Путешествия",
  "buenos-aires": "Буэнос-Айрес",
  patagonia: "Патагония",
  north: "Север Аргентины",
  iguazu: "Водопады Игуасу",
  "national-parks": "Национальные парки",
  trekking: "Горы и треккинг",
  wineries: "Винодельни",
  wildlife: "Животные Аргентины",
  food: "Кухня Аргентины",
  transport: "Транспорт",
  safety: "Безопасность",
  money: "Деньги и обмен валют",
  internet: "Интернет и связь",
  "ba-neighborhoods": "Районы Буэнос-Айреса",
  relocation: "Переезд и релокация",
};

type Template = {
  category: BlogContentCategory;
  slugPattern: string;
  guides: string[];
  places: string[];
  collections: string[];
};

const TEMPLATES: Template[] = [
  { category: "patagonia", slugPattern: "patagonia-{topic}", guides: ["patagoniya-s-chego-nachat", "pogoda-i-sezonnost"], places: ["el-calafate", "perito-moreno-glacier", "el-chalten"], collections: ["best-patagonia"] },
  { category: "buenos-aires", slugPattern: "buenos-aires-{topic}", guides: ["kultura", "kukhnya"], places: ["buenos-aires"], collections: ["week-in-argentina"] },
  { category: "north", slugPattern: "northwest-{topic}", guides: ["turistskie-regiony"], places: ["salta", "purmamarca", "cerro-de-los-7-colores"], collections: ["northwest-colors"] },
  { category: "national-parks", slugPattern: "national-park-{topic}", guides: ["dostoprimechatelnosti"], places: ["los-glaciares-national-park", "nahuel-huapi-national-park"], collections: ["best-national-parks"] },
  { category: "trekking", slugPattern: "trekking-{topic}", guides: ["patagoniya-s-chego-nachat"], places: ["el-chalten", "fitz-roy"], collections: ["best-trekking"] },
  { category: "wineries", slugPattern: "wine-{topic}", guides: ["kukhnya"], places: ["mendoza"], collections: ["wine-mendoza"] },
  { category: "wildlife", slugPattern: "wildlife-{topic}", guides: ["dostoprimechatelnosti"], places: ["valdes-peninsula", "ushuaia"], collections: ["best-patagonia"] },
  { category: "food", slugPattern: "food-{topic}", guides: ["kukhnya"], places: ["buenos-aires"], collections: [] },
  { category: "transport", slugPattern: "transport-{topic}", guides: ["kak-dobratsya", "transport"], places: ["buenos-aires"], collections: [] },
  { category: "money", slugPattern: "money-{topic}", guides: ["ekonomika-i-dengi"], places: [], collections: [] },
  { category: "safety", slugPattern: "safety-{topic}", guides: ["bezopasnost"], places: ["buenos-aires"], collections: [] },
  { category: "internet", slugPattern: "internet-{topic}", guides: ["svyaz"], places: [], collections: [] },
  { category: "ba-neighborhoods", slugPattern: "ba-district-{topic}", guides: ["gde-zhit"], places: ["buenos-aires"], collections: [] },
  { category: "relocation", slugPattern: "relocation-{topic}", guides: ["ekonomika-i-dengi", "gde-zhit"], places: ["buenos-aires"], collections: [] },
  { category: "iguazu", slugPattern: "iguazu-{topic}", guides: ["dostoprimechatelnosti"], places: ["iguazu-falls"], collections: ["best-waterfalls"] },
  { category: "travel", slugPattern: "itinerary-{topic}", guides: ["kak-dobratsya"], places: ["buenos-aires", "el-calafate", "iguazu-falls"], collections: ["week-in-argentina", "two-weeks-argentina"] },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9а-яё-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildItem(template: Template, topic: string, index: number): BlogContentPlanItem {
  const slug = slugify(template.slugPattern.replace("{topic}", topic));
  const title = buildBlogArticleTitle(template.category, topic);
  const metaDescription = buildBlogMetaDescription(template.category, topic, title);

  return {
    slug: slug || `blog-plan-${index}`,
    title,
    category: template.category,
    seoTitle: buildBlogSeoTitle(title),
    metaDescription,
    outline: {
      h1: title,
      h2: ["Кратко", "Когда ехать", "Как добраться", "Что посмотреть", "Бюджет", "FAQ"],
      h3: {
        "Что посмотреть": ["Главные точки", "Рядом", "Сколько времени"],
        FAQ: ["Нужен ли гид?", "Сколько дней?", "Безопасность"],
      },
    },
    internalLinks: {
      places: template.places,
      guides: template.guides,
      collections: template.collections,
    },
  };
}

function buildBlogContentPlan(): BlogContentPlanItem[] {
  const items: BlogContentPlanItem[] = [];
  let index = 0;

  for (const template of TEMPLATES) {
    const topics = CATEGORY_TOPICS[template.category] ?? [];
    for (const topic of topics) {
      items.push(buildItem(template, topic, index));
      index += 1;
    }
  }

  return items;
}

export const BLOG_CONTENT_PLAN: BlogContentPlanItem[] = buildBlogContentPlan();

export function getBlogPlanByCategory(category: BlogContentCategory): BlogContentPlanItem[] {
  return BLOG_CONTENT_PLAN.filter((item) => item.category === category);
}

export function getBlogPlanCategoryLabel(category: BlogContentCategory): string {
  return BLOG_CATEGORY_LABELS[category];
}

export const BLOG_CONTENT_PLAN_STATS = {
  total: BLOG_CONTENT_PLAN.length,
  categories: Object.keys(BLOG_CATEGORY_LABELS).length,
};
