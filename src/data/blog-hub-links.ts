import type { BlogRelatedResource } from "@/types";

/** Постоянные ссылки из боковой панели блога на ключевые разделы сайта */
export const BLOG_HUB_LINKS: BlogRelatedResource[] = [
  {
    label: "Путеводитель",
    href: "/guide",
    type: "guide",
    description: "Жильё, транспорт, деньги, безопасность",
  },
  {
    label: "Иммиграция и въезд",
    href: "/immigration",
    type: "immigration",
    description: "Визы, ВНЖ, документы",
  },
  {
    label: "Авторские туры",
    href: "/tours",
    type: "tour",
    description: "Патагония, Буэнос-Айрес, Мендоса и др.",
  },
  {
    label: "Когда ехать",
    href: "/guide/pogoda-i-sezonnost",
    type: "guide",
    description: "Сезоны по регионам",
  },
  {
    label: "Экономика и деньги",
    href: "/guide/ekonomika-i-dengi",
    type: "guide",
    description: "Курс, обмен, карты",
  },
];
