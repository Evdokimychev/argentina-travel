/**
 * Связь «Блог → База знаний».
 *
 * База знаний (/baza-znaniy) — единый источник справочной информации. Статьи блога
 * ссылаются на профильные записи базы как на первоисточник: читатель переходит от
 * блог-материала к структурированному разбору без ручного поиска.
 *
 * Карта: slug статьи блога → записи базы знаний (ресурсы типа "knowledge").
 * Чистые данные (без fs), безопасно импортируются где угодно.
 */
import type { BlogRelatedResource } from "@/types";

function kb(id: string, label: string): BlogRelatedResource {
  return { label, href: `/baza-znaniy/${id}`, type: "knowledge" };
}

export const BLOG_KB_LINKS: Record<string, BlogRelatedResource[]> = {
  "iguazu-garganta-del-diablo": [kb("iguasu", "Национальный парк Игуасу")],
  "national-park-circuito-chico": [
    kb("nauel-uapi", "Национальный парк Науэль-Уапи"),
    kb("bariloche", "Барилоче"),
  ],
  "national-park-laguna-de-los-tres": [kb("los-glasiares", "Национальный парк Лос-Гласьярес")],
  "trekking-laguna-de-los-tres": [kb("los-glasiares", "Национальный парк Лос-Гласьярес")],
  "trekking-mini-trekking": [kb("perito-moreno", "Ледник Перито-Морено")],
  "wine-malbec": [kb("vino-argentiny", "Вино Аргентины")],
  "wine-bodega-tour": [kb("vino-argentiny", "Вино Аргентины"), kb("mendoza", "Мендоса")],
  "food-malbec": [kb("vino-argentiny", "Вино Аргентины")],
  "wildlife-whale-watching": [
    kb("peninsula-valdes", "Полуостров Вальдес"),
    kb("dikaya-priroda", "Дикая природа Аргентины"),
  ],
  "wildlife-penguins": [
    kb("punta-tombo", "Пунта-Томбо"),
    kb("peninsula-valdes", "Полуостров Вальдес"),
  ],
  "wildlife-condors": [kb("dikaya-priroda", "Дикая природа Аргентины")],
  "wildlife-guanaco": [kb("dikaya-priroda", "Дикая природа Аргентины")],
  "food-asado": [kb("asado", "Асадо")],
  "food-empanadas": [kb("empanadas", "Эмпанадас")],
  "food-mate": [kb("mate", "Мате")],
  "ba-district-palermo": [kb("buenos-aires", "Буэнос-Айрес")],
  "ba-district-recoleta": [
    kb("buenos-aires", "Буэнос-Айрес"),
    kb("kladbische-recoleta", "Кладбище Реколета"),
  ],
  "ba-district-san-telmo": [kb("buenos-aires", "Буэнос-Айрес")],
  "ba-district-puerto-madero": [kb("buenos-aires", "Буэнос-Айрес")],
  "ba-district-microcentro": [kb("buenos-aires", "Буэнос-Айрес")],
  "itinerary-open-jaw": [
    kb("argentina-2-nedeli", "Маршрут по Аргентине на 2 недели"),
    kb("vnutrennie-aviabilety", "Внутренние авиабилеты"),
  ],
  "relocation-visa-free": [kb("viza-i-granica-dlya-rossiyan", "Виза и граница для россиян")],
  "patagonia-camping": [
    kb("kemping-i-palatki", "Кемпинг и палатки"),
    kb("patagonia", "Патагония"),
  ],
  "national-park-camping": [kb("kemping-i-palatki", "Кемпинг и палатки")],
};

/** Ссылки на базу знаний для статьи блога (пустой массив, если сопоставления нет). */
export function getBlogKbLinks(slug: string): BlogRelatedResource[] {
  return BLOG_KB_LINKS[slug] ?? [];
}
