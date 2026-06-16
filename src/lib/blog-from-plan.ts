import { BLOG_EDITORIAL } from "@/data/blog-author";
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
import { formatBlogReadTime } from "@/lib/blog-utils";
import type { BlogPost, BlogPostSection, BlogRelatedResource } from "@/types";

const CATEGORY_IMAGES: Record<BlogContentCategory, string> = {
  travel: "https://images.unsplash.com/photo-1483728642387-6bc3bd38dafc?w=1200&q=80",
  "buenos-aires": "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&q=80",
  patagonia: "https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=1200&q=80",
  north: "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=1200&q=80",
  iguazu: "https://images.unsplash.com/photo-1552733407-5d5c46c3bb3b?w=1200&q=80",
  "national-parks": "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=80",
  trekking: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
  wineries: "https://images.unsplash.com/photo-1506377247377-2ecb89819a88?w=1200&q=80",
  wildlife: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1200&q=80",
  food: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=1200&q=80",
  transport: "https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=1200&q=80",
  safety: "https://images.unsplash.com/photo-1526778548025-fa2f0cd725df?w=1200&q=80",
  money: "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&q=80",
  internet: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
  "ba-neighborhoods": "https://images.unsplash.com/photo-1589909202800-2f2e1b8a4b8e?w=1200&q=80",
  relocation: "https://images.unsplash.com/photo-1526778548025-fa2f0cd725df?w=1200&q=80",
};

const AUTHORS = [
  { name: "Мария Гонсалес", bio: "Экскурсовод по Патагонии, 8 лет в туризме" },
  { name: "Карлос Ривера", bio: "Гастрономический гид по Буэнос-Айресу и Мендосе" },
  { name: "Ана Лópez", bio: "Журналистка и автор городских маршрутов" },
  { name: BLOG_EDITORIAL.name, bio: BLOG_EDITORIAL.bio },
] as const;

const CATEGORY_CONTEXT: Record<BlogContentCategory, string> = {
  travel: "маршрут по Аргентине с несколькими регионами",
  "buenos-aires": "столицу Аргентины — Буэнос-Айрес",
  patagonia: "южную Патагонию с ледниками, горами и ветром",
  north: "северо-запад — Сальту, Кафаяте и горные деревни",
  iguazu: "водопады Игуасу на границе с Бразилией и Парагваем",
  "national-parks": "национальные парки Аргентины",
  trekking: "горные треки и походы",
  wineries: "винодельни Мендосы и винный туризм",
  wildlife: "дикую природу — китов, пингвинов и condor",
  food: "аргентинскую кухню и гастрономические традиции",
  transport: "транспорт внутри страны — авиа, автобусы и аренду авто",
  safety: "безопасность туриста в городе и на природе",
  money: "деньги, курс и способы оплаты",
  internet: "мобильную связь и интернет для путешественника",
  "ba-neighborhoods": "районы Буэнос-Айреса для проживания и прогулок",
  relocation: "переезд и длительное пребывание в Аргентине",
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
  "northwest-colors": "Северо-запад: цвета",
  "best-national-parks": "Лучшие нацпарки",
  "best-trekking": "Лучшие треки",
  "wine-mendoza": "Вино Мендосы",
  "best-waterfalls": "Лучшие водопады",
  "two-weeks-argentina": "Две недели в Аргентине",
};

const PLAN_BY_SLUG = new Map(BLOG_CONTENT_PLAN.map((item) => [item.slug, item]));

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

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

function staggerDate(index: number): string {
  const start = new Date("2025-06-01T12:00:00Z");
  const d = new Date(start);
  d.setUTCDate(d.getUTCDate() + index * 4);
  return d.toISOString().slice(0, 10);
}

function estimateViews(index: number): number {
  return 3200 + ((index * 7919) % 18500);
}

function buildRelatedResources(item: BlogContentPlanItem): BlogRelatedResource[] {
  const resources: BlogRelatedResource[] = [];

  for (const slug of item.internalLinks.places) {
    resources.push({
      label: humanizeSlug(slug),
      href: `/places/${slug}`,
      type: "tour",
    });
  }
  for (const slug of item.internalLinks.guides) {
    resources.push({
      label: GUIDE_LABELS[slug] ?? humanizeSlug(slug),
      href: `/guide/${slug}`,
      type: "guide",
    });
  }
  for (const slug of item.internalLinks.collections) {
    resources.push({
      label: COLLECTION_LABELS[slug] ?? humanizeSlug(slug),
      href: `/collections/${slug}`,
      type: "blog",
    });
  }

  return resources;
}

function buildTags(item: BlogContentPlanItem, topic: string): string[] {
  const topicTags = topic
    .split("-")
    .filter((t) => t.length > 2)
    .slice(0, 4);
  const placeTags = item.internalLinks.places.slice(0, 2).map(humanizeSlug);
  return [
    getBlogPlanCategoryLabel(item.category),
    ...topicTags,
    ...placeTags,
  ].slice(0, 8);
}

function sectionIntro(item: BlogContentPlanItem, topic: string): string {
  const region = CATEGORY_CONTEXT[item.category];
  const topicLabel = topic.replace(/-/g, " ");
  return `В этой статье разбираем тему «${topicLabel}» в контексте ${region}. Материал ориентирован на русскоязычных путешественников, которые планируют поездку самостоятельно или с гидом и хотят заранее понять сезон, логистику и типичные ошибки.`;
}

function sectionWhen(item: BlogContentPlanItem, topic: string): string {
  const topicLabel = topic.replace(/-/g, " ");
  if (item.category === "iguazu") {
    const rainHint = topic.includes("сезон-дож") || topic.includes("дожд")
      ? " В сезон дождей Garganta del Diablo особенно мощная, но часть троп может быть закрыта."
      : " После нескольких дней дождя поток воды заметно растёт — удобно планировать второй визит в парк.";
    return `Водопады Игуасу полноводнее с ноября по март; в сухой сезон (май–август) тропы комфортнее, но каскады менее эффектные.${rainHint} Тема «${topicLabel}»: закладывайте полный день на аргентинскую сторону и отдельно учитывайте бразильский обзорный маршрут, если нужны оба ракурса.`;
  }
  if (item.category === "wineries") {
    return `Винный сезон в Мендосе — с сентября по апрель: март–апрель совпадает с vendimia (сбор урожая), январь–февраль подходит для bike tours между bodegas. Летняя жара днём (до 35 °C) — дегустации и экскурсии лучше планировать утром или ближе к закату. Тема «${topicLabel}»: бронируйте дегустации в популярных bodegas за 1–2 недели в пик.`;
  }
  if (item.category === "north") {
    return `Северо-запад (Salta, Jujuy, Quebrada de Humahuaca) комфортнее весной (сентябрь–ноябрь) и осенью (март–май): меньше жары на высоте Purmamarca и Cuesta del Lipán. Летом дневная жара в долинах, зимой на высоте бывает холодно — для темы «${topicLabel}» берите слои и планируйте медленную акклиматизацию перед Tren de las Nubes или высокогорными переездами.`;
  }
  if (item.category === "relocation") {
    const visaHint =
      topic.includes("90") || topic.includes("visa")
        ? " Безвизовый режим для многих паспортов даёт до 90 дней — штамп ставят на границе, продление не гарантировано."
        : topic.includes("продлен")
          ? " Продление туристического статуса — через миграционную службу; успех зависит от оснований, не рассчитывайте на автоматическое продление."
          : "";
    return `Для релокации и длительного пребывания планируйте документы заранее: загранпаспорт, медстраховку, подтверждение жилья.${visaHint} Тема «${topicLabel}» — сверяйтесь с актуальными правилами Migraciones и консульства перед поездкой.`;
  }
  const seasonal =
    topic.includes("зим") || topic.includes("холод")
      ? "Зимой дни короче, но меньше туристов — закладывайте тёплые слои и гибкий график на случай ветра или дождя."
      : topic.includes("лет") || topic.includes("жар")
        ? "Летом (с декабря по февраль в южном полушарии) бронируйте жильё и трансферы заранее — это пик сезона во многих регионах."
        : topic.includes("весн") || topic.includes("осен")
          ? "Межсезонье часто даёт комфортную погоду и умеренные цены — удобно для темы «" + topicLabel + "»."
          : "Оптимальное окно зависит от региона: для юга смотрите ноябрь–март, для северо-запада — весну и осень, для столицы подойдёт большую часть года.";
  return `${seasonal} Сверяйтесь с разделом путеводителя о погоде и учитывайте локальные праздники — в эти даты транспорт и отели заполняются быстрее.`;
}

function sectionTransport(item: BlogContentPlanItem): string {
  if (item.category === "relocation") {
    return "Для длительного пребывания удобнее снимать жильё в районах с метро (Palermo, Belgrano, Recoleta). SIM-карту оформите в официальном салоне — нужен паспорт. Для поездок по стране сравните внутренние перелёты и автобусы cama: ночной рейс может заменить ночёвку в отеле.";
  }
  if (item.category === "transport" || item.category === "travel") {
    return "Внутренние перелёты экономят время на длинных плечах — сравнивайте багаж и правила изменения билета. Между городами удобны автобусы класса cama или semi-cama: ночные рейсы часто выгоднее отеля плюс дневной переезд. Аренда авто оправдана в винных долинах и на северо-западе, если уверенно чувствуете себя на гравийных дорогах.";
  }
  if (item.category === "patagonia" || item.category === "trekking") {
    return "Базовые точки Патагонии — Эль-Калафате, Эль-Чалтén и Ушуая — связаны авиарейсами через Буэнос-Айрес или другие хабы. Между городами ходят автобусы; до трейлхедов часто нужен такси или трансфер из тура. Закладывайте запасной день на случай отмен рейсов из-за погоды.";
  }
  if (item.category === "buenos-aires" || item.category === "ba-neighborhoods") {
    return "Международный аэропорт Ezeiza (EZE) и городской Aeroparque (AEP) связаны с центром такси, приложениями или трансфером. Внутри города удобны метро, автобусы и поездки через проверенные приложения — наличные мелочью пригодятся для автобуса.";
  }
  return "Сначала определите входной город — чаще всего это Буэнос-Айрес — и от него стройте внутренние перелёты или автобусы. Покупайте билеты на официальных сайтах авиакомпаний и крупных автобусных вокзалов; сохраняйте подтверждения бронирования жилья — их могут спросить на границе или при посадке.";
}

function sectionSights(item: BlogContentPlanItem, topic: string): string {
  const places = item.internalLinks.places.map(humanizeSlug);
  const placeHint =
    places.length > 0
      ? `Обратите внимание на ${places.join(", ")} — это ключевые точки маршрута. `
      : "";
  const topicLabel = topic.replace(/-/g, " ");
  if (item.category === "iguazu") {
    return `${placeHint}Классический маршрут: нижние тропы (близко к воде), верхние (панорамы), поезд Ecological Jungle Train до Garganta del Diablo. Coatís в парке — не кормите и держите рюкзаки закрытыми. Для «${topicLabel}» оставьте запасной день на случай дождя или повторного визита при максимальном потоке.`;
  }
  if (item.category === "wineries") {
    return `${placeHint}Maipú и Luján de Cuyo — ближе к городу Mendoza, удобны на полдня; Valle de Uco — дальше, но известен высокогорными malbec. Сравните guided tour с арендой велосипеда между bodegas — в жару велосипед только утром. Тема «${topicLabel}»: 2–3 bodegas за день без спешки лучше, чем пять «на галочку».`;
  }
  if (item.category === "north") {
    return `${placeHint}Quebrada de Humahuaca (UNESCO) — Cerro de los 7 Colores в Purmamarca, Salinas Grandes и Cuesta del Lipán на маршруте к Susques. Кафедральный Salta и peñas — вечерняя программа. Для «${topicLabel}» закладывайте медленный темп: высота и serpentine дороги удлиняют переезды.`;
  }
  return `${placeHint}Для темы «${topicLabel}» составьте короткий список главных точек и оставьте 20–30 % времени без жёсткого плана: погода и очереди в парках меняют реальный график. Утренние часы обычно спокойнее для музеев, набережных и смотровых площадок.`;
}

function sectionBudget(item: BlogContentPlanItem, topic: string): string {
  const moneyNote =
    item.category === "money"
      ? "Следите за официальным и туристическим курсом — иногда выгоднее платить картой иностранного банка, иногда — небольшими суммами наличными долларами или евро в легальном обменнике."
      : item.category === "relocation"
        ? "При переезде заложите депозит за аренду (1–2 месяца), расходы на SIM, транспортную карту SUBE и первичную закупку бытовых мелочей. Курс песо меняется — не обменивайте всю сумму сразу."
        : item.category === "iguazu"
          ? "Билеты в парк, трансфер из Puerto Iguazú и питание внутри — основные статьи. Бразильская сторона (Foz) требует отдельного въезда — учитывайте в бюджете."
          : "Сравнивайте цены на жильё в разных районах и бронируйте популярные даты заранее.";
  const topicLabel = topic.replace(/-/g, " ");
  return `Бюджет по теме «${topicLabel}» складывается из перелётов, проживания, питания и активностей. ${moneyNote} Оставьте резерв 10–15 % на непредвиденное: доплату за багаж, трансфер при задержке рейса или один «запасной» вечер в городе.`;
}

function sectionFaq(item: BlogContentPlanItem, topic: string): string {
  const topicLabel = topic.replace(/-/g, " ");
  const guideHint =
    item.internalLinks.guides.length > 0
      ? "Подробные инструкции — в связанных разделах путеводителя по ссылкам ниже."
      : "Уточняйте правила на официальных сайтах парков и авиакомпаний перед выездом.";
  return `Нужен ли гид для «${topicLabel}» — зависит от опыта и языка: на популярных тропах можно идти самостоятельно, на сложных участках или в сезон дождей гид повышает безопасность. Закладывайте минимум на один–два полных дня больше, чем кажется из блога или буклета. ${guideHint}`;
}

function sectionBrief(item: BlogContentPlanItem, topic: string): string {
  const intro = sectionIntro(item, topic);
  return `${intro} ${item.metaDescription} Ниже — практические шаги: когда ехать, как добраться, что включить в маршрут и на что заложить бюджет.`;
}

function generateSectionBody(
  h2: string,
  item: BlogContentPlanItem,
  topic: string
): string {
  switch (h2) {
    case "Кратко":
      return sectionBrief(item, topic);
    case "Когда ехать":
      return sectionWhen(item, topic);
    case "Как добраться":
      return sectionTransport(item);
    case "Что посмотреть":
      return sectionSights(item, topic);
    case "Бюджет":
      return sectionBudget(item, topic);
    case "FAQ":
      return sectionFaq(item, topic);
    default:
      return `Раздел «${h2}» для маршрута ${item.title}: учитывайте сезон, бронируйте жильё заранее и сверяйтесь с актуальными правилами парков и перевозчиков перед поездкой.`;
  }
}

function buildSections(item: BlogContentPlanItem, topic: string): BlogPostSection[] {
  return item.outline.h2.map((title) => ({
    title,
    body: generateSectionBody(title, item, topic),
  }));
}

function flattenSections(sections: BlogPostSection[]): string {
  return sections.map((s) => s.body).join(" ");
}

function estimateReadMinutes(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.min(12, Math.max(5, Math.round(words / 180)));
}

export function generateBlogPostFromPlan(
  item: BlogContentPlanItem,
  index: number
): BlogPost {
  const topic = extractTopicSlug(item);
  const sections = buildSections(item, topic);
  const content = flattenSections(sections);
  const readTimeMinutes = estimateReadMinutes(content);
  const author = AUTHORS[index % AUTHORS.length];

  return {
    id: `plan-${index + 1}`,
    slug: item.slug,
    title: item.title,
    seoTitle: item.seoTitle,
    excerpt: item.metaDescription,
    content,
    sections,
    author: author.name,
    authorBio: author.bio,
    date: staggerDate(index),
    image: CATEGORY_IMAGES[item.category],
    category: getBlogPlanCategoryLabel(item.category),
    readTimeMinutes,
    readTime: formatBlogReadTime(readTimeMinutes),
    views: estimateViews(index),
    tags: buildTags(item, topic),
    relatedResources: buildRelatedResources(item),
  };
}

export function getPublishedPlanPosts(
  excludeSlugs?: ReadonlySet<string>
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
