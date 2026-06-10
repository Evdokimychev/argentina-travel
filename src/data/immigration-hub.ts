import { contentPageListItem, getPagesBySection } from "@/lib/content-pages";

export { IMMIGRATION_HUB } from "@/data/immigration-hub-content";

export const IMMIGRATION_HUB_INTRO =
  "Справочные материалы о въезде в Аргентину, документах и видах на жительство. Перед поездкой или подачей на ВНЖ сверяйтесь с официальными источниками Migraciones и консульством.";

export const IMMIGRATION_HUB_ARTICLES = getPagesBySection("immigration").map(contentPageListItem);

export const IMMIGRATION_HUB_RELATED = [
  {
    id: "imm-hub-guide",
    label: "Путеводитель",
    href: "/guide",
    description: "Сезоны, культура и планирование поездки",
  },
  {
    id: "imm-hub-travel",
    label: "Как добраться",
    href: "/guide/kak-dobratsya#entry-docs",
    description: "Документы и правила въезда",
  },
  {
    id: "imm-hub-faq",
    label: "Частые вопросы",
    href: "/faq",
    description: "Бронирование и работа с организаторами",
  },
  {
    id: "imm-hub-contacts",
    label: "Контакты",
    href: "/contacts",
    description: "Вопросы по платформе и сотрудничеству",
  },
] as const;
