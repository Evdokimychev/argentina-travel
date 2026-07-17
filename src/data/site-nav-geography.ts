import type { SiteNavLink } from "@/types/site-nav";

/** Compact destination DTOs for the client header; no galleries or media bindings. */
export const SITE_NAV_POPULAR_DESTINATIONS = [
  {
    id: "ba",
    name: "Буэнос-Айрес",
    description: "Танго, архитектура и гастрономия — идеальный старт маршрута",
  },
  {
    id: "bariloche",
    name: "Барилоче",
    description:
      "Озеро Науэль-Уапи, гора Серро-Катедраль и знаменитые шоколадные мастерские",
  },
  {
    id: "calafate",
    name: "Эль-Калафате",
    description: "Ледник Perito Moreno и ледниковые трекинги",
  },
  {
    id: "ushuaia",
    name: "Ушуайя",
    description: "Один из самых южных городов мира и главные ворота к Антарктиде",
  },
  {
    id: "iguazu",
    name: "Пуэрто-Игуасу",
    description:
      "Около 275 водопадов и Гарганта-дель-Дьябло — объект Всемирного наследия ЮНЕСКО",
  },
  {
    id: "mendoza",
    name: "Мендоса",
    description: "Мальбек и винодельни (bodegas) у подножия Аконкагуа",
  },
  {
    id: "salta",
    name: "Сальта",
    description:
      "Кафаяте, винные долины и колониальный центр; рядом — Кебрада-де-Умауака (Жужуй)",
  },
  {
    id: "patagonia",
    name: "Патагония",
    description: "Ледники, Fitz Roy и бескрайние степи юга",
  },
] as const;

export const SITE_NAV_POPULAR_PLACE_LINKS: SiteNavLink[] = [
  {
    id: "place-iguazu-falls",
    label: "Водопады Игуасу",
    href: "/places/iguazu-falls",
    description: "Около 275 водопадов на границе Аргентины и Бразилии.",
  },
  {
    id: "place-perito-moreno-glacier",
    label: "Ледник Перито-Морено",
    href: "/places/perito-moreno-glacier",
    description:
      "Активный (наступающий) ледник со смотровыми тропами и трекингом по льду.",
  },
  {
    id: "place-buenos-aires",
    label: "Буэнос-Айрес",
    href: "/places/buenos-aires",
    description: "Столица с европейским характером, танго и гастрономией.",
  },
  {
    id: "place-fitz-roy",
    label: "Фиц-Рой (Fitz Roy, Cerro Chaltén)",
    href: "/places/fitz-roy",
    description: "Знаковая гранитная вершина Патагонии, вид с Laguna de los Tres.",
  },
  {
    id: "place-ushuaia",
    label: "Ушуайя",
    href: "/places/ushuaia",
    description: "Самый южный город мира на берегу канала Бигль.",
  },
];

export const SITE_NAV_PLANNING_SEARCH_LINKS: SiteNavLink[] = [
  {
    id: "geo-search-Аргентина",
    label: "Аргентина",
    href: "/destinations",
    description: "Аргентина",
  },
  {
    id: "geo-search-Перито-Морено",
    label: "Перито-Морено",
    href: "/tours?query=%D0%9F%D0%B5%D1%80%D0%B8%D1%82%D0%BE-%D0%9C%D0%BE%D1%80%D0%B5%D0%BD%D0%BE",
    description: "Патагония",
  },
  {
    id: "geo-search-Лаго Аргентино",
    label: "Лаго Аргентино",
    href: "/tours?query=%D0%9B%D0%B0%D0%B3%D0%BE%20%D0%90%D1%80%D0%B3%D0%B5%D0%BD%D1%82%D0%B8%D0%BD%D0%BE",
    description: "Патагония",
  },
];
