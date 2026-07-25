/**
 * Structured data for the order-scenario cards widget — mirrors the three
 * scenarios previously written as plain markdown in the SSOT body text.
 */
export type SteakOrderScenario = {
  id: string;
  title: string;
  items: string[];
  phrase?: string;
  phraseRu?: string;
  note: string;
};

export const STEAK_ORDER_SCENARIOS_UI = {
  ariaLabel: "Три готовых сценария заказа",
  title: "Три готовых сценария заказа",
  hint: "Готовые заготовки для разного состава компании — уточняйте вес и наличие перед заказом.",
} as const;

export const STEAK_ORDER_SCENARIOS: SteakOrderScenario[] = [
  {
    id: "solo",
    title: "🧍 Один человек, первое знакомство",
    items: [
      "Bife de chorizo или ojo de bife",
      "A punto, pero rosado en el centro",
      "Одна небольшая guarnición",
      "Вода, бокал вина или безалкогольный напиток",
    ],
    note: "Перед заказом спросите вес. Если кусок очень большой, откажитесь от закуски или выберите меньшую порцию.",
  },
  {
    id: "duo",
    title: "🧑‍🤝‍🧑 Два человека, хочется попробовать разное",
    items: [
      "Одна provoleta",
      "Два разных небольших отруба либо один крупный кусок для разделения",
      "Один-два гарнира",
      "Chimichurri и salsa criolla",
    ],
    phrase: "Queremos probar dos cortes diferentes. ¿Qué nos recomienda y qué se puede compartir?",
    phraseRu: "Мы хотим попробовать два разных отруба. Что вы порекомендуете и чем можно поделиться?",
    note: "Уточните, можно ли разделить крупный отруб на двоих без доплаты за подачу.",
  },
  {
    id: "group",
    title: "👨‍👩‍👧‍👦 Компания, хочется приблизиться к логике asado",
    items: [
      "Chorizo и при желании morcilla или mollejas",
      "Asado de tira",
      "Vacío или другой крупный отруб",
      "Салат и картофель",
      "Подача частями, а не всё одновременно",
    ],
    note: "Уточните, входит ли в parrillada то, что компания не ест. Не заказывайте большое ассорти вслепую: значительную часть могут составлять субпродукты.",
  },
];
