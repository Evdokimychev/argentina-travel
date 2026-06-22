/** Подбор туров по теме статьи (каталог /tours) */
export type BlogCategoryTourCta = {
  query: string;
  title: string;
  subtitle: string;
};

export const BLOG_CATEGORY_TOUR_CTAS: Record<string, BlogCategoryTourCta> = {
  Патагония: {
    query: "Patagonia",
    title: "Туры в Патагонию",
    subtitle: "Ледники, треккинг и маршруты с русскоязычными гидами",
  },
  "Буэнос-Айрес": {
    query: "buenos aires",
    title: "Экскурсии по Буэнос-Айресу",
    subtitle: "Город, гастрономия и культурные маршруты",
  },
  "Север Аргентины": {
    query: "Salta",
    title: "Туры на север страны",
    subtitle: "Сальта, Quebrada и высокогорные маршруты",
  },
  "Водопады Игуасу": {
    query: "Iguazu",
    title: "Туры к водопадам Игуасу",
    subtitle: "Нацпарк, тропы и комбинации с другими регионами",
  },
  "Национальные парки": {
    query: "national park",
    title: "Туры по национальным паркам",
    subtitle: "Игуасу, Патагония, Барилоче — с гидом и логистикой",
  },
  "Горы и треккинг": {
    query: "trekking",
    title: "Треккинговые туры",
    subtitle: "Fitz Roy, лагуны и горные маршруты",
  },
  Винодельни: {
    query: "Mendoza wine",
    title: "Винные туры",
    subtitle: "Мендоса, дегустации и винодельни",
  },
  "Животные Аргентины": {
    query: "whale",
    title: "Туры к дикой природе",
    subtitle: "Киты, пингвины и полуостров Вальдес",
  },
  "Кухня Аргентины": {
    query: "asado",
    title: "Гастрономические туры",
    subtitle: "Asado, parrilla и дегустации с гидом",
  },
  Гастрономия: {
    query: "food buenos",
    title: "Гастрономические экскурсии",
    subtitle: "Стейк, parrilla и городские маршруты",
  },
  Культура: {
    query: "tango",
    title: "Культурные экскурсии",
    subtitle: "Танго, milonga и исторические кварталы",
  },
  Туры: {
    query: "Argentina",
    title: "Авторские туры по Аргентине",
    subtitle: "Готовые маршруты от организаторов на платформе",
  },
};

const DEFAULT_TOUR_CTA: BlogCategoryTourCta = {
  query: "Argentina",
  title: "Туры по Аргентине",
  subtitle: "Авторские маршруты от организаторов на платформе",
};

export function getBlogCategoryTourCta(category: string): BlogCategoryTourCta {
  return BLOG_CATEGORY_TOUR_CTAS[category] ?? {
    ...DEFAULT_TOUR_CTA,
    title: `Туры: ${category}`,
  };
}
