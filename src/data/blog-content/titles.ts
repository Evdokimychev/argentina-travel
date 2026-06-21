import type { BlogContentCategory } from "@/data/blog-content-plan";
import { BLOG_CATEGORY_LABELS } from "@/data/blog-content-plan";
import { getTopicLabel } from "@/data/blog-content/topic-labels";

const CATEGORY_SHORT: Record<BlogContentCategory, string> = {
  travel: "Аргентина",
  "buenos-aires": "Буэнос-Айрес",
  patagonia: "Патагония",
  north: "Северо-запад Аргентины",
  iguazu: "Водопады Игуасу",
  "national-parks": "Национальные парки",
  trekking: "Треккинг в Аргентине",
  wineries: "Винодельни Мендосы",
  wildlife: "Дикая природа Аргентины",
  food: "Кухня Аргентины",
  transport: "Транспорт в Аргентине",
  safety: "Безопасность в Аргентине",
  money: "Деньги в Аргентине",
  internet: "Связь в Аргентине",
  "ba-neighborhoods": "Районы Буэнос-Айреса",
  relocation: "Переезд в Аргентину",
};

export function buildBlogArticleTitle(category: BlogContentCategory, topic: string): string {
  const place = CATEGORY_SHORT[category];
  const label = getTopicLabel(topic);

  if (topic === "советы-новичкам") {
    return `${place}: полный гид для новичков — с чего начать`;
  }
  if (topic === "бюджет") {
    return `${place}: сколько стоит поездка и как сэкономить`;
  }
  if (topic === "с-ребёнком") {
    return `${place} с ребёнком: маршрут, жильё и безопасность`;
  }
  if (topic === "чек-лист") {
    return `${place}: чек-лист перед поездкой`;
  }
  if (topic === "ошибки") {
    return `${place}: 10 типичных ошибок туристов`;
  }
  if (topic === "с-гидом") {
    return `${place}: когда нужен гид, а когда можно самому`;
  }
  if (topic === "самостоятельно") {
    return `${place} самостоятельно: пошаговый план`;
  }
  if (topic.startsWith("за-")) {
    return `${place} ${label}: готовый маршрут по дням`;
  }
  if (["зимой", "весной", "летом", "осенью"].includes(topic)) {
    return `${place} ${label}: погода, одежда и что успеть`;
  }
  if (topic === "garganta-del-diablo") {
    return "Garganta del Diablo: как посмотреть главный каскад Игуасу";
  }
  if (topic === "laguna-de-los-tres") {
    return "Laguna de los Tres: трек к Fitz Roy из Эль-Чалтена";
  }
  if (topic === "whale-watching") {
    return "Whale watching в Аргентине: Valdés, сезоны и бронирование";
  }
  if (topic === "malbec") {
    return "Malbec в Мендосе: сорта, bodega и дегустации";
  }
  if (topic === "asado") {
    return "Asado в Аргентине: как заказать, куда идти и сколько ждать";
  }
  if (topic === "visa-free") {
    return "Безвизовый въезд в Аргентину: кому, на сколько и что на границе";
  }
  if (topic === "90-дней") {
    return category === "money"
      ? "Финансы при поездке до 90 дней: как планировать расходы"
      : "90 дней в Аргентине без визы: правила и практика";
  }
  if (topic === "sim-карта") {
    return "SIM-карта в Аргентине: операторы, цены и eSIM";
  }
  if (topic === "наличные") {
    return "Наличные в Аргентине: доллары, евро и где менять безопасно";
  }
  if (topic === "авиабилеты") {
    return category === "transport"
      ? "Авиабилеты по Аргентине: аэропорты, лайфхаки и багаж"
      : `${place}: как долететь и купить внутренние рейсы`;
  }

  const districtTopics = ["palermo", "recoleta", "san-telmo", "microcentro", "puerto-madero"];
  if (districtTopics.includes(topic)) {
    return `Район ${label} в Buenos Aires: где жить, гулять и есть`;
  }

  return `${place}: ${label.charAt(0).toUpperCase()}${label.slice(1)} — практический гид`;
}

export function buildBlogMetaDescription(
  category: BlogContentCategory,
  topic: string,
  title: string,
): string {
  const cat = BLOG_CATEGORY_LABELS[category].toLowerCase();
  return `${title}. Подробно: сезон, логистика, бюджет и советы для русскоязычных туристов. Раздел «${cat}» на «Пора в Аргентину».`;
}

export function buildBlogSeoTitle(title: string): string {
  return title;
}
