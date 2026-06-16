/**
 * Контент-план блога — 200+ заготовок статей.
 * Stubs для будущей редакции; не публикуются автоматически.
 */

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
  titlePattern: string;
  slugPattern: string;
  guides: string[];
  places: string[];
  collections: string[];
};

const TEMPLATES: Template[] = [
  { category: "patagonia", titlePattern: "Patagonia: {topic}", slugPattern: "patagonia-{topic}", guides: ["patagoniya-s-chego-nachat", "pogoda-i-sezonnost"], places: ["el-calafate", "perito-moreno-glacier", "el-chalten"], collections: ["best-patagonia"] },
  { category: "buenos-aires", titlePattern: "Buenos Aires: {topic}", slugPattern: "buenos-aires-{topic}", guides: ["kultura", "kukhnya"], places: ["buenos-aires"], collections: ["week-in-argentina"] },
  { category: "north", titlePattern: "Северо-запад: {topic}", slugPattern: "northwest-{topic}", guides: ["turistskie-regiony"], places: ["salta", "purmamarca", "cerro-de-los-7-colores"], collections: ["northwest-colors"] },
  { category: "national-parks", titlePattern: "Нацпарк: {topic}", slugPattern: "national-park-{topic}", guides: ["dostoprimechatelnosti"], places: ["los-glaciares-national-park", "nahuel-huapi-national-park"], collections: ["best-national-parks"] },
  { category: "trekking", titlePattern: "Треккинг: {topic}", slugPattern: "trekking-{topic}", guides: ["patagoniya-s-chego-nachat"], places: ["el-chalten", "fitz-roy"], collections: ["best-trekking"] },
  { category: "wineries", titlePattern: "Вино: {topic}", slugPattern: "wine-{topic}", guides: ["kukhnya"], places: ["mendoza"], collections: ["wine-mendoza"] },
  { category: "wildlife", titlePattern: "Природа: {topic}", slugPattern: "wildlife-{topic}", guides: ["dostoprimechatelnosti"], places: ["valdes-peninsula", "ushuaia"], collections: ["best-patagonia"] },
  { category: "food", titlePattern: "Кухня: {topic}", slugPattern: "food-{topic}", guides: ["kukhnya"], places: ["buenos-aires"], collections: [] },
  { category: "transport", titlePattern: "Транспорт: {topic}", slugPattern: "transport-{topic}", guides: ["kak-dobratsya", "transport"], places: ["buenos-aires"], collections: [] },
  { category: "money", titlePattern: "Деньги: {topic}", slugPattern: "money-{topic}", guides: ["ekonomika-i-dengi"], places: [], collections: [] },
  { category: "safety", titlePattern: "Безопасность: {topic}", slugPattern: "safety-{topic}", guides: ["bezopasnost"], places: ["buenos-aires"], collections: [] },
  { category: "internet", titlePattern: "Связь: {topic}", slugPattern: "internet-{topic}", guides: ["svyaz"], places: [], collections: [] },
  { category: "ba-neighborhoods", titlePattern: "Район BA: {topic}", slugPattern: "ba-district-{topic}", guides: ["gde-zhit"], places: ["buenos-aires"], collections: [] },
  { category: "relocation", titlePattern: "Релокация: {topic}", slugPattern: "relocation-{topic}", guides: ["ekonomika-i-dengi", "gde-zhit"], places: ["buenos-aires"], collections: [] },
  { category: "iguazu", titlePattern: "Iguazú: {topic}", slugPattern: "iguazu-{topic}", guides: ["dostoprimechatelnosti"], places: ["iguazu-falls"], collections: ["best-waterfalls"] },
  { category: "travel", titlePattern: "Маршрут: {topic}", slugPattern: "itinerary-{topic}", guides: ["kak-dobratsya"], places: ["buenos-aires", "el-calafate", "iguazu-falls"], collections: ["week-in-argentina", "two-weeks-argentina"] },
];

const TOPICS = [
  "советы-новичкам", "бюджет", "с-ребёнком", "зимой", "весной", "летом", "осенью",
  "за-3-дня", "за-5-дней", "за-7-дней", "за-10-дней", "за-14-дней",
  "авиабилеты", "автобусы", "аренда-авто", "поезда",
  "отели", "хостелы", "airbnb", "camping",
  "фото", "drone", "рассвет", "закат",
  "с-гидом", "самостоятельно", "чек-лист", "ошибки",
  "с-чем-совмещать", "open-jaw", "стоповер",
  "сезон-дождей", "ветер", "холод", "жара",
  "страховка", "sim-карта", "наличные", "карты",
  "palermo", "recoleta", "san-telmo", "microcentro", "puerto-madero",
  "asado", "empanadas", "mate", "malbec", "bodega-tour",
  "whale-watching", "penguins", "condors", "guanaco",
  "laguna-de-los-tres", "mini-trekking", "circuito-chico", "garganta-del-diablo",
  "visa-free", "90-дней", "продление", "медстраховка",
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
  const title = template.titlePattern.replace("{topic}", topic.replace(/-/g, " "));
  const h1 = title.charAt(0).toUpperCase() + title.slice(1);

  return {
    slug: slug || `blog-plan-${index}`,
    title: h1,
    category: template.category,
    seoTitle: `${h1} | Пора в Аргентину`,
    metaDescription: `Практический гид: ${h1.toLowerCase()}. Советы для русскоязычных путешественников — маршруты, бюджет, сезон.`,
    outline: {
      h1,
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
    for (const topic of TOPICS) {
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
