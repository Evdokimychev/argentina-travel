/**
 * Опубликованные slug из контент-плана (волна 1 + волна 2).
 * Ручные посты в blog.ts имеют приоритет при совпадении slug.
 *
 * Волна 3: при `BLOG_PUBLISH_ALL_PLAN = true` публикуются все пункты
 * `BLOG_CONTENT_PLAN`, кроме slug ручных постов (см. getPublishedPlanPosts).
 */
export const BLOG_PUBLISH_ALL_PLAN = true;

export const BLOG_PUBLISHED_SLUGS: string[] = [
  // ——— Волна 1 ———

  // Патагония
  "patagonia-советы-новичкам",
  "patagonia-за-7-дней",
  "patagonia-ветер",
  "patagonia-самостоятельно",
  "patagonia-зимой",
  "patagonia-за-14-дней",
  // Буэнос-Айрес
  "buenos-aires-советы-новичкам",
  "buenos-aires-за-3-дня",
  "buenos-aires-с-гидом",
  "buenos-aires-бюджет",
  // Север
  "northwest-за-5-дней",
  "northwest-сезон-дождей",
  "northwest-бюджет",
  "northwest-самостоятельно",
  // Игуасу
  "iguazu-garganta-del-diablo",
  "iguazu-за-3-дня",
  "iguazu-советы-новичкам",
  // Нацпарки
  "national-park-circuito-chico",
  "national-park-laguna-de-los-tres",
  "national-park-за-7-дней",
  // Треккинг
  "trekking-laguna-de-los-tres",
  "trekking-mini-trekking",
  "trekking-чек-лист",
  "trekking-с-гидом",
  // Винодельни
  "wine-malbec",
  "wine-bodega-tour",
  "wine-за-3-дня",
  // Дикая природа
  "wildlife-whale-watching",
  "wildlife-penguins",
  "wildlife-condors",
  "wildlife-guanaco",
  // Кухня
  "food-asado",
  "food-empanadas",
  "food-mate",
  "food-malbec",
  // Транспорт
  "transport-авиабилеты",
  "transport-автобусы",
  "transport-аренда-авто",
  "transport-поезда",
  // Деньги
  "money-наличные",
  "money-карты",
  "money-страховка",
  // Безопасность
  "safety-чек-лист",
  "safety-ошибки",
  // Связь
  "internet-sim-карта",
  "internet-советы-новичкам",
  // Районы BA
  "ba-district-palermo",
  "ba-district-recoleta",
  "ba-district-san-telmo",
  "ba-district-puerto-madero",
  // Маршруты
  "itinerary-open-jaw",
  "itinerary-за-14-дней",
  "itinerary-бюджет",
  "itinerary-за-10-дней",

  // ——— Волна 2: релокация, сезоны, пробелы регионов ———

  // Релокация и длительное пребывание
  "relocation-90-дней",
  "relocation-visa-free",
  "relocation-медстраховка",
  "relocation-продление",
  "relocation-советы-новичкам",
  "relocation-бюджет",
  "relocation-наличные",
  "relocation-карты",

  // Безопасность и деньги (дополнение)
  "safety-советы-новичкам",
  "safety-бюджет",
  "safety-с-ребёнком",
  "safety-летом",
  "money-бюджет",
  "money-советы-новичкам",
  "money-90-дней",

  // Связь
  "internet-бюджет",
  "internet-за-3-дня",

  // Буэнос-Айрес: сезоны
  "buenos-aires-летом",
  "buenos-aires-осенью",
  "buenos-aires-зимой",
  "buenos-aires-весной",

  // Патагония: сезоны и практика
  "patagonia-летом",
  "patagonia-бюджет",
  "patagonia-фото",
  "patagonia-camping",
  "patagonia-осенью",
  "patagonia-весной",

  // Игуасу
  "iguazu-бюджет",
  "iguazu-летом",
  "iguazu-с-ребёнком",
  "iguazu-фото",
  "iguazu-сезон-дождей",

  // Северо-запад
  "northwest-летом",
  "northwest-весной",
  "northwest-фото",
  "northwest-с-ребёнком",
  "northwest-за-7-дней",

  // Нацпарки
  "national-park-летом",
  "national-park-camping",
  "national-park-фото",
  "national-park-советы-новичкам",

  // Районы BA
  "ba-district-microcentro",

  // Маршруты
  "itinerary-за-7-дней",
  "itinerary-за-5-дней",
  "itinerary-летом",
  "itinerary-с-ребёнком",
  "itinerary-стоповер",
  "itinerary-с-чем-совмещать",

  // Кухня
  "food-бюджет",
  "food-советы-новичкам",
  "food-с-ребёнком",

  // Треккинг, вино, природа, транспорт
  "trekking-бюджет",
  "trekking-летом",
  "wine-бюджет",
  "wine-летом",
  "wildlife-летом",
  "wildlife-фото",
  "transport-бюджет",
  "transport-советы-новичкам",
];
